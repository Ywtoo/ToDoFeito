import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { DriveUser, Label, SyncStatus, Todo } from '../types';
import {
  configureGoogleSignIn,
  getCurrentUser,
  signIn as driveSignIn,
  signOut as driveSignOut,
} from '../services/drive/auth';
import { syncLabel, downloadSharedLabel } from '../services/drive/sync';
import { StorageService } from '../services/storage';

export const useDriveSync = (
  labels: Label[],
  getTodosByLabel: (labelId: string) => Todo[],
  updateLabel: (labelId: string, updates: Partial<Label>) => void,
  updateTodos: (todos: Todo[]) => void,
  importLabel: (label: Label) => string
) => {
  const [user, setUser] = useState<DriveUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
  });
  const [syncingLabels, setSyncingLabels] = useState<Set<string>>(new Set());

  // Configura Google Sign-In na montagem
  useEffect(() => {
    configureGoogleSignIn();
    
    // Verifica se já está logado
    const checkUser = async () => {
      console.log('[useDriveSync] Verificando usuário...');
      
      // Primeiro tenta carregar do AsyncStorage (mais rápido)
      const cachedUser = await StorageService.loadDriveUser();
      if (cachedUser) {
        console.log('[useDriveSync] Usuário em cache:', cachedUser.email);
        setUser(cachedUser);
      }
      
      // Depois verifica com o Google (valida sessão)
      const currentUser = await getCurrentUser();
      if (currentUser) {
        console.log('[useDriveSync] Usuário autenticado:', currentUser.email);
        setUser(currentUser);
        await StorageService.saveDriveUser(currentUser);
      } else if (cachedUser) {
        // Se tinha em cache mas getCurrentUser falhou, sessão expirou
        console.log('[useDriveSync] Sessão expirou, limpando cache');
        setUser(null);
        await StorageService.saveDriveUser(null);
      } else {
        console.log('[useDriveSync] Nenhum usuário logado');
      }
    };
    checkUser();
  }, []);

  // Auto-sync quando app volta ao foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
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
  }, [user, labels, syncAll]);

  /**
   * Faz login com Google
   */
  const signIn = useCallback(async (): Promise<boolean> => {
    try {
      const result = await driveSignIn();
      if (result) {
        setUser(result);
        await StorageService.saveDriveUser(result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    }
  }, []);

  /**
   * Faz logout
   */
  const signOut = useCallback(async () => {
    try {
      await driveSignOut();
      setUser(null);
      await StorageService.saveDriveUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  /**
   * Sincroniza um label específico
   */
  const syncLabelNow = useCallback(
    async (labelId: string): Promise<boolean> => {
      if (!user) {
        console.warn('User not authenticated');
        return false;
      }

      // Previne sincronização simultânea do mesmo label
      if (syncingLabels.has(labelId)) {
        console.log('[useDriveSync] Label já está sendo sincronizado:', labelId);
        return false;
      }

      const label = labels.find(l => l.id === labelId);
      if (!label) {
        console.error('Label not found:', labelId);
        return false;
      }

      try {
        setSyncingLabels(prev => new Set(prev).add(labelId));
        setSyncStatus({ status: 'syncing' });

        const todos = getTodosByLabel(labelId);
        const result = await syncLabel(label, todos);

        if (result) {
          // Atualiza label com nova driveMetadata
          updateLabel(labelId, {
            driveMetadata: result.label.driveMetadata,
          });

          // Se houve mudanças nos todos, atualiza apenas os deste label
          if (result.changed) {
            updateTodos(result.todos, labelId);
          }

          setSyncStatus({
            status: 'idle',
            lastSyncAt: Date.now(),
          });

          return true;
        } else {
          setSyncStatus({
            status: 'error',
            error: 'Falha na sincronização',
          });
          return false;
        }
      } catch (error: any) {
        console.error('Sync label error:', error);
        setSyncStatus({
          status: 'error',
          error: error.message || 'Erro desconhecido',
        });
        return false;
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

    setSyncStatus({ status: 'syncing' });

    try {
      for (const label of labels) {
        await syncLabelNow(label.id);
      }

      setSyncStatus({
        status: 'idle',
        lastSyncAt: Date.now(),
      });
    } catch (error: any) {
      console.error('Sync all error:', error);
      setSyncStatus({
        status: 'error',
        error: error.message || 'Erro ao sincronizar',
      });
    }
  }, [user, labels, syncLabelNow]);

  /**
   * Importa um label compartilhado
   */
  const importSharedLabel = useCallback(
    async (
      folderId: string,
      labelName: string
    ): Promise<{ labelId: string; todos: Todo[] } | null> => {
      if (!user) {
        console.warn('User not authenticated');
        return null;
      }

      try {
        setSyncStatus({ status: 'syncing' });

        const data = await downloadSharedLabel(folderId);
        if (!data) {
          throw new Error('Falha ao baixar label compartilhado');
        }

        // Atualiza o nome do label com o que veio do link
        const labelToImport: Label = {
          ...data.label,
          name: labelName,
          shared: true,
          driveMetadata: {
            folderId,
            fileId: '', // Será preenchido no próximo sync
            modifiedTime: new Date().toISOString(),
          },
        };

        const labelId = importLabel(labelToImport);

        setSyncStatus({
          status: 'idle',
          lastSyncAt: Date.now(),
        });

        return {
          labelId,
          todos: data.todos,
        };
      } catch (error: any) {
        console.error('Import shared label error:', error);
        setSyncStatus({
          status: 'error',
          error: error.message || 'Erro ao importar label',
        });
        return null;
      }
    },
    [user, importLabel]
  );

  return {
    user,
    syncStatus,
    signIn,
    signOut,
    syncLabelNow,
    syncAll,
    importSharedLabel,
  };
};
