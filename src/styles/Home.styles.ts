import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, Theme } from './variables';

export type HomeStyleOpts = {
  insetsTop?: number;
  fabBottom?: number;
};

export const createHomeStyles = (theme: Theme, opts?: HomeStyleOpts) => StyleSheet.create({
  geral: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flex: 1,
  },

  // Label filter
  labelFilterContainer: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingVertical: spacing.sm,
    paddingTop: opts?.insetsTop ? opts.insetsTop + 8 : 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 1,
  },

  labelFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Dropdown (central) styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '70%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    backgroundColor: theme.surfaceVariant,
    borderColor: theme.border,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  // When dropdown is open, container centered on screen
  centerDropdownContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '40%',
    alignItems: 'center',
    zIndex: 50,
    pointerEvents: 'box-none',
  },
  dropdownBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 49,
  },
  dropdownMenu: {
    marginTop: 8,
    width: '80%',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    ...shadows.small,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Accordion (vertical list of expandable labels)
  accordionContainer: {
    width: '100%',
    paddingTop: opts?.insetsTop ? opts.insetsTop + spacing.md : spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  accordionItem: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  accordionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: theme.text,
  },
  chevronIcon: {
    marginRight: spacing.sm,
  },
  labelCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textTertiary,
    marginLeft: spacing.xs,
  },
  checkmarkIcon: {
    marginLeft: 'auto',
  },
  accordionContent: {
    backgroundColor: 'transparent',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  todoPreviewText: {
    fontSize: 14,
    color: theme.textSecondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  headerDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: spacing.xs,
    opacity: 0.6,
  },

  // FAB (floating action button)
  fabContainer: {
    position: 'absolute',
    right: spacing.xl,
    bottom: typeof opts?.fabBottom === 'number' ? opts.fabBottom : 28,
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

// Helper to produce dynamic styles for label chips (per-item)
export const getLabelChipStyle = (theme: Theme, color: string, isSelected: boolean) => {
  return {
    backgroundColor: isSelected ? color : theme.cardBackground,
    borderColor: color,
  } as any;
};

export const getLabelFilterTextStyle = (theme: Theme, isSelected: boolean) => {
  return {
    color: isSelected ? '#FFFFFF' : theme.text,
  } as any;
};

export const getColorDotStyle = (color: string) => ({
  backgroundColor: color,
});

export const getFabStyle = (_theme: Theme) => {
  return {
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  } as any;
};
