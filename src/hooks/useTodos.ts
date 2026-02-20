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
                cancelNotificationById(todo.notificationId);
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
      
      // Check for overdue items immediately
      const now = Date.now();
      let hasUpdates = false;
      
      const checkedTodos = loaded.map(todo => {
        if (!todo.completed && todo.dueAt && todo.dueAt <= now) {
           console.log(`[useTodos] Tarefa carregada "${todo.title}" está atrasada. Iniciando ciclo de verificações.`);
           
           if (todo.notificationId) {
             cancelNotificationById(todo.notificationId);
           }

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

      setTodos(checkedTodos);
      if (hasUpdates) {
        StorageService.saveTodos(checkedTodos);
      }
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
    
    // Calculate notification interval logic
    let reminderInterval: number | undefined;
    if (data.dueAt) {
      if (data.reminderInterval !== undefined) {
         reminderInterval = data.dueAt - data.reminderInterval * 60 * 1000;
      }
    }

    // Create the new Todo object
    const newTodo: Todo = {
      id: Math.random().toString(36).substr(2, 9),
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

    if (newTodo.dueAt) {
      console.log('[useTodos] Agendando notificações para nova tarefa');
      
      // 1. Agendar lembrete principal (se configurado)
      if (reminderInterval) {
         console.log('[useTodos] Agendando lembrete principal');
         const nid = scheduleNotificationFor(newTodo);
         if (nid) notificationIds.push(nid);
      }

      console.log('[useTodos] agendando ciclo de verificações');
      // If dueAt is in the past or now, schedule verification cycle starting now
      const startFromNow = newTodo.dueAt <= Date.now();
      const cycleIds = scheduleVerificationCycle(newTodo, startFromNow);
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
              cancelNotificationById(todo.notificationId);
            }
            updated.notificationId = undefined;
          }

          // Se a tarefa foi DESmarcada (estava concluída e agora não), reagendar ciclo iniciando agora
          if (todo.completed && !updated.completed) {
            console.log('[useTodos] Tarefa desmarcada, reagendando ciclo para iniciar AGORA (sem delay inicial)');
            if (todo.notificationId) {
              cancelNotificationById(todo.notificationId);
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
  fields: { title?: string; description?: string; dueInitial?: number | null; dueAt?: number | null; reminderInterval?: number },
) {
  console.log('[useTodos] updateFields called', { id, fields });
  setTodos(prev =>
    prev.map(todo => {
      if (todo.id !== id) return todo;

      const updated: any = {
        ...todo,
        ...fields,
        updatedAt: Date.now(),
      };
      
      // Handle explicit nulls (clearing fields)
      if (fields.dueInitial === null) delete updated.dueInitial;
      if (fields.dueAt === null) delete updated.dueAt;

      // Se mudou a data (dueAt) ou o intervalo de lembrete (reminderInterval), recalcula timestamps
      const dueChanged = fields.dueAt !== undefined && fields.dueAt !== todo.dueAt;
      const reminderChanged = fields.reminderInterval !== undefined;

      // Se algo relevante mudou, recalcula notificationId e reminderInterval
      if (dueChanged || reminderChanged) {
        let newReminderTimestamp: number | undefined;

        // Caso 1: Usuário definiu novo intervalo (em minutos) explícito
        // OBS: Se reminderInterval for undefined, significa que o usuário removeu o lembrete?
        // O tipo em fields diz `reminderInterval?: number`, então se for undefined ele não entra aqui.
        // Mas o updateFields pode ser chamado apenas com { dueAt: ... }, então reminderInterval seria undefined.
        // Se o usuário QUISER remover o lembrete, ele passaria null ou -1?
        // Por hora, assumimos que se reminderInterval vem no fields, é pra atualizar.
        if (reminderChanged) {
           if (updated.dueAt) {
             // fields.reminderInterval é em minutos. 
             // updated.reminderInterval deve ser TIMESTAMP = dueAt - minutos * 60000
             newReminderTimestamp = updated.dueAt - (fields.reminderInterval! * 60 * 1000);
           }
        } 
        // Caso 2: Só mudou a data de vencimento -> Tenta manter o offset relativo anterior
        else if (dueChanged) {
           // Se TÍNHAMOS um lembrete antes, ajustamos
           if (todo.reminderInterval && todo.dueAt && updated.dueAt) {
              const offsetMs = todo.dueAt - todo.reminderInterval;
              // Mantém o mesmo offset
              newReminderTimestamp = updated.dueAt - offsetMs;
           } 
           // Se NÃO tínhamos lembrete, continuamos sem (newReminderTimestamp fica undefined)
        }

        // Garante que se não tem dueAt, não tem reminder
        if (!updated.dueAt) {
            newReminderTimestamp = undefined;
        }

        updated.reminderInterval = newReminderTimestamp;

        // Limpa notificações antigas
        if (todo.notificationId) {
          cancelNotificationById(todo.notificationId);
        }
        
        const newNotificationIds: string[] = [];

        // Reagendar se necessário
        if (updated.dueAt && !updated.completed) {
           console.log('[useTodos] reagendando notificações para todo atualizado', { 
              dueAt: updated.dueAt, 
              reminderInterval: updated.reminderInterval 
           });

          // 1. Agendar lembrete principal (se configurado)
          if (updated.reminderInterval) {
             const nid = scheduleNotificationFor(updated);
             if (nid) newNotificationIds.push(nid);
          }

           // 2. Ciclo de verificações
           // IMPORTANTE: scheduleVerificationCycle deve ser chamado para garantir o "quando acabar"
           const startFromNow = updated.dueAt <= Date.now();
           const cycleIds = scheduleVerificationCycle(updated, startFromNow);
           if (cycleIds.length > 0) newNotificationIds.push(...cycleIds);
           
           if (newNotificationIds.length > 0) {
              updated.notificationId = newNotificationIds.join(',');
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
    if (target) {
      cancelNotificationById(target.notificationId);
    }
    
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

