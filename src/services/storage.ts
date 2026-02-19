import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo, Label, DriveUser } from '../types';

const TODOS_KEY = '@todos_v1';
const LABELS_KEY = '@labels_v1';
const DRIVE_USER_KEY = '@drive_user_v1';
const LAST_SYNC_KEY = '@last_sync_v1';
const LAST_SYNCED_EMAIL_KEY = '@last_synced_email_v1';
export const DEFAULT_LABEL_ID = 'default-label';

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

  static async loadLabels(): Promise<Label[]> {
    try {
      const json = await AsyncStorage.getItem(LABELS_KEY);
      if (!json) {
        // Cria label padrão na primeira vez
        const defaultLabel = StorageService.createDefaultLabel();
        await StorageService.saveLabels([defaultLabel]);
        return [defaultLabel];
      }
      return JSON.parse(json);
    } catch (e) {
      console.warn('[StorageService] Erro ao carregar labels:', e);
      return [StorageService.createDefaultLabel()];
    }
  }

  static async saveLabels(labels: Label[]): Promise<void> {
    try {
      await AsyncStorage.setItem(LABELS_KEY, JSON.stringify(labels));
    } catch (e) {
      console.warn('[StorageService] Erro ao salvar labels:', e);
    }
  }

  static createDefaultLabel(): Label {
    return {
      id: DEFAULT_LABEL_ID,
      name: 'Minhas Tarefas',
      color: '#2196F3',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: true,
      shared: false,
    };
  }

  static getDefaultLabelId(): string {
    return DEFAULT_LABEL_ID;
  }

  /**
   * Salva dados do usuário do Google Drive
   */
  static async saveDriveUser(user: DriveUser | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem(DRIVE_USER_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(DRIVE_USER_KEY);
      }
    } catch (e) {
      console.warn('[StorageService] Erro ao salvar drive user:', e);
    }
  }

  /**
   * Carrega dados do usuário do Google Drive
   */
  static async loadDriveUser(): Promise<DriveUser | null> {
    try {
      const json = await AsyncStorage.getItem(DRIVE_USER_KEY);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.warn('[StorageService] Erro ao carregar drive user:', e);
      return null;
    }
  }

  /**
   * Salva timestamp da última sincronização
   */
  static async saveLastSync(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
    } catch (e) {
      console.warn('[StorageService] Erro ao salvar last sync:', e);
    }
  }

  /**
   * Carrega timestamp da última sincronização
   */
  static async loadLastSync(): Promise<number | null> {
    try {
      const value = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (!value) return null;
      return parseInt(value, 10);
    } catch (e) {
      console.warn('[StorageService] Erro ao carregar last sync:', e);
      return null;
    }
  }

  /**
   * Salva o email da última conta sincronizada com sucesso
   */
  static async saveLastSyncedEmail(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNCED_EMAIL_KEY, email);
    } catch (e) {
      console.warn('[StorageService] Erro ao salvar last synced email:', e);
    }
  }

  /**
   * Carrega o email da última conta sincronizada com sucesso
   */
  static async loadLastSyncedEmail(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_SYNCED_EMAIL_KEY);
    } catch (e) {
      console.warn('[StorageService] Erro ao carregar last synced email:', e);
      return null;
    }
  }

  /**
   * Remove o email da última conta sincronizada
   */
  static async clearLastSyncedEmail(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LAST_SYNCED_EMAIL_KEY);
    } catch (e) {
      console.warn('[StorageService] Erro ao limpar last synced email:', e);
    }
  }
}
