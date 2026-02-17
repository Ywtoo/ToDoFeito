import { StyleSheet, Platform } from 'react-native';

export const stylesTodoItem = StyleSheet.create({
  // ===== Layout / Card =====
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  // ===== Checkbox / Indicator =====
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
  checkboxPressed: {
    opacity: Platform.OS === 'android' ? 1 : 0.7,
  },

  // ===== Content (title + description) =====
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    color: '#202124',
  },
  titleCompleted: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  description: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },

  // ===== Right column (due date + actions) =====
  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  dueDate: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 8,
  },
  smallDate: {
    fontSize: 10,
    color: '#666',
  },

  // ===== Actions / Buttons =====
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 18,
    color: '#1a73e8',
  },

  // ===== Remove specific =====
  remove: {
    color: '#d93025',
    fontSize: 22,
  },
  removeButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
});