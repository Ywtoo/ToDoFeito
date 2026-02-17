jest.mock('react-native-push-notification', () => ({
  localNotificationSchedule: jest.fn(),
  localNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

import PushNotification from 'react-native-push-notification';
import {
  scheduleVerificationCycle,
  scheduleNotificationFor,
  cancelNotificationById,
} from '../src/services/notification';
import { Todo } from '../src/types';

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleVerificationCycle', () => {
    it('should return empty array when todo has no dueAt', () => {
      const todo = { id: '1', title: 'Test' } as Todo;
      const result = scheduleVerificationCycle(todo, false);
      
      expect(result).toEqual([]);
      expect(PushNotification.localNotificationSchedule).not.toHaveBeenCalled();
    });

    it('should schedule multiple notifications for future dueAt', () => {
      const todo = {
        id: '1',
        title: 'Test Task',
        dueAt: Date.now() + 10 * 60 * 60 * 1000, // 10h no futuro
      } as Todo;

      const result = scheduleVerificationCycle(todo, false);
      
      expect(result.length).toBeGreaterThan(0);
      expect(PushNotification.localNotificationSchedule).toHaveBeenCalled();
    });

    it('should use immediate offset when startFromNow is true', () => {
      const todo = {
        id: '1',
        title: 'Test Task',
        dueAt: Date.now() + 10 * 60 * 60 * 1000,
      } as Todo;

      const result = scheduleVerificationCycle(todo, true);
      
      expect(result.length).toBeGreaterThan(0);
      expect(PushNotification.localNotificationSchedule).toHaveBeenCalled();
    });

    it('should skip past timestamps with short offsets', () => {
      // Use custom short offsets para garantir que fiquem no passado
      const todo = {
        id: '1',
        title: 'Test Task',
        dueAt: Date.now() - 1000, // passado
      } as Todo;

      const result = scheduleVerificationCycle(todo, false, [100, 200, 300]); // offsets curtos
      
      // Com dueAt no passado e offsets pequenos, todos ficarão no passado
      expect(result.length).toBeLessThanOrEqual(1); // Pode agendar 0 ou poucos
    });
  });

  describe('scheduleNotificationFor', () => {
    it('should return undefined when todo has no reminderInterval', () => {
      const todo = { id: '1', title: 'Test' } as Todo;
      const result = scheduleNotificationFor(todo);
      
      expect(result).toBeUndefined();
    });

    it('should schedule notification for future reminderInterval', () => {
      const todo = {
        id: '1',
        title: 'Test Task',
        reminderInterval: Date.now() + 30 * 60 * 1000, // 30min futuro
      } as Todo;

      const result = scheduleNotificationFor(todo);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(PushNotification.localNotificationSchedule).toHaveBeenCalled();
    });

    it('should send immediate notification for past reminderInterval', () => {
      const todo = {
        id: '1',
        title: 'Test Task',
        reminderInterval: Date.now() - 1000, // passado
      } as Todo;

      const result = scheduleNotificationFor(todo);
      
      expect(result).toBeDefined();
      expect(PushNotification.localNotification).toHaveBeenCalled();
    });
  });

  describe('cancelNotificationById', () => {
    it('should handle undefined gracefully', () => {
      expect(() => cancelNotificationById(undefined)).not.toThrow();
      expect(PushNotification.cancelLocalNotification).not.toHaveBeenCalled();
    });

    it('should cancel single ID', () => {
      cancelNotificationById('123');
      
      expect(PushNotification.cancelLocalNotification).toHaveBeenCalledWith('123');
    });

    it('should cancel multiple IDs from CSV string', () => {
      cancelNotificationById('123,456,789');
      
      expect(PushNotification.cancelLocalNotification).toHaveBeenCalledTimes(3);
      expect(PushNotification.cancelLocalNotification).toHaveBeenCalledWith('123');
      expect(PushNotification.cancelLocalNotification).toHaveBeenCalledWith('456');
      expect(PushNotification.cancelLocalNotification).toHaveBeenCalledWith('789');
    });

    it('should handle array of IDs', () => {
      cancelNotificationById(['123', '456']);
      
      expect(PushNotification.cancelLocalNotification).toHaveBeenCalledTimes(2);
    });
  });
});
