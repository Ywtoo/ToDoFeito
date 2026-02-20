import { StyleSheet } from 'react-native';
import { scaleFont, Theme, spacing, fontSize, borderRadius } from './variables';

export function createAccountConflictModalStyles(theme: Theme, fontScale = 1) {
  return StyleSheet.create({
    accountInfo: {
      backgroundColor: theme.surfaceVariant,
      borderRadius: borderRadius.sm,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    accountDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: spacing.md,
    },
    accountDetails: {
      flex: 1,
    },
    accountLabel: {
      fontSize: scaleFont(fontSize.xs, fontScale),
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    accountEmail: {
      fontSize: scaleFont(fontSize.sm, fontScale),
      fontWeight: '600',
      color: theme.text,
    },
    warningText: {
      fontSize: scaleFont(fontSize.sm, fontScale),
      color: theme.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    optionCard: {
      backgroundColor: theme.surfaceVariant,
      borderRadius: borderRadius.sm,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    optionTitle: {
      fontSize: scaleFont(fontSize.base, fontScale),
      fontWeight: '700',
      color: theme.text,
    },
    optionDescription: {
      fontSize: scaleFont(fontSize.sm, fontScale),
      color: theme.text,
      lineHeight: 18,
      marginBottom: spacing.sm,
    },
    warningRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    optionNote: {
      fontSize: scaleFont(fontSize.xs, fontScale),
      color: theme.warning,
      fontWeight: '600',
    },
  });
}
