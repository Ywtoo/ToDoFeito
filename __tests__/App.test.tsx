/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock StorageService
jest.mock('../src/services/storage', () => ({
  StorageService: {
    loadTodos: jest.fn().mockResolvedValue([]),
    saveTodos: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock notification services
jest.mock('../src/services/notification', () => ({
  cancelNotificationById: jest.fn(),
  scheduleVerificationCycle: jest.fn().mockReturnValue('id1,id2'),
  scheduleNotificationFor: jest.fn().mockReturnValue('reminder-id'),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
