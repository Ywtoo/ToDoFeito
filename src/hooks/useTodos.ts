import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { Todo } from '../types';
import { StorageService } from '../services/storage';
import {
  scheduleVerificationCycle,
  scheduleNotificationFor,
  cancelNotificationById,
} from '../services/notification';

export function useTodos() {
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
    const target = todos.find(t => t.id === id);
    if (target) cancelNotificationById(target.notificationId);
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }

  return { todos, add, toggle, remove, updateFields };
}
