import { StyleSheet } from 'react-native';

export const stylesTodoModal = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: { backgroundColor: 'white', padding: 16, borderRadius: 8 },
  input: { borderBottomWidth: 1, marginBottom: 12 },
});
