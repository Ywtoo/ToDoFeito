import { StyleSheet } from 'react-native';
import { spacing, borderRadius, shadows, Theme, colors } from './variables';

export type LabelsStyleOpts = {
  insetsTop?: number;
};

export const createLabelsStyles = (theme: Theme, opts?: LabelsStyleOpts) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: opts?.insetsTop || 0,
  },
  listContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  accordionItem: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: theme.surface,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: spacing.xs,
    opacity: 0.6,
  },
  accordionContent: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.md + spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  chevronIcon: {
    marginRight: spacing.sm,
  },
  cloudIconHeader: {
    marginLeft: spacing.sm,
  },
  labelName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  labelCount: {
    fontSize: 14,
    color: theme.textTertiary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  labelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: 'auto',
  },
  actionButton: {
    padding: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  detailText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontSize: 16,
    color: theme.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
    backgroundColor: colors.primary,
  },
  previewContainer: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  previewDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
    borderColor: theme.border,
    color: theme.text,
    backgroundColor: theme.background,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: theme.text,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: theme.primary,
    transform: [{ scale: 1.1 }],
  },
});

export const getColorDotStyle = (color: string) => ({
  backgroundColor: color,
});
