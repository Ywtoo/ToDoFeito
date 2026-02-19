import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createBaseModalStyles } from '../styles/BaseModal.styles';

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryButton?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
  secondaryButton?: {
    label: string;
    onPress: () => void;
  };
}

export const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  title,
  children,
  primaryButton,
  secondaryButton,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createBaseModalStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
      transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          {children}

          <View style={styles.modalButtons}>
            {secondaryButton && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={secondaryButton.onPress}>
                <Text style={styles.cancelButtonText}>{secondaryButton.label}</Text>
              </TouchableOpacity>
            )}
            {primaryButton && (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, primaryButton.disabled && styles.buttonDisabled]}
                onPress={primaryButton.onPress}
                disabled={primaryButton.disabled}>
                <Text style={[styles.buttonText, primaryButton.disabled && styles.buttonTextDisabled]}>
                  {primaryButton.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
