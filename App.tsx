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
import AppNavigator from './src/navigation';
import { useLabels } from './src/hooks/useLabels';
import { useTodos } from './src/hooks/useTodos';
import { useDriveSync } from './src/hooks/useDriveSync';
import { parseImportLink } from './src/services/drive/share';
import { scheduleNotificationFor, scheduleVerificationCycle } from './src/services/notification';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { isDark, theme } = useTheme();
  const labelsHook = useLabels();
  const { labels, getDefaultLabel, importLabel, updateLabel } = labelsHook;
  
  const defaultLabel = getDefaultLabel();
  const todosHook = useTodos(defaultLabel.id);
  const {
    todos,
    add,
    toggle,
    remove,
    updateFields,
    getTodosByLabel,
    moveTodoToLabel,
    updateTodos,
    addTodos,
  } = todosHook;

  const driveSync = useDriveSync(
    labels,
    getTodosByLabel,
    updateLabel,
    updateTodos,
    importLabel
  );

  const { user, syncStatus, importSharedLabel } = driveSync;

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
      console.error('Import error:', error);
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
      Alert.alert('Erro', 'Falha ao importar label');
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <AppNavigator
        labelsHook={labelsHook}
        todosHook={todosHook}
        driveSync={driveSync}
      />

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
              { backgroundColor: theme.cardBackground },
            ]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Importar Label Compartilhado
            </Text>
            <Text style={[styles.modalMessage, { color: theme.subText }]}>
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
    </View>
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
