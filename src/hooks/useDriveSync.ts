import { useCallback } from 'react';
import { Label, Todo } from '../types';
import { useAccountManagement } from './useAccountManagement';
import { useLabelSync } from './useLabelSync';
import { useLabelOperations } from './useLabelOperations';
import { useNotification } from './useNotification.shared';
import { restoreFromDrive, mergeWithDrive } from '../services/drive/sync';
import { StorageService } from '../services/storage';
import { cleanLabelsForMerge } from './useDriveSync.helpers';

/**
 * Hook principal que orquestra autenticação, sincronização e operações de labels
 * Compõe hooks especializados e adiciona lógica de resolução de conflitos
 */
export const useDriveSync = (
  labels: Label[],
  getTodosByLabel: (labelId: string) => Todo[],
  updateLabel: (labelId: string, updates: Partial<Label>) => void,
  updateTodos: (todos: Todo[], labelId?: string) => void,
  importLabel: (label: Label) => string,
  setLabels: (labels: Label[]) => void,
) => {
  // Hook de notificações compartilhado
  const { notification, showSuccess, showError, clearNotification } = useNotification();

  // Hook de gerenciamento de conta (apenas auth)
  const accountManagement = useAccountManagement();

  // Hook de sincronização de labels
  const labelSync = useLabelSync(
    accountManagement.user,
    labels,
    getTodosByLabel,
    updateLabel,
    updateTodos,
    importLabel
  );

  // Hook de operações com labels
  const labelOperations = useLabelOperations(
    accountManagement.user,
    labels,
    importLabel,
    updateTodos,
    setLabels,
    showError, // Callback para mostrar erros
  );

  /**
   * Resolve conflito de conta: Merge (Compara datas e mantém dados mais recentes)
   */
  const resolveConflictMerge = useCallback(async () => {
    const conflict = accountManagement.accountConflict;
    if (!conflict) return;

    try {
      

      // 1. Atualiza usuário atual primeiro
      await accountManagement.setAuthenticatedUser(conflict.pendingUser);

      // 2. Faz merge comparando datas (mantém os mais recentes)
      const mergeResult = await mergeWithDrive(labels, getTodosByLabel ? Object.values(labels).flatMap(l => getTodosByLabel(l.id)) : []);
      
      if (mergeResult) {
        
        // 3. Limpa metadata para forçar upload dos dados mergeados
        const cleanLabels = cleanLabelsForMerge(mergeResult.labels);
        setLabels(cleanLabels);
        updateTodos(mergeResult.todos);
        
        // 4. Persistir
        await StorageService.saveLabels(cleanLabels);
        await StorageService.saveTodos(mergeResult.todos);
        
        // 5. Limpar conflito
        accountManagement.clearConflict();
        showSuccess('Dados mesclados com sucesso. Sincronização preparada.');
      } else {
        showError('Não foi possível fazer o merge. Tente novamente.');
      }
    } catch (error) {
      console.error('Merge error:', error);
      showError('Erro ao mesclar dados');
    }
  }, [accountManagement, labels, getTodosByLabel, setLabels, updateTodos, showSuccess, showError]);

  /**
   * Resolve conflito de conta: Restore (Limpa dados locais e baixa tudo do Drive)
   */
  const resolveConflictRestore = useCallback(async () => {
    const conflict = accountManagement.accountConflict;
    if (!conflict) return;

    try {
      

      // 1. Seta usuário antes de chamar API
      await accountManagement.setAuthenticatedUser(conflict.pendingUser);

      // 2. Limpa TODOS os dados locais (exceto login que já foi setado acima)
      setLabels([]);
      updateTodos([]);
      await StorageService.saveLabels([]);
      await StorageService.saveTodos([]);

      // 3. Chama restoreFromDrive para baixar tudo
      const restoreResult = await restoreFromDrive();
      
      if (restoreResult) {
        // 4. Substitui dados locais com dados do Drive
        setLabels(restoreResult.labels);
        updateTodos(restoreResult.todos);
        
        await StorageService.saveLabels(restoreResult.labels);
        await StorageService.saveTodos(restoreResult.todos);
        
        // 5. Limpar conflito
        accountManagement.clearConflict();
        showSuccess('Dados restaurados da nova conta.');
      } else {
        showError('Não foi possível restaurar os dados. Tente novamente.');
      }

    } catch (error) {
      console.error('Restore error:', error);
      showError('Erro na restauração');
    }
  }, [accountManagement, setLabels, updateTodos, showSuccess, showError]);

  /**
   * Cancela o sign-in e limpa o conflito
   */
  const cancelSignIn = useCallback(async () => {
    await accountManagement.signOut();
    accountManagement.clearConflict();
  }, [accountManagement]);

  /**
   * Faz logout e corta todos os compartilhamentos
   */
  const signOutWithCleanup = useCallback(async () => {
    try {
      
      // 1. Remove labels compartilhados (onde sou collaborator)
      // 2. Limpa flags de sharing dos labels próprios
      const cleanedLabels = labels
        .filter(label => {
          // Remove labels onde sou apenas colaborador
          if (label.ownershipRole === 'collaborator') {
            return false;
          }
          return true;
        })
        .map(label => ({
          ...label,
          shared: false, // Limpa flag de compartilhamento
          ownershipRole: undefined, // Remove role
        }));
      
      // Atualiza estado e persiste
        if (cleanedLabels.length !== labels.length || labels.some(l => l.shared)) {
        setLabels(cleanedLabels);
        await StorageService.saveLabels(cleanedLabels);
      }
      
      // 3. Faz logout
      await accountManagement.signOut();
      
      showSuccess('Logout realizado. Compartilhamentos removidos.');
    } catch (error) {
      console.error('Sign out with cleanup error:', error);
      showError('Erro ao fazer logout');
    }
  }, [accountManagement, labels, setLabels, showSuccess, showError]);

  // Retorna API unificada (compatível com código existente)
  return {
    // Account management
    user: accountManagement.user,
    accountConflict: accountManagement.accountConflict,
    signIn: accountManagement.signIn,
    signOut: signOutWithCleanup, // Wrapper que limpa compartilhamentos antes de logout
    resolveConflictMerge,
    resolveConflictRestore,
    cancelSignIn,
    
    // Label sync
    syncStatus: labelSync.syncStatus,
    syncLabelNow: labelSync.syncLabelNow,
    syncAll: labelSync.syncAll,
    
    // Label operations
    importSharedLabel: labelOperations.importSharedLabel,
    markLabelDeleted: labelOperations.markLabelDeleted,
    restoreLabel: labelOperations.restoreLabel,
    leaveSharedLabel: labelOperations.leaveSharedLabel,
    
    // Notifications (centralized)
    notification,
    clearNotification,
  };
};
