import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Label, Todo } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import {
  generateShareLink,
  enableSharing,
  getShareMessage,
} from '../services/drive/share';

interface LabelsScreenProps {
  labels: Label[];
  todos: Todo[];
  createLabel: (name: string, color: string) => Label;
  updateLabel: (labelId: string, updates: Partial<Label>) => void;
  deleteLabel: (labelId: string) => void;
  syncLabelNow: (labelId: string) => Promise<boolean>;
  user: any;
}

const COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#F44336', // Red
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
];

export const LabelsScreen: React.FC<LabelsScreenProps> = ({
  labels,
  todos,
  createLabel,
  updateLabel,
  deleteLabel,
  syncLabelNow,
  user,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [labelName, setLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [sharingLabelId, setSharingLabelId] = useState<string | null>(null);

  const getTodoCount = (labelId: string) => {
    return todos.filter(t => t.labelId === labelId).length;
  };

  const handleCreateOrUpdate = () => {
    if (!labelName.trim()) {
      Alert.alert('Erro', 'Digite um nome para o label');
      return;
    }

    if (editingLabel) {
      updateLabel(editingLabel.id, {
        name: labelName.trim(),
        color: selectedColor,
      });
    } else {
      createLabel(labelName.trim(), selectedColor);
    }

    closeModal();
  };

  const handleShare = async (label: Label) => {
    if (!user) {
      Alert.alert(
        'Login necessário',
        'Faça login com o Google para compartilhar labels'
      );
      return;
    }

    setSharingLabelId(label.id);

    try {
      // Sincroniza o label primeiro se ainda não tem driveMetadata
      if (!label.driveMetadata) {
        const synced = await syncLabelNow(label.id);
        if (!synced) {
          Alert.alert('Erro', 'Falha ao sincronizar label com o Drive');
          setSharingLabelId(null);
          return;
        }
        
        // Aguarda um momento para garantir que o label foi atualizado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Busca o label atualizado
        const updatedLabel = labels.find(l => l.id === label.id);
        if (!updatedLabel || !updatedLabel.driveMetadata) {
          Alert.alert('Erro', 'Label não foi sincronizado corretamente');
          setSharingLabelId(null);
          return;
        }
        label = updatedLabel;
      }

      // Habilita compartilhamento
      const enabled = await enableSharing(label);
      if (!enabled) {
        Alert.alert('Erro', 'Falha ao habilitar compartilhamento');
        setSharingLabelId(null);
        return;
      }

      // Marca o label como compartilhado
      updateLabel(label.id, { shared: true });

      // Gera link
      const link = generateShareLink(label);
      if (!link) {
        Alert.alert('Erro', 'Falha ao gerar link de compartilhamento');
        setSharingLabelId(null);
        return;
      }

      // Compartilha
      const message = getShareMessage(label.name, link);
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Erro', 'Falha ao compartilhar label');
    } finally {
      setSharingLabelId(null);
    }
  };

  const handleDelete = (label: Label) => {
    if (label.isDefault) {
      Alert.alert('Aviso', 'Não é possível deletar o label padrão');
      return;
    }

    const count = getTodoCount(label.id);
    const message =
      count > 0
        ? `Este label tem ${count} tarefa(s). Elas serão movidas para "Minhas Tarefas". Continuar?`
        : 'Deseja deletar este label?';

    Alert.alert('Confirmar', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: () => deleteLabel(label.id),
      },
    ]);
  };

  const openCreateModal = () => {
    setEditingLabel(null);
    setLabelName('');
    setSelectedColor(COLORS[0]);
    setModalVisible(true);
  };

  const openEditModal = (label: Label) => {
    setEditingLabel(label);
    setLabelName(label.name);
    setSelectedColor(label.color);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingLabel(null);
    setLabelName('');
  };

  const renderLabel = ({ item }: { item: Label }) => {
    const count = getTodoCount(item.id);

    return (
      <View
        style={[
          styles.labelCard,
          { backgroundColor: theme.cardBackground },
        ]}>
        <View style={styles.labelHeader}>
          <View style={styles.labelInfo}>
            <View
              style={[styles.colorDot, { backgroundColor: item.color }]}
            />
            <View style={styles.labelTextContainer}>
              <Text style={[styles.labelName, { color: theme.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.labelCount, { color: theme.subText }]}>
                {count} {count === 1 ? 'tarefa' : 'tarefas'}
              </Text>
            </View>
          </View>
          <View style={styles.labelActions}>
            {item.shared && (
              <Icon name="cloud" size={20} color={theme.subText} />
            )}
            {user && !item.isDefault && (
              <TouchableOpacity
                onPress={() => handleShare(item)}
                style={styles.actionButton}
                disabled={sharingLabelId === item.id}>
                {sharingLabelId === item.id ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Icon name="share" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
            {!item.isDefault && (
              <>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  style={styles.actionButton}>
                  <Icon name="edit" size={20} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={styles.actionButton}>
                  <Icon name="delete" size={20} color="#F44336" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={labels}
        renderItem={renderLabel}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            Nenhum label criado ainda
          </Text>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={openCreateModal}>
        <Icon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingLabel ? 'Editar Label' : 'Novo Label'}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Nome do label"
              placeholderTextColor={theme.subText}
              value={labelName}
              onChangeText={setLabelName}
            />

            <Text style={[styles.colorLabel, { color: theme.text }]}>
              Cor
            </Text>
            <View style={styles.colorPicker}>
              {COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={closeModal}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleCreateOrUpdate}>
                <Text style={styles.buttonText}>
                  {editingLabel ? 'Salvar' : 'Criar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  labelCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  labelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  labelTextContainer: {
    flex: 1,
  },
  labelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  labelCount: {
    fontSize: 14,
  },
  labelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
