import { StyleSheet } from 'react-native';

export const stylesTodoModal = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  modal: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  input: {
    backgroundColor: '#F6F7FB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  btn: {
    minWidth: 92,
    marginLeft: 8,
  },
});
