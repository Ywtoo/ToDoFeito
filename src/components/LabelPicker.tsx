import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Label } from '../types';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Label</Text>
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
              style={[
                styles.labelChip,
                {
                  backgroundColor: isSelected
                    ? label.color
                    : theme.cardBackground,
                  borderColor: label.color,
                  borderWidth: 1,
                },
              ]}
              onPress={() => onSelectLabel(label.id)}>
              <Text
                style={[
                  styles.labelText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.text,
                  },
                ]}>
                {label.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  labelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
