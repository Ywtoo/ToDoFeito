import React from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createSettingsStyles } from '../styles/Settings.style';
import ThemedIcon from '../components/ThemedIcon';
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
  const { theme, isDark, toggleTheme } = useTheme();
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

  const styles = createSettingsStyles(theme, insets.top);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Configurações</Text>

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
            <Text style={styles.rowLabel}>Tema Escuro</Text>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
          <Text style={styles.description}>
            O tema segue automaticamente as preferências do sistema. 
            Use esta opção para alternar manualmente.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
