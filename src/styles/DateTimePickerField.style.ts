import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, fontSize, borderRadius, Theme, scaleFont, shadows } from './variables';

export const createDateTimeStyles = (theme: Theme, fontScale = 1) => StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.shadow,
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
    backgroundColor: theme.surface,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 44,
    justifyContent: 'center',
    ...shadows.small,
  },
  inputText: {
    color: theme.text,
    fontSize: scaleFont(fontSize.base, fontScale),
  },
  placeholderText: {
    color: theme.textTertiary,
    fontSize: scaleFont(fontSize.base, fontScale),
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  actionButton: {
    marginLeft: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: scaleFont(fontSize.base, fontScale),
  },
  cancelText: {
    color: theme.error,
  },
  text: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    color: theme.text,
  },
  datePicker: {
    width: '100%'
  },
});