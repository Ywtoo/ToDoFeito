/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Linking,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { SyncProvider } from './src/contexts/SyncContext';
import { SyncProgressIndicator } from './src/components/SyncProgressIndicator';
import { LabelsProvider, useLabelsContext } from './src/contexts/LabelsContext';
import AppNavigator from './src/navigation';
import { useTodos } from './src/hooks/useTodos';
import { useDriveSync } from './src/hooks/useDriveSync';
import { parseImportLink } from './src/services/drive/share';
import { scheduleNotificationFor, scheduleVerificationCycle } from './src/services/notification';
import AccountConflictModal from './src/components/AccountConflictModal';
import { useNotifications } from './src/hooks/useNotifications';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LabelsProvider>
          <AppContent />
        </LabelsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { isDark, theme } = useTheme();
  // Hook de notificações para garantir permissões e canal
  useNotifications();

  // Agora usamos o contexto em vez do hook diretamente
  const labelsHook = useLabelsContext();
  const { labels, getDefaultLabel, importLabel, updateLabel, replaceAllLabels } = labelsHook;
  
  const defaultLabel = getDefaultLabel();
  const todosHook = useTodos(defaultLabel.id);
  const { getTodosByLabel, updateTodos, addTodos } = todosHook;

  const driveSync = useDriveSync(
    labels,
    getTodosByLabel,
    updateLabel,
    updateTodos,
    importLabel,
    replaceAllLabels
  );

  const { 
    user, 
    importSharedLabel,
    accountConflict,
    resolveConflictMerge,
    resolveConflictRestore,
    cancelSignIn,
    syncAll,
  } = driveSync;

  // Auto-sync quando usuário fizer login
  const [lastSyncedUser, setLastSyncedUser] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.email !== lastSyncedUser && !accountConflict) {
      setLastSyncedUser(user.email);
      // Delay pequeno para garantir que UI esteja pronta
      setTimeout(() => {
        syncAll().catch(err => {
          console.error('[App] Erro no auto-sync:', err);
        });
      }, 500);
    } else if (!user) {
      setLastSyncedUser(null);
    }
  }, [user, accountConflict, lastSyncedUser, syncAll]);

  // Debug: Log quando há conflito
  useEffect(() => {
    if (accountConflict) {
    }
  }, [accountConflict]);

  // Deep link handler state
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importData, setImportData] = useState<{
    folderId: string;
    labelName: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);

  // Deep link handler
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      const parsed = parseImportLink(url);
      if (parsed) {
        setImportData(parsed);
        setImportModalVisible(true);
      } else {
      }
    };

    // Check initial URL (app opened via link)
    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl({ url });
      }
    });

    // Listen for subsequent URLs (app already open)
    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleImport = async () => {
    if (!importData) return;

    setImporting(true);

    try {
      // Check if user is signed in
      if (!user) {
        Alert.alert(
          'Login necessário',
          'Você precisa fazer login com o Google para importar labels compartilhados. Deseja fazer login agora?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Login',
                onPress: async () => {
                  const success = await driveSync.signIn();
                  if (success) {
                    // Retry import after login
                    await performImport();
                  } else {
                    Alert.alert('Erro', 'Falha ao fazer login');
                    setImporting(false);
                    setImportModalVisible(false);
                  }
                },
            },
          ]
        );
        setImporting(false);
        return;
      }

      await performImport();
    } catch (error) {
      console.error('[App] Erro na importação:', error);
      Alert.alert('Erro', 'Falha ao importar label compartilhado');
      setImporting(false);
      setImportModalVisible(false);
    }
  };

  const performImport = async () => {
    if (!importData) return;

    const result = await importSharedLabel(
      importData.folderId,
      importData.labelName
    );

    if (result) {
      // Add imported todos
      addTodos(result.todos);

      // Schedule notifications for imported todos
      result.todos.forEach(todo => {
        if (!todo.completed) {
          if (todo.reminderInterval) {
            scheduleNotificationFor(todo);
          }
          if (todo.dueAt) {
            scheduleVerificationCycle(todo, false);
          }
        }
      });

      Alert.alert(
        'Sucesso!',
        `Label "${importData.labelName}" importado com ${result.todos.length} tarefa(s)`
      );
    } else {
      // Verifica se há erro específico no status
      const errorMsg = driveSync.syncStatus.error || 'Falha ao importar label. Verifique se o link está correto e se o compartilhamento está ativo.';
      Alert.alert('Erro ao importar', errorMsg);
    }

    setImporting(false);
    setImportModalVisible(false);
    setImportData(null);
  };

  const handleCancelImport = () => {
    setImportModalVisible(false);
    setImportData(null);
  };

  return (
    <SyncProvider value={driveSync}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <AppNavigator
          todosHook={todosHook}
          driveSync={driveSync}
        />
        
        {/* Indicador Global de Progresso de Sync */}
        <SyncProgressIndicator />

        {/* Import Modal */}
      <Modal
        visible={importModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelImport}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface },
            ]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Importar Label Compartilhado
            </Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              Deseja importar o label "{importData?.labelName}"?
            </Text>
            {importing ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancelImport}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleImport}>
                  <Text style={styles.buttonText}>Importar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* Account conflict modal (global) */}
      <AccountConflictModal
        visible={!!accountConflict}
        conflict={accountConflict}
        onMerge={() => {
          console.log('[App] 🔵 onMerge chamado no App.tsx');
          resolveConflictMerge();
        }}
        onRestore={() => {
          console.log('[App] 🔴 onRestore chamado no App.tsx');
          resolveConflictRestore();
        }}
        onCancel={() => {
          console.log('[App] ⚫ onCancel chamado no App.tsx');
          cancelSignIn();
        }}
      />
      </View>
    </SyncProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
