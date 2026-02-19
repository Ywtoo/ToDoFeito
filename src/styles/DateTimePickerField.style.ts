import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, fontSize, borderRadius, Theme } from './variables';

export const createDateTimeStyles = (theme: Theme) => StyleSheet.create({
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
    backgroundColor: theme.background,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  inputText: {
    color: theme.text,
    fontSize: fontSize.base,
  },
  placeholderText: {
    color: theme.textTertiary,
    fontSize: fontSize.base,
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
    fontSize: fontSize.base,
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