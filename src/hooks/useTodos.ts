import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { Todo } from '../types';
import { StorageService } from '../services/storage';
import {
  scheduleVerificationCycle,
  scheduleNotificationFor,
  cancelNotificationById,
} from '../services/notification';
import { cleanupDeletedTodos, countDeletedTodos } from '../services/cleanup';

export function useTodos(defaultLabelId?: string) {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Monitora mudança de estado do app (background -> active)
  // Se houver tarefas atrasadas não concluídas, reactiva o ciclo de cobrança
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        console.log('[useTodos] App voltou para foreground. Verificando atrasos...');
        
        setTodos((currentTodos) => {
          let hasUpdates = false;
          const updatedTodos = currentTodos.map(todo => {
            if (!todo.completed && todo.dueAt && todo.dueAt < now) {
              if (todo.updatedAt && (now - todo.updatedAt < 10000)) {
                return todo;
              }

              console.log(`[useTodos] Tarefa "${todo.title}" está atrasada. Reiniciando ciclo de notificações.`);
              
              // 1. Cancela notificações anteriores desse ciclo (se houver IDs salvos)
              if (todo.notificationId) {
                const oldIds = todo.notificationId.split(',');
                oldIds.forEach(id => cancelNotificationById(id.trim()));
              }

              // 2. Cria novo ciclo começando de AGORA (startFromNow=true -> 1º aviso em 1min)
              const newIdsArray = scheduleVerificationCycle(todo, true);
              const newIds = newIdsArray.length > 0 ? newIdsArray.join(',') : undefined;
              
              hasUpdates = true;
              return { 
                ...todo, 
                notificationId: newIds,
                updatedAt: now 
              };
            }
            return todo;
          });

          return hasUpdates ? updatedTodos : currentTodos;
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const loaded = await StorageService.loadTodos();
      setTodos(loaded);
    })();
  }, []);

  useEffect(() => {
    StorageService.saveTodos(todos);
  }, [todos]);

  function add(data: {
    title: string;
    description?: string;
    dueInitial?: number;
    dueAt?: number;
    reminderInterval?: number;
    labelId?: string;
  }) {
    console.log('[useTodos] add called', data);
    const now = Date.now();

    let reminderInterval: number | undefined;
    if (data.dueAt && data.reminderInterval) {
      reminderInterval = data.dueAt - data.reminderInterval * 60 * 1000;
      console.log('[useTodos] calculated reminderInterval:', { reminderInterval, dueAt: data.dueAt, interval: data.reminderInterval });
    }

    const newTodo: Todo = {
      id: now.toString(),
      title: data.title,
      description: data.description,
      completed: false,
      createdAt: now,
      updatedAt: now,
      dueInitial: data.dueInitial,
      dueAt: data.dueAt,
      reminderInterval,
      labelId: data.labelId || defaultLabelId || StorageService.getDefaultLabelId(),
    };

    const notificationIds: string[] = [];

    if (reminderInterval) {
      console.log('[useTodos] agendando lembrete normal');
      const nid = scheduleNotificationFor(newTodo);
      if (nid) notificationIds.push(nid);
    }

    if (newTodo.dueAt) {
      console.log('[useTodos] agendando ciclo de verificações');
      const cycleIds = scheduleVerificationCycle(newTodo, false);
      if (cycleIds.length > 0) notificationIds.push(...cycleIds);
    }

    if (notificationIds.length > 0) {
      newTodo.notificationId = notificationIds.join(',');
      console.log('[useTodos] Todos criados com Notification IDs:', newTodo.notificationId);
    }

    setTodos(prev => [...prev, newTodo]);
  }

  function toggle(id: string) {
    console.log('[useTodos] toggle called', { id });
    setTodos(prev =>
      prev.map(todo => {
        if (todo.id === id) {
          const updated = {
            ...todo,
            completed: !todo.completed,
            updatedAt: Date.now(),
          };

          // Se a tarefa foi marcada como concluída agora, cancela notificações antigas
          if (!todo.completed && updated.completed) {
            console.log('[useTodos] Tarefa concluida - cancelando notificações');
            if (todo.notificationId) {
              const ids = todo.notificationId.split(',');
              ids.forEach(nid => cancelNotificationById(nid.trim()));
            }
            updated.notificationId = undefined;
          }

          // Se a tarefa foi DESmarcada (estava concluída e agora não), reagendar ciclo iniciando agora
          if (todo.completed && !updated.completed) {
            console.log('[useTodos] Tarefa desmarcada, reagendando ciclo para iniciar AGORA (sem delay inicial)');
            if (todo.notificationId) {
              const ids = todo.notificationId.split(',');
              ids.forEach(nid => cancelNotificationById(nid.trim()));
            }
            if (updated.dueAt) {
              const idsArray = scheduleVerificationCycle(updated, true);
              updated.notificationId = idsArray.length > 0 ? idsArray.join(',') : undefined;
              updated.updatedAt = Date.now();
            }
          }

          return updated;
        }
        return todo;
      }),
    );
  }

function updateFields(
  id: string,
  fields: { title?: string; description?: string; dueAt?: number; reminderInterval?: number },
) {
  console.log('[useTodos] updateFields called', { id, fields });
  setTodos(prev =>
    prev.map(todo => {
      if (todo.id !== id) return todo;

      const updated: Todo = {
        ...todo,
        ...fields,
        updatedAt: Date.now(),
      };

      const dueChanged =
        fields.dueAt !== undefined && fields.dueAt !== todo.dueAt;

      if (dueChanged || fields.reminderInterval !== undefined) {
        if (fields.reminderInterval !== undefined && fields.dueAt !== undefined) {
          updated.reminderInterval = fields.dueAt - fields.reminderInterval * 60 * 1000;
        } else if (dueChanged) {
          if (todo.reminderInterval !== undefined && todo.dueAt !== undefined) {
            const offsetMs = todo.dueAt - todo.reminderInterval;
            updated.reminderInterval = fields.dueAt! - offsetMs;
          } else {
            updated.reminderInterval = todo.reminderInterval;
          }
        }

        cancelNotificationById(todo.notificationId);
        if (updated.reminderInterval && !updated.completed) {
          console.log('[useTodos] reagendando notificação para todo atualizado');
          const nid = scheduleNotificationFor(updated);
          if (nid) {
            updated.notificationId = nid;
          } else {
            updated.notificationId = undefined;
          }
        } else {
          updated.notificationId = undefined;
        }
      }

      return updated;
    }),
  );
}

  function remove(id: string) {
    console.log('[useTodos] remove called (soft delete)', { id });
    const target = todos.find(t => t.id === id);
    if (target) cancelNotificationById(target.notificationId);
    
    // Soft delete - marca como deleted ao invés de excluir
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id 
          ? { ...todo, deleted: true, updatedAt: Date.now() }
          : todo
      )
    );
  }

  /**
   * Retorna todos filtrados por labelId (excluindo deletados)
   */
  const getTodosByLabel = useCallback(
    (labelId: string): Todo[] => {
      return todos.filter(todo => todo.labelId === labelId && !todo.deleted);
    },
    [todos]
  );

  /**
   * Move um todo para outro label
   */
  const moveTodoToLabel = useCallback((todoId: string, newLabelId: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === todoId
          ? { ...todo, labelId: newLabelId, updatedAt: Date.now() }
          : todo
      )
    );
  }, []);

  /**
   * Atualiza múltiplos todos de um label específico (usado para sync do Drive)
   * Faz merge preservando todos de outros labels
   */
  const updateTodos = useCallback((newTodos: Todo[], labelId?: string) => {
    if (!labelId) {
      // Se não tem labelId, substitui tudo (comportamento legado)
      setTodos(newTodos);
      return;
    }

    setTodos(prev => {
      // Remove todos do label atual (exceto deletados antigos que já existiam)
      const otherLabelTodos = prev.filter(t => t.labelId !== labelId);
      
      // Adiciona os novos todos do label
      return [...otherLabelTodos, ...newTodos];
    });
  }, []);

  /**
   * Adiciona múltiplos todos (usado para importação)
   */
  const addTodos = useCallback((newTodos: Todo[]) => {
    setTodos(prev => {
      // Remove duplicatas por ID
      const existingIds = new Set(prev.map(t => t.id));
      const uniqueNewTodos = newTodos.filter(t => !existingIds.has(t.id));
      return [...prev, ...uniqueNewTodos];
    });
  }, []);

  /**
   * Migra todos sem labelId para o label default
   */
  useEffect(() => {
    if (defaultLabelId) {
      setTodos(prev => {
        let hasChanges = false;
        const updated = prev.map(todo => {
          if (!todo.labelId) {
            hasChanges = true;
            return { ...todo, labelId: defaultLabelId };
          }
          return todo;
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [defaultLabelId]);

  /**
   * Limpa permanentemente todos deletados há mais de X dias
   */
  const hardDeleteOldTodos = useCallback((daysOld: number = 30) => {
    setTodos(prev => {
      const cleaned = cleanupDeletedTodos(prev, daysOld);
      const removed = prev.length - cleaned.length;
      if (removed > 0) {
        console.log(`[useTodos] Removidos ${removed} todos deletados antigos`);
      }
      return cleaned;
    });
  }, []);

  /**
   * Retorna quantidade de todos deletados
   */
  const getDeletedCount = useCallback(() => {
    return countDeletedTodos(todos);
  }, [todos]);

  return {
    todos,
    add,
    toggle,
    remove,
    updateFields,
    getTodosByLabel,
    moveTodoToLabel,
    updateTodos,
    addTodos,
    hardDeleteOldTodos,
    getDeletedCount,
  };
}

