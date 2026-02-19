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
   * Sincroniza um label específico
   */
  const syncLabelNow = useCallback(
    async (labelId: string): Promise<Label | null> => {
      if (!user) {
        console.warn('User not authenticated');
        return null;
      }

      // Previne sincronização simultânea do mesmo label
      if (syncingLabels.has(labelId)) {
        console.log('[useLabelSync] Label já está sendo sincronizado:', labelId);
        return null;
      }

      const label = labels.find(l => l.id === labelId);
      if (!label) {
        console.error('Label not found:', labelId);
        return null;
      }

      try {
        setSyncingLabels(prev => new Set(prev).add(labelId));
        setSyncStatus({ status: 'syncing' });

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

          setSyncStatus({
            status: 'idle',
            lastSyncAt: Date.now(),
          });
          await StorageService.saveLastSync(Date.now());

          return updatedLabel;
        } else {
          setSyncStatus({
            status: 'error',
            error: 'Falha na sincronização',
          });
          return null;
        }
      } catch (error: any) {
        console.error('Sync label error:', error);
        setSyncStatus({
          status: 'error',
          error: error.message || 'Erro desconhecido',
        });
        return null;
      } finally {
        setSyncingLabels(prev => {
          const next = new Set(prev);
          next.delete(labelId);
          return next;
        });
      }
    },
    [user, labels, getTodosByLabel, updateLabel, updateTodos, syncingLabels]
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

          console.log(`[useLabelSync] Importando label: ${labelToImport.name}, role=${labelToImport.ownershipRole}, shared=${labelToImport.shared}`);

          const newLabelId = importLabel(labelToImport);
          const todosWithCorrectLabel = (entry.todos || []).map(t => ({ ...t, labelId: newLabelId }));
          updateTodos(todosWithCorrectLabel);
          console.log(`[useLabelSync] Label importado com ${todosWithCorrectLabel.length} todos`);
        } catch (e) {
          console.error('[syncAll] Erro ao aplicar importEntry localmente:', e);
        }
      }

      // Depois sincroniza os labels locais (upload/merge)
      for (const label of labels) {
        currentOp++;
        setSyncStatus({ 
          status: 'syncing', 
          progress: { 
            current: currentOp, 
            total: totalOps, 
            message: `Sincronizando: ${label.name}` 
          } 
        });
        await syncLabelNow(label.id);
      }

      setSyncStatus({ status: 'idle', lastSyncAt });
      await StorageService.saveLastSync(lastSyncAt);
    } catch (error: any) {
      console.error('Sync all error:', error);
      setSyncStatus({ status: 'error', error: error.message || 'Erro ao sincronizar' });
    }
  }, [user, labels, syncLabelNow, importLabel, updateTodos]);

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
