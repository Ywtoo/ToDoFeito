jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../src/services/storage';
import { Todo } from '../src/types';

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadTodos', () => {
    it('should return empty array when no data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await StorageService.loadTodos();
      
      expect(result).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@todos_v1');
    });

    it('should return parsed todos when data exists', async () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          completed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTodos));
      
      const result = await StorageService.loadTodos();
      
      expect(result).toEqual(mockTodos);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@todos_v1');
    });

    it('should return empty array on parse error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');
      
      const result = await StorageService.loadTodos();
      
      expect(result).toEqual([]);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      const result = await StorageService.loadTodos();
      
      expect(result).toEqual([]);
    });
  });

  describe('saveTodos', () => {
    it('should save todos as JSON string', async () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          completed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      
      await StorageService.saveTodos(mockTodos);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@todos_v1',
        JSON.stringify(mockTodos)
      );
    });

    it('should handle save errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Save error'));
      
      await expect(
        StorageService.saveTodos([])
      ).resolves.not.toThrow();
    });

    it('should save empty array', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      
      await StorageService.saveTodos([]);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@todos_v1', '[]');
    });
  });
});
