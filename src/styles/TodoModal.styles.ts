import { StyleSheet } from 'react-native';
import { spacing, fontSize, borderRadius, Theme } from './variables';

export const createTodoModalStyles = (theme: Theme) => StyleSheet.create({
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    color: theme.text,
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: theme.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
