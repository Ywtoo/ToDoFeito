import { StyleSheet } from 'react-native';
import { spacing, borderRadius, Theme, scaleFont } from './variables';

export const createLabelPickerStyles = (theme: Theme, fontScale = 1) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.sm,
  },
  labelChip: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.round,
    borderWidth: 2,
  },
  labelText: {
    fontSize: scaleFont(14, fontScale),
    fontWeight: '600',
  },
});

export const getLabelChipStyle = (theme: Theme, color: string, isSelected: boolean) => ({
  backgroundColor: isSelected ? color : 'transparent',
  borderColor: color,
});

export const getLabelTextStyle = (theme: Theme, isSelected: boolean) => ({
  color: isSelected ? '#FFFFFF' : theme.text,
});
