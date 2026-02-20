import { StyleSheet } from 'react-native';
import { spacing, borderRadius, shadows, Theme, colors, scaleFont } from './variables';

export const createBaseModalStyles = (theme: Theme, fontScale = 1) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 540,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    backgroundColor: theme.surface,
    ...shadows.large,
  },
  modalTitle: {
    fontSize: scaleFont(20, fontScale),
    fontWeight: '600',
    marginBottom: spacing.lg,
    color: theme.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: scaleFont(16, fontScale),
    fontWeight: '600',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: theme.onPrimary,
    fontSize: scaleFont(16, fontScale),
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: theme.disabled,
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: theme.textTertiary,
  },
});
