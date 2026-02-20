import { useCallback, useState } from 'react';
import { DriveUser, Label, Todo } from '../types';
import { unmarkLabelAsDeleted, ensureAppFolder } from '../services/drive/sync';
import { fetchSharedLabelData, fetchLabelDataByFileId } from '../services/drive/manager';
import { prepareImportSharedLabel } from '../services/drive/importManager';
import { markLabelDeletedOnDrive, leaveSharedLabelLocal } from '../services/drive/hookManager';
import { StorageService } from '../services/storage';

/**
 * Hook responsável por operações com labels (import, restore, delete, leave)
 * NÃO contém notification state (movido para useDriveSync)
 */
export const useLabelOperations = (
  user: DriveUser | null,
  labels: Label[],
  importLabel: (label: Label) => string,
  updateTodos: (todos: Todo[], labelId?: string) => void,
  setLabels: (labels: Label[]) => void,
  onError?: (message: string) => void,
) => {
  const [operationStatus, setOperationStatus] = useState<{
    status: 'idle' | 'syncing' | 'error';
    error?: string;
  }>({ status: 'idle' });

  const markLabelDeleted = useCallback(async (label: Label) => {
    if (!user || !label.driveMetadata) return;
    if (label.ownershipRole === 'collaborator') {
      onError?.('Apenas o proprietário pode deletar este label compartilhado. Você pode apenas sair do label.');
      return;
    }

    try {
      const ok = await markLabelDeletedOnDrive(label);
      if (!ok) console.error('[markLabelDeleted] Falha ao marcar label como deletado');
    } catch (error) {
      console.error('[markLabelDeleted] Error:', error);
    }
  }, [user, onError]);

  /**
   * Restaura um label deletado
   */
  const restoreLabel = useCallback(async (folderId: string): Promise<boolean> => {
    if (!user) {
      console.warn('[restoreLabel] User not authenticated');
      return false;
    }

    try {
      
      
      const appFolderId = await ensureAppFolder();
      if (!appFolderId) {
        console.error('[restoreLabel] Falha ao encontrar pasta do app');
        return false;
      }

      // 1. Remove da lista de deletados
      await unmarkLabelAsDeleted(appFolderId, folderId);
      
      // 2. Busca dados do label no Drive via manager
      const fetched = await fetchSharedLabelData(folderId);
      if (!fetched) {
        console.error('[restoreLabel] Dados do label não encontrados');
        return false;
      }

      const data = fetched.fileId ? await fetchLabelDataByFileId(fetched.fileId) : { label: fetched.label, todos: fetched.todos };
      if (!data) {
        console.error('[restoreLabel] Falha ao baixar dados do label');
        return false;
      }

      // 3. Importa o label
      const labelToImport: Label = {
        ...data.label,
        driveMetadata: {
          folderId,
          fileId: fetched.fileId || '',
          modifiedTime: new Date().toISOString(),
        },
      };

      const newLabelId = importLabel(labelToImport);

      // 4. Importa os todos
      const todosWithCorrectLabel = (data.todos || fetched.todos).map(t => ({ ...t, labelId: newLabelId }));
      updateTodos(todosWithCorrectLabel);

      
      return true;
    } catch (error: any) {
      console.error('[restoreLabel] Error:', error);
      return false;
    }
  }, [user, importLabel, updateTodos]);

  /**
   * Importa um label compartilhado
   */
  const importSharedLabel = useCallback(
    async (
      folderId: string,
      labelName: string
    ): Promise<{ labelId: string; todos: Todo[] } | null> => {
      
      if (!user) {
        console.warn('[useLabelOperations] Usuário não autenticado');
        return null;
      }

      try {
        setOperationStatus({ status: 'syncing' });

        const prepared = await prepareImportSharedLabel(folderId, labelName);
        if (!prepared) throw new Error('Falha ao preparar importação do label compartilhado');

        // Aplica localmente
        const labelToImport: Label = {
          ...prepared.label,
          name: labelName,
          shared: true,
          ownershipRole: 'collaborator',
          driveMetadata: {
            folderId: prepared.folderId,
            fileId: prepared.fileId || '',
            modifiedTime: prepared.modifiedTime || new Date().toISOString(),
          },
        };

        const labelId = importLabel(labelToImport);

        // CORREÇÃO: Garante que os todos importados apontem para o ID do label local
        // (Isso resolve o problema onde o label compartilhado tem um ID diferente do local)
        const todosWithCorrectId = prepared.todos.map(t => ({
          ...t,
          labelId: labelId
        }));

        setOperationStatus({ status: 'idle' });
        await StorageService.saveLastSync(Date.now());

        return { labelId, todos: todosWithCorrectId };
      } catch (error: any) {
        console.error('[useLabelOperations] Erro ao importar label:', error);
        
        // Mensagem específica para erro de permissão
        let errorMessage = 'Erro ao importar label';
        if (error.message?.includes('appNotAuthorizedToFile') || error.message?.includes('not granted')) {
          errorMessage = 'O label compartilhado não está acessível. Peça ao proprietário para compartilhar novamente.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setOperationStatus({
          status: 'error',
          error: errorMessage,
        });
        return null;
      }
    },
    [user, importLabel]
  );

  /**
   * Permite colaborador sair de um label compartilhado
   */
  const leaveSharedLabel = useCallback(async (labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    if (!label) {
      console.error('[leaveSharedLabel] Label não encontrado');
      return false;
    }
    if (label.ownershipRole !== 'collaborator') {
      console.error('[leaveSharedLabel] Apenas colaboradores podem sair');
      return false;
    }

    try {
      const res = await leaveSharedLabelLocal(labelId, labels);
      if (!res) return false;
      setLabels(res.updatedLabels);
      updateTodos(res.filteredTodos);
      
      return true;
    } catch (error) {
      console.error('[leaveSharedLabel] Erro:', error);
      return false;
    }
  }, [labels, setLabels, updateTodos]);

  return {
    markLabelDeleted,
    restoreLabel,
    importSharedLabel,
    leaveSharedLabel,
    operationStatus,
  };
};