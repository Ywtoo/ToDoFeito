import { StyleSheet, Platform } from 'react-native';

export const stylesTodoItem = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    // Android elevation
    elevation: 2,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  checkboxCompleted: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  check: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  title: {
    flex: 1,
    fontSize: 22,
    color: '#202124',
  },
  titleCompleted: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },

  removeButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  remove: {
    color: '#d93025',
    fontSize: 22,
  },

  checkboxPressed: {
    opacity: Platform.OS === 'android' ? 1 : 0.7,
  },
});
