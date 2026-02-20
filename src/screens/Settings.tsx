import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createSettingsStyles } from '../styles/Settings.style';
import ThemedIcon from '../components/ThemedIcon';
import UpdateChecker from '../components/UpdateChecker';
import { useTheme } from '../contexts/ThemeContext';
import { /* spacing, fontSize, borderRadius, shadows */ } from '../styles/variables';
import { DriveUser, SyncStatus } from '../types';

interface SettingsProps {
  user: DriveUser | null;
  syncStatus: SyncStatus;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  syncAll: () => Promise<void>;
}

export default function Settings({ user, syncStatus, signIn, signOut, syncAll }: SettingsProps) {
  const { theme, fontScale, setThemeMode, setFontScale, mode } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSignIn = async () => {
    await signIn();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSync = async () => {
    await syncAll();
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes === 1) return 'Há 1 minuto';
    if (minutes < 60) return `Há ${minutes} minutos`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Há 1 hora';
    if (hours < 24) return `Há ${hours} horas`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const styles = createSettingsStyles(theme, insets.top, fontScale);

  // Theme options and font size mapping
  const themeOptions = [
    { key: 'auto', label: 'Automático' },
    { key: 'light', label: 'Claro' },
    { key: 'blue', label: 'Azul' },
    { key: 'dark', label: 'Escuro' },
    { key: 'veryDark', label: 'Muito Escuro' },
    { key: 'sepia', label: 'Sépia' },
  ];

  const fontOptions = [
    { key: 0.9, label: 'Pequeno' },
    { key: 1, label: 'Normal' },
    { key: 1.15, label: 'Grande' },
    { key: 1.3, label: 'Muito Grande' },
  ];

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [fontModalVisible, setFontModalVisible] = useState(false);

  const getThemeLabel = (k: any) => themeOptions.find(t => t.key === k)?.label || String(k);
  const getFontLabel = (v: number) => fontOptions.find(f => Math.abs(f.key - v) < 0.01)?.label || String(v);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Configurações</Text>
        "rev": "adb -s 192.168.1.6:5555 reverse tcp:8081 tcp:8081"        <UpdateChecker receiveBeta={true} />

        {/* Seção Google Drive */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTA GOOGLE</Text>
          
          {user ? (
            <>
              <View style={styles.userInfo}>
                <ThemedIcon lib="MaterialIcons" name="account-circle" size={40} colorKey="primary" />
                <View style={styles.userInner}>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  {syncStatus.status === 'syncing' && (
                    <Text style={styles.syncInfo}>
                      <ActivityIndicator size="small" /> Sincronizando...
                    </Text>
                  )}
                  {syncStatus.status === 'idle' && (
                    <Text style={styles.syncInfo}>
                      Última sync: {formatLastSync(syncStatus.lastSyncAt)}
                    </Text>
                  )}
                  {syncStatus.status === 'error' && (
                    <Text style={styles.syncError}>
                      Erro: {syncStatus.error}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSync}
                disabled={syncStatus.status === 'syncing'}>
                <ThemedIcon lib="MaterialIcons" name="sync" size={20} colorKey="onPrimary" />
                <Text style={styles.buttonText}>Sincronizar Agora</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleSignOut}>
                <ThemedIcon lib="MaterialIcons" name="logout" size={20} colorKey="onPrimary" />
                <Text style={styles.buttonText}>Sair</Text>
              </TouchableOpacity>

              <Text style={styles.description}>
                Suas tarefas são sincronizadas automaticamente com o Google Drive.
                Compartilhe labels com outras pessoas nas configurações de Labels.
              </Text>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSignIn}>
                <ThemedIcon lib="MaterialIcons" name="account-circle" size={20} colorKey="onPrimary" />
                <Text style={styles.buttonText}>Entrar com Google</Text>
              </TouchableOpacity>

              <Text style={styles.description}>
                Faça login para fazer backup automático e sincronizar suas tarefas
                entre dispositivos. Você também poderá compartilhar labels com outras pessoas.
              </Text>
            </>
          )}
        </View>
        
        {/* Seção Aparência */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APARÊNCIA</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tema</Text>
            <View style={styles.controlWrap}>
              <TouchableOpacity onPress={() => setThemeModalVisible(true)} style={styles.choiceButton}>
                <Text style={styles.choiceLabel}>{getThemeLabel(mode)}</Text>
                <Text style={styles.caret}>▾</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tamanho da Fonte</Text>
            <View style={styles.controlWrap}>
              <TouchableOpacity onPress={() => setFontModalVisible(true)} style={styles.choiceButton}>
                <Text style={styles.choiceLabel}>{getFontLabel(fontScale)}</Text>
                <Text style={styles.caret}>▾</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.description}>
            Personalize a aparência do app. Automático segue o tema do sistema.
          </Text>
        </View>

        {/* Theme Picker Modal */}
        <Modal visible={themeModalVisible} transparent animationType="fade" onRequestClose={() => setThemeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {themeOptions.map(opt => (
                <TouchableOpacity key={String(opt.key)} style={[styles.choiceButton, mode === opt.key && styles.choiceButtonActive, styles.modalOption]} onPress={() => { setThemeMode(opt.key); setThemeModalVisible(false); }}>
                  <Text style={[styles.choiceLabel, mode === opt.key ? { color: theme.onPrimary } : {}]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.choiceButton, styles.modalClose]} onPress={() => setThemeModalVisible(false)}>
                <Text style={styles.choiceLabel}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Font Picker Modal */}
        <Modal visible={fontModalVisible} transparent animationType="fade" onRequestClose={() => setFontModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {fontOptions.map(opt => (
                <TouchableOpacity key={String(opt.key)} style={[styles.choiceButton, Math.abs(fontScale - opt.key) < 0.01 && styles.choiceButtonActive, styles.modalOption]} onPress={() => { setFontScale(opt.key); setFontModalVisible(false); }}>
                  <Text style={[styles.choiceLabel, Math.abs(fontScale - opt.key) < 0.01 ? { color: theme.onPrimary } : {}]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.choiceButton, styles.modalClose]} onPress={() => setFontModalVisible(false)}>
                <Text style={styles.choiceLabel}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}
