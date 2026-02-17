import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, fontSize, borderRadius, shadows, Theme } from './variables';

export const createTodoItemStyles = (theme: Theme) => StyleSheet.create({
  // ===== Layout / Card =====
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginVertical: spacing.xs + 2,
    marginHorizontal: spacing.md,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.borderLight,
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
    color: '#fff',
    fontSize: fontSize.base - 2,
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
    fontSize: fontSize.lg,
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
    fontSize: fontSize.sm,
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
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: spacing.xs,
  },
  smallDate: {
    fontSize: fontSize.xs,
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