import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, borderRadius, shadows } from '../styles/variables';
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

  const styles = StyleSheet.create({
    scrollContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: { 
      flex: 1, 
      padding: spacing.lg,
      paddingTop: spacing.lg + insets.top,
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
      backgroundColor: theme.primary,
    },
    buttonSecondary: {
      backgroundColor: theme.textSecondary,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: fontSize.base,
      fontWeight: '600',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      gap: spacing.md,
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
                <Icon name="account-circle" size={40} color={theme.primary} />
                <View style={{ flex: 1 }}>
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
                <Icon name="sync" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Sincronizar Agora</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleSignOut}>
                <Icon name="logout" size={20} color="#FFFFFF" />
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
                <Icon name="account-circle" size={20} color="#FFFFFF" />
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
