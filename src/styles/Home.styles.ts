import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, Theme } from './variables';

export const createHomeStyles = (theme: Theme) => StyleSheet.create({
  geral: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.background,
  },

  // FAB (floating action button)
  fabContainer: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
    zIndex: 10,
    overflow: 'visible',
  },

  fab: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  fabTest: {
    position: 'absolute',
    left: spacing.xl,
    bottom: 28,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.disabled,
    borderRadius: borderRadius.sm,
    ...shadows.medium,
    zIndex: 12,
  },

  fabTestText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
