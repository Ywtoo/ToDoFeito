import { StyleSheet } from 'react-native';
import { spacing, fontSize, borderRadius, shadows, Theme, colors, scaleFont } from './variables';

export const createSettingsStyles = (theme: Theme, insetsTop: number, fontScale = 1) => StyleSheet.create({
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
    fontSize: scaleFont(fontSize.xxl + 4, fontScale), 
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
    fontSize: scaleFont(fontSize.sm, fontScale),
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
    fontSize: scaleFont(fontSize.base, fontScale),
    fontWeight: '500',
    color: theme.text,
  },
  description: {
    fontSize: scaleFont(fontSize.sm, fontScale),
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
    fontSize: scaleFont(fontSize.base, fontScale),
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
    fontSize: scaleFont(fontSize.base, fontScale),
    color: theme.text,
    fontWeight: '500',
  },
  syncInfo: {
    fontSize: scaleFont(fontSize.sm, fontScale),
    color: theme.textSecondary,
    marginTop: spacing.xs,
  },
  syncError: {
    fontSize: scaleFont(fontSize.sm, fontScale),
    color: '#F44336',
    marginTop: spacing.xs,
  },
  // Theme / font choices
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  choiceButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceVariant,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceButtonActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  choiceLabel: {
    fontSize: scaleFont(fontSize.base, fontScale),
    fontWeight: '600',
    color: theme.textSecondary,
  },
  caret: {
    marginLeft: spacing.sm,
    fontSize: scaleFont(fontSize.base, fontScale),
    color: theme.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '90%',
    maxWidth: 520,
    backgroundColor: theme.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
  modalOption: {
    marginBottom: spacing.sm,
  },
  modalClose: {
    marginTop: spacing.md,
  },
  controlWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  spacerMd: {
    marginTop: spacing.md,
  },
});
