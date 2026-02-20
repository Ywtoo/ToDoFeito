import { StyleSheet } from 'react-native';
import { Theme, spacing, fontSize, borderRadius, scaleFont } from './variables';

export function createUpdateCheckerStyles(theme: Theme, fontScale = 1) {
  return StyleSheet.create({
    container: { paddingVertical: spacing.sm },
    containerRight: { paddingVertical: spacing.sm, alignItems: 'flex-end' },
    text: { fontSize: scaleFont(fontSize.sm, fontScale), color: theme.textSecondary },
    error: { fontSize: scaleFont(fontSize.sm, fontScale), color: theme.error },
    updateBox: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: theme.warning + '22', // subtle warning background
      borderColor: theme.warning,
      borderWidth: 1,
      marginBottom: spacing.md,
    },
    updateText: { fontWeight: '600', marginBottom: spacing.sm, color: theme.text },
    button: { backgroundColor: theme.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
    buttonText: { color: theme.onPrimary, fontWeight: '600' },
    small: { marginTop: spacing.xs, fontSize: scaleFont(fontSize.sm, fontScale), color: theme.textSecondary },
  });
}
