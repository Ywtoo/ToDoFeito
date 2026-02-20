import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, fontSize, borderRadius, shadows, Theme, scaleFont } from './variables';

export const createTodoItemStyles = (theme: Theme, fontScale = 1) => StyleSheet.create({
  // ===== Layout / Card =====
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginVertical: spacing.xs + 2,
    marginHorizontal: spacing.md,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },

  // ===== Checkbox / Indicator =====
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: 'transparent',
  },
  checkboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  check: {
    color: theme.onPrimary,
    fontSize: scaleFont(fontSize.base - 2, fontScale),
    fontWeight: '700',
  },
  checkboxPressed: {
    opacity: Platform.OS === 'android' ? 1 : 0.7,
  },

  // ===== Content (title + description) =====
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: scaleFont(fontSize.lg, fontScale),
    fontWeight: '600',
    color: theme.text,
    letterSpacing: -0.3,
  },
  titleCompleted: {
    color: theme.textTertiary,
    textDecorationLine: 'line-through',
  },
  description: {
    color: theme.textSecondary,
    fontSize: scaleFont(fontSize.sm, fontScale),
    marginTop: spacing.xs - 2,
    lineHeight: 18,
  },

  // ===== Right column (due date + actions) =====
  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: spacing.sm,
  },
  dueDate: {
    fontSize: scaleFont(fontSize.sm, fontScale),
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: spacing.xs,
  },
  smallDate: {
    fontSize: scaleFont(fontSize.xs, fontScale),
    color: theme.textTertiary,
    marginBottom: spacing.xs - 2,
  },

  // ===== Actions / Buttons =====
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },

  // ===== Remove specific =====
  removeButton: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
});