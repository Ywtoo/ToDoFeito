import React, { useEffect } from 'react';
import { act, create } from 'react-test-renderer';

jest.mock('react-native-push-notification', () => {
  return {
    createChannel: jest.fn((opts, cb) => cb && cb()),
    requestPermissions: jest.fn().mockResolvedValue({ alert: true, badge: true, sound: true }),
    localNotificationSchedule: jest.fn(),
    localNotification: jest.fn(),
    cancelLocalNotification: jest.fn(),
  };
});

import PushNotification from 'react-native-push-notification';
import { useNotifications } from '../src/hooks/useNotifications';

let api: any = null;

function TestComponent() {
  const hook = useNotifications();
  useEffect(() => {
    api = hook;
  }, [hook]);
  return null;
}

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api = null;
  });

  test('initializes channel and exposes schedule functions', async () => {
    await act(async () => {
      create(<TestComponent />);
    });

    expect(PushNotification.createChannel).toHaveBeenCalled();
    expect(api).not.toBeNull();
    expect(typeof api.scheduleVerificationCycle).toBe('function');
    expect(typeof api.scheduleNotificationFor).toBe('function');
    expect(typeof api.cancelNotificationById).toBe('function');
  });

  test('scheduleVerificationCycle returns CSV string of IDs', async () => {
    await act(async () => {
      create(<TestComponent />);
    });

    const todo = { id: 't1', title: 'Teste', dueAt: Date.now() + 60000 } as any;
    const ids = api.scheduleVerificationCycle(todo, false);

    expect(typeof ids).toBe('string');
    expect(PushNotification.localNotificationSchedule).toHaveBeenCalled();
  });

  test('scheduleNotificationFor uses schedule for future date and immediate for past date', async () => {
    await act(async () => {
      create(<TestComponent />);
    });

    const future = { id: 'f1', title: 'Futuro', reminderInterval: Date.now() + 30_000 } as any;
    const past = { id: 'p1', title: 'Passado', reminderInterval: Date.now() - 5_000 } as any;

    const nidF = api.scheduleNotificationFor(future);
    expect(typeof nidF).toBe('string');
    expect(PushNotification.localNotificationSchedule).toHaveBeenCalled();

    const nidP = api.scheduleNotificationFor(past);
    expect(typeof nidP).toBe('string');
    expect(PushNotification.localNotification).toHaveBeenCalled();
  });
});