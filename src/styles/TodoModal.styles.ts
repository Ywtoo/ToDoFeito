import { StyleSheet } from 'react-native';
import { spacing, fontSize, borderRadius, shadows, Theme } from './variables';

export const createTodoModalStyles = (theme: Theme) => StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: theme.overlay,
  },
  modal: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: theme.surface,
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.borderLight,
    ...shadows.large,
  },
  input: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.base,
    color: theme.text,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  btn: {
    minWidth: 100,
  },
});
