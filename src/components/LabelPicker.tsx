import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Label } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { createLabelPickerStyles, getLabelChipStyle, getLabelTextStyle } from '../styles/LabelPicker.style';

interface LabelPickerProps {
  labels: Label[];
  selectedLabelId: string;
  onSelectLabel: (labelId: string) => void;
}

export const LabelPicker: React.FC<LabelPickerProps> = ({
  labels,
  selectedLabelId,
  onSelectLabel,
}) => {
  const { theme, fontScale } = useTheme();
  const styles = React.useMemo(() => createLabelPickerStyles(theme, fontScale), [theme, fontScale]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        {labels.map(label => {
          const isSelected = label.id === selectedLabelId;
          return (
            <TouchableOpacity
              key={label.id}
              style={[styles.labelChip, getLabelChipStyle(theme, label.color, isSelected)]}
              onPress={() => onSelectLabel(label.id)}>
              <Text style={[styles.labelText, getLabelTextStyle(theme, isSelected)]}>
                {label.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Styles are provided by createLabelPickerStyles in ../styles/LabelPicker.style.ts
