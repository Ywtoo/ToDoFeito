import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, Theme } from './variables';

export const createHomeStyles = (theme: Theme) => StyleSheet.create({
  geral: {
    flex: 1,
    backgroundColor: theme.background,
  },

  // Label filter
  labelFilterContainer: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingVertical: spacing.sm,
  },

  labelFilterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  labelFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
  },

  labelFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },

  emptyText: {
    fontSize: 16,
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
