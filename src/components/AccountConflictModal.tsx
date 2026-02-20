import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createAccountConflictModalStyles } from '../styles/AccountConflictModal.style';
import { BaseModal } from './BaseModal';
import ThemedIcon from './ThemedIcon';
import { DriveUser } from '../types';

type Conflict = {
  localEmail: string;
  remoteEmail: string;
  pendingUser: DriveUser;
} | null;

type Props = {
  visible: boolean;
  conflict: Conflict;
  onMerge: () => void;
  onRestore: () => void;
  onCancel: () => void;
};

export default function AccountConflictModal({ visible, conflict, onMerge, onRestore, onCancel }: Props) {
  const { theme, fontScale } = useTheme();
  const styles = createAccountConflictModalStyles(theme, fontScale);

  if (!conflict) {
    return null;
  }

  console.log('[AccountConflictModal] Exibindo modal de conflito:', {
    localEmail: conflict.localEmail,
    remoteEmail: conflict.remoteEmail,
  });

  const handleMerge = () => {
    console.log('[AccountConflictModal] 🔵 Botão MESCLAR clicado!');
    onMerge();
  };

  const handleRestore = () => {
    console.log('[AccountConflictModal] 🔴 Botão SUBSTITUIR clicado!');
    onRestore();
  };

  const handleCancel = () => {
    console.log('[AccountConflictModal] ⚫ Botão CANCELAR clicado!');
    onCancel();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={handleCancel}
      title="Troca de Conta"
      primaryButton={{ label: 'Mesclar', onPress: handleMerge }}
      secondaryButton={{ label: 'Substituir', onPress: handleRestore }}
    >
      <View>
        <View style={styles.accountInfo}>
          <View style={styles.accountRow}>
            <ThemedIcon lib="MaterialIcons" name="person" size={18} colorKey="textSecondary" />
            <View style={styles.accountDetails}>
              <Text style={styles.accountLabel}>Conta Local</Text>
              <Text style={styles.accountEmail}>{conflict.localEmail}</Text>
            </View>
          </View>
          <View style={styles.accountDivider} />
          <View style={styles.accountRow}>
            <ThemedIcon lib="MaterialIcons" name="cloud" size={18} colorKey="primary" />
            <View style={styles.accountDetails}>
              <Text style={styles.accountLabel}>Conta na Nuvem</Text>
              <Text style={styles.accountEmail}>{conflict.remoteEmail}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.warningText}>
          Escolha uma opção:
        </Text>

        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <ThemedIcon lib="MaterialIcons" name="merge-type" size={22} colorKey="primary" />
            <Text style={styles.optionTitle}>Mesclar</Text>
          </View>
          <Text style={styles.optionDescription}>
            Mantém suas tarefas + adiciona as novas.
          </Text>
          <View style={styles.warningRow}>
            <ThemedIcon lib="MaterialIcons" name="warning" size={14} colorKey="warning" />
            <Text style={styles.optionNote}>Perde compartilhamentos</Text>
          </View>
        </View>

        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <ThemedIcon lib="MaterialIcons" name="cloud-download" size={22} colorKey="error" />
            <Text style={styles.optionTitle}>Substituir</Text>
          </View>
          <Text style={styles.optionDescription}>
            Apaga tudo local e baixa da nuvem.
          </Text>
          <View style={styles.warningRow}>
            <ThemedIcon lib="MaterialIcons" name="warning" size={14} colorKey="warning" />
            <Text style={styles.optionNote}>Perde tarefas locais</Text>
          </View>
        </View>
      </View>
    </BaseModal>
  );
}
 
