/**
 * Serviço de limpeza de dados deletados
 * 
 * O app usa soft delete para preservar dados durante sincronização.
 * Todos marcados como deleted:
 * - São sincronizados com o Drive (outros dispositivos sabem que foram deletados)
 * - Não aparecem nas visualizações
 * - Permanecem no storage local
 * 
 * Este serviço permite fazer hard delete (remoção permanente) de todos antigos.
 */

import { Todo } from '../types';

/**
 * Remove permanentemente todos marcados como deleted há mais de X dias
 * @param todos Lista completa de todos
 * @param daysOld Número de dias (padrão: 30)
 * @returns Lista de todos após limpeza
 */
export const cleanupDeletedTodos = (
  todos: Todo[],
  daysOld: number = 30
): Todo[] => {
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  return todos.filter(todo => {
    // Mantém todos não-deletados
    if (!todo.deleted) {
      return true;
    }

    // Remove deletados antigos
    if (todo.updatedAt < cutoffTime) {
      return false;
    }

    // Mantém deletados recentes (ainda em período de graça)
    return true;
  });
};

/**
 * Conta quantos todos deletados existem
 */
export const countDeletedTodos = (todos: Todo[]): number => {
  return todos.filter(t => t.deleted).length;
};

/**
 * Remove todos deletados de um label específico
 */
export const cleanupDeletedTodosForLabel = (
  todos: Todo[],
  labelId: string,
  daysOld: number = 30
): Todo[] => {
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  return todos.filter(todo => {
    // Mantém todos de outros labels
    if (todo.labelId !== labelId) {
      return true;
    }

    // Mantém todos não-deletados do label
    if (!todo.deleted) {
      return true;
    }

    // Remove deletados antigos do label
    if (todo.updatedAt < cutoffTime) {
      return false;
    }

    return true;
  });
};
