import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { DriveUser, Label, SyncStatus, Todo } from '../types';
import { syncLabel } from '../services/drive/sync';
import { performFullSync } from '../services/drive/syncManager';
import { StorageService } from '../services/storage';

/**
 * Hook responsável por sincronização de labels com Drive
 */
export const useLabelSync = (
  user: DriveUser | null,
  labels: Label[],
  getTodosByLabel: (labelId: string) => Todo[],
  updateLabel: (labelId: string, updates: Partial<Label>) => void,
  updateTodos: (todos: Todo[], labelId?: string) => void,
  importLabel: (label: Label) => string,
  hasConflict: boolean = false, // Se há conflito de conta, bloqueia sync
) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
  });
  const [syncingLabels, setSyncingLabels] = useState<Set<string>>(new Set());

  // Carrega última sync do storage
  useEffect(() => {
    const loadLastSync = async () => {
      const lastSync = await StorageService.loadLastSync();
      if (lastSync) {
        setSyncStatus({ status: 'idle', lastSyncAt: lastSync });
      }
    };
    loadLastSync();
  }, []);

  /**
   * Internal helper to sync a single label without affecting global sync status
   * Returns true if successful, false otherwise
   */
  const _syncLabelInternal = useCallback(async (labelId: string): Promise<Label | null> => {
    if (!user) return null;

    const label = labels.find(l => l.id === labelId);
    if (!label) {
      console.error('Label not found:', labelId);
      return null;
    }

    try {
      setSyncingLabels(prev => new Set(prev).add(labelId));
      
      const todos = getTodosByLabel(labelId);
      const result = await syncLabel(label, todos);

      if (result) {
        // Atualiza label com nova driveMetadata
        const updatedLabel = result.label;
        updateLabel(labelId, {
          driveMetadata: updatedLabel.driveMetadata,
          ownershipRole: label.ownershipRole || 'owner',
        });

        // Se houve mudanças nos todos, atualiza apenas os deste label
        if (result.changed) {
          updateTodos(result.todos, labelId);
        }
        
        return updatedLabel;
      }
      return null;
    } catch (error: any) {
      console.error('Sync label error:', error);
      // We don't set global error status here to avoid disrupting syncAll flow
      return null;
    } finally {
      setSyncingLabels(prev => {
        const next = new Set(prev);
        next.delete(labelId);
        return next;
      });
    }
  }, [user, labels, getTodosByLabel, updateLabel, updateTodos]);

  /**
   * Sincroniza um label específico (Public API)
   */
  const syncLabelNow = useCallback(
    async (labelId: string): Promise<Label | null> => {
      if (!user) {
        console.warn('User not authenticated');
        return null;
      }

      if (syncingLabels.has(labelId)) {
        return null;
      }

      setSyncStatus({ status: 'syncing' });
      
      const result = await _syncLabelInternal(labelId);

      if (result) {
        setSyncStatus({
          status: 'idle',
          lastSyncAt: Date.now(),
        });
        await StorageService.saveLastSync(Date.now());
        return result;
      } else {
        setSyncStatus({
          status: 'error',
          error: 'Falha na sincronização',
        });
        return null;
      }
    },
    [user, syncingLabels, _syncLabelInternal]
  );


  /**
   * Sincroniza todos os labels
   */
  const syncAll = useCallback(async () => {
    if (!user) {
      return;
    }
    setSyncStatus({ 
      status: 'syncing',
      progress: { current: 0, total: 0, message: 'Iniciando sincronização...' }
    });

    try {
      const { importEntries, lastSyncAt } = await performFullSync(labels, (progress) => {
        setSyncStatus(prev => ({
          ...prev,
          status: 'syncing',
          progress
        }));
      });

      // Total de operações locais
      const totalOps = importEntries.length + labels.length;
      let currentOp = 0;

      // Importa localmente as entradas retornadas pelo manager
      for (const entry of importEntries) {
        currentOp++;
        setSyncStatus(prev => ({ 
          ...prev,
          status: 'syncing', 
          progress: { 
            current: currentOp, 
            total: totalOps, 
            message: `Processando item baixado: ${entry.labelData.name}` 
          } 
        }));

        try {
          const labelToImport: Label = {
            ...entry.labelData,
            // Mantém ownership e shared que vieram do syncManager
            ownershipRole: entry.labelData.ownershipRole || 'owner',
            shared: entry.labelData.shared || false,
            driveMetadata: {
              folderId: entry.folderId,
              fileId: entry.fileId || '',
              modifiedTime: entry.modifiedTime || new Date().toISOString(),
            },
          };

          

          const newLabelId = importLabel(labelToImport);
          const todosWithCorrectLabel = (entry.todos || []).map(t => ({ ...t, labelId: newLabelId }));
          // CRITICAL FIX: Pass the labelId to updateTodos to ensure we don't wipe out other todos!
          updateTodos(todosWithCorrectLabel, newLabelId);
          
        } catch (e) {
          console.error('[syncAll] Erro ao aplicar importEntry localmente:', e);
        }
      }

      // Depois sincroniza os labels locais (upload/merge)
      const totalLocalOps = labels.length;
      let processedLocalOps = 0;

      for (const label of labels) {
        processedLocalOps++;
        // Update status only, don't set to idle in loop
        setSyncStatus(prev => ({ // keep previous state
          ...prev, // spread prev to keep any fields
          status: 'syncing', 
          progress: { 
            current: processedLocalOps, 
            total: totalLocalOps, 
            message: `Sincronizando: ${label.name}`
          } 
        }));
        
        // Use internal helper to avoid resetting sync status to idle between labels
        await _syncLabelInternal(label.id);
      }

      setSyncStatus({ status: 'idle', lastSyncAt: Date.now() });
      await StorageService.saveLastSync(Date.now());
      await StorageService.saveLastSync(lastSyncAt);
    } catch (error: any) {
      console.error('Sync all error:', error);
      setSyncStatus({ status: 'error', error: error.message || 'Erro ao sincronizar' });
    }
  }, [user, labels, importLabel, updateTodos, _syncLabelInternal]);

  // Auto-sync quando app volta ao foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Não sincroniza se há conflito de conta
      if (nextAppState === 'active' && user && !hasConflict) {
        syncAll();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [user, hasConflict, syncAll]);

  return {
    syncStatus,
    syncLabelNow,
    syncAll,
  };
};
