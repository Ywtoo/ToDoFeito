import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';

import { Todo } from '../types';

const KEY = '@todos_v1';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    (async () => {
      const json = await AsyncStorage.getItem(KEY);
      if (json) setTodos(JSON.parse(json));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(todos));
  }, [todos]);

  function add(title: string) {
    setTodos(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        title,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
  }

  function toggle(id: string) {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed, updatedAt: Date.now() }
          : todo,
      ),
    );
  }

  function remove(id: string) {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }

  function scheduleNotificationFor(todo: Todo) {
    if (!todo.reminderAt) return;
    const id = todo.id; 
    PushNotification.localNotificationSchedule({
      channelId: 'default-channel-id',
      id,
      title: 'Lembrete',
      message: todo.title,
      date: new Date(todo.reminderAt),
      allowWhileIdle: true,
      playSound: true,
      soundName: 'default',
      userInfo: { todoId: id },
    });
    return id;
  }

  return { todos, add, toggle, remove, scheduleNotificationFor };
}
