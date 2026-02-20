import { StyleSheet } from 'react-native';
import { spacing, fontSize, borderRadius, Theme, scaleFont, shadows } from './variables';

export const createTodoModalStyles = (theme: Theme, fontScale = 1) => StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: scaleFont(fontSize.sm, fontScale),
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: scaleFont(fontSize.base, fontScale),
    color: theme.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.small,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datesContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
});
