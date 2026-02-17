import { StyleSheet, Platform } from 'react-native';

const primaryColor = Platform.select({ ios: '#007aff', android: '#2196f3', default: '#007aff' });
const cancelColor = Platform.select({ ios: '#ff3b30', android: '#f44336', default: '#ff3b30' });
const background = Platform.select({ ios: '#f8f8f8', android: '#fff', default: '#fff' });

export const stylesDateTime = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: background,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // input-like
  inputContainer: {
    backgroundColor: '#F6F7FB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: 12,
  },
  inputText: {
    color: '#111827',
    fontSize: 16,
  },
  placeholderText: {
    color: '#9AA0A6',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingBottom: 8,
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    color: primaryColor,
    fontWeight: '600',
    fontSize: 16,
  },
  cancelText: {
    color: cancelColor,
  },
  text: {
    marginTop: 16,
    marginBottom: 16,
    color: '#333',
  },
  datePicker: {
    width: '100%'
  },
});