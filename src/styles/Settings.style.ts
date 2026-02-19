import { StyleSheet } from 'react-native';
import { spacing, fontSize, borderRadius, shadows, Theme, colors } from './variables';

export const createSettingsStyles = (theme: Theme, insetsTop: number) => StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: { 
    flex: 1, 
    padding: spacing.lg,
    paddingTop: spacing.lg + insetsTop,
  },
  title: { 
    fontSize: fontSize.xxl + 4, 
    fontWeight: '700', 
    marginBottom: spacing.xl,
    color: theme.text,
  },
  section: {
    backgroundColor: theme.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: theme.text,
  },
  description: {
    fontSize: fontSize.sm,
    color: theme.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.error,
  },
  buttonText: {
    color: theme.onPrimary,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  userInner: {
    flex: 1,
  },
  userEmail: {
    fontSize: fontSize.base,
    color: theme.text,
    fontWeight: '500',
  },
  syncInfo: {
    fontSize: fontSize.sm,
    color: theme.textSecondary,
    marginTop: spacing.xs,
  },
  syncError: {
    fontSize: fontSize.sm,
    color: '#F44336',
    marginTop: spacing.xs,
  },
});
