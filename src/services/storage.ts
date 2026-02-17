import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '../types';

const TODOS_KEY = '@todos_v1';

export class StorageService {
  static async loadTodos(): Promise<Todo[]> {
    try {
      const json = await AsyncStorage.getItem(TODOS_KEY);
      if (!json) return [];
      return JSON.parse(json);
    } catch (e) {
      console.warn('[StorageService] Erro ao carregar todos:', e);
      return [];
    }
  }

  static async saveTodos(todos: Todo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos));
    } catch (e) {
      console.warn('[StorageService] Erro ao salvar todos:', e);
    }
  }
}
