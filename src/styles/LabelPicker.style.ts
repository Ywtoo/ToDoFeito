import { StyleSheet } from 'react-native';
import { spacing, borderRadius, Theme } from './variables';

export const createLabelPickerStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: theme.text,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.sm,
  },
  labelChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    borderWidth: 2,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export const getLabelChipStyle = (theme: Theme, color: string, isSelected: boolean) => ({
  backgroundColor: isSelected ? color : 'transparent',
  borderColor: color,
});

export const getLabelTextStyle = (theme: Theme, isSelected: boolean) => ({
  color: isSelected ? '#FFFFFF' : theme.text,
});
