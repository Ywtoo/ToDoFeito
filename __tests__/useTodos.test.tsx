import React from 'react';
import { act, create } from 'react-test-renderer';

// Mock AsyncStorage primeiro
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// Criar os mocks antes de qualquer import
const mockLoadTodos = jest.fn().mockResolvedValue([]);
const mockSaveTodos = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/services/storage', () => ({
  StorageService: {
    loadTodos: mockLoadTodos,
    saveTodos: mockSaveTodos,
  },
}));

const mockCancel = jest.fn();
const mockScheduleCycle = jest.fn().mockReturnValue('id1,id2');
const mockScheduleFor = jest.fn().mockReturnValue('reminder-id');

jest.mock('../src/services/notification', () => ({
  cancelNotificationById: mockCancel,
  scheduleVerificationCycle: mockScheduleCycle,
  scheduleNotificationFor: mockScheduleFor,
}));

jest.mock('../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    hasPermission: true,
  }),
}));
import { useTodos } from '../src/hooks/useTodos';

let api: any = null;

function TestComponent() {
  const hook = useTodos();
  React.useEffect(() => {
    api = hook;
  }, [hook]);
  return null;
}

describe('useTodos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api = null;
  });

  test('add() creates a todo and schedules reminder when provided', async () => {
    await act(async () => {
      create(<TestComponent />);
    });

    const future = Date.now() + 60_000;
    await act(async () => {
      api.add({ title: 'Test', dueAt: future, reminderInterval: 30 });
    });

    expect(mockScheduleFor).toHaveBeenCalled();
    expect(mockScheduleCycle).toHaveBeenCalled();
    expect(mockSaveTodos).toHaveBeenCalled();
    expect(api.todos.length).toBeGreaterThanOrEqual(1);
  });

  test('toggle() cancels notifications when marking completed and reschedules when unmarking', async () => {
    await act(async () => {
      create(<TestComponent />);
    });

    const future = Date.now() + 60_000;
    // add a todo with dueAt so it has notifications
    await act(async () => {
      api.add({ title: 'Toggle test', dueAt: future });
    });

    const id = api.todos[0].id;
    mockCancel.mockClear();
    mockScheduleCycle.mockClear();

    // mark completed - should cancel
    await act(async () => {
      api.toggle(id);
    });

    expect(mockCancel).toHaveBeenCalled();

    // unmark - should reschedule
    await act(async () => {
      api.toggle(id);
    });

    expect(mockScheduleCycle).toHaveBeenCalled();
  });

  test('updateFields() recalculates reminder and reschedules when dueAt changes', async () => {
    await act(async () => {
      create(<TestComponent />);
    });

    const now = Date.now();
    const due = now + 3600_000; // 1h

    await act(async () => {
      api.add({ title: 'Update test', dueAt: due, reminderInterval: 30 });
    });

    const t = api.todos.find((item: any) => item.title === 'Update test');
    expect(t).toBeTruthy();

    const newDue = due + 60_000; // +1 min
    await act(async () => {
      api.updateFields(t.id, { dueAt: newDue });
    });

    expect(mockCancel).toHaveBeenCalled();
    expect(mockScheduleFor).toHaveBeenCalled();
  });
});
