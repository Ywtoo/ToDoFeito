import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedIcon from '../components/ThemedIcon';
import { BaseModal } from '../components/BaseModal';
import { Label, Todo } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLabelsContext } from '../contexts/LabelsContext';
import { createLabelsStyles, getColorDotStyle } from '../styles/Labels.style';
import {
  generateShareLink,
  enableSharing,
  getShareMessage,
} from '../services/drive/share';

interface LabelsScreenProps {
  todos: Todo[];
  syncLabelNow: (labelId: string) => Promise<Label | null>;
  user: any;
  markLabelDeleted?: (label: Label) => void | Promise<void>;
  leaveSharedLabel?: (labelId: string) => Promise<boolean>;
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
  todos,
  syncLabelNow,
  user,
  markLabelDeleted,
  leaveSharedLabel,
}) => {
  const { labels, createLabel, updateLabel, deleteLabel } = useLabelsContext();
  const { theme, fontScale } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createLabelsStyles(theme, { insetsTop: insets.top }, fontScale), [theme, insets.top, fontScale]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [labelName, setLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [sharingLabelId, setSharingLabelId] = useState<string | null>(null);
  const [expandedLabelId, setExpandedLabelId] = useState<string | null>(null);

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
        const syncedLabel = await syncLabelNow(label.id);
        if (!syncedLabel || !syncedLabel.driveMetadata) {
          Alert.alert('Erro', 'Falha ao sincronizar label com o Drive');
          setSharingLabelId(null);
          return;
        }
        label = syncedLabel;
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

  const handleDelete = async (label: Label) => {
    if (label.isDefault) {
      Alert.alert('Aviso', 'Não é possível deletar o label padrão');
      return;
    }

    // Colaboradores não podem deletar, apenas sair
    if (label.ownershipRole === 'collaborator') {
      handleLeaveSharedLabel(label);
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
        onPress: async () => {
          // Marca no metadata se sincronizado
          if (markLabelDeleted && label.driveMetadata) {
            await markLabelDeleted(label);
          }
          // Deleta localmente
          deleteLabel(label.id);
        },
      },
    ]);
  };

  const handleLeaveSharedLabel = (label: Label) => {
    const count = getTodoCount(label.id);
    const message =
      count > 0
        ? `Você tem ${count} tarefa(s) neste label compartilhado. Ao sair, elas serão removidas do seu dispositivo (mas permanecerão para o proprietário). Continuar?`
        : 'Deseja sair deste label compartilhado?';

    Alert.alert('Sair do label', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          if (leaveSharedLabel) {
            const success = await leaveSharedLabel(label.id);
            if (success) {
              Alert.alert('Sucesso', 'Você saiu do label compartilhado');
            } else {
              Alert.alert('Erro', 'Falha ao sair do label');
            }
          }
        },
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
    const isExpanded = expandedLabelId === item.id;

    return (
      <View style={styles.accordionItem}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => setExpandedLabelId(prev => prev === item.id ? null : item.id)}>
          <ThemedIcon 
            lib="Ionicons" 
            name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
            size={18} 
            colorKey="textSecondary" 
            style={styles.chevronIcon} 
          />
          <View style={[styles.colorDot, getColorDotStyle(item.color)]} />
          <Text style={styles.labelName}>
            {item.name}
          </Text>
          <Text style={styles.labelCount}>
            ({count})
          </Text>
          {item.shared && (
            <ThemedIcon lib="MaterialIcons" name="cloud" size={18} colorKey="textTertiary" style={styles.cloudIconHeader} />
          )}
        </TouchableOpacity>

        <View style={styles.headerDivider} />

        {isExpanded && (
          <View style={styles.accordionContent}>
            <View style={styles.detailRow}>
              <ThemedIcon lib="MaterialIcons" name="checklist" size={16} colorKey="textSecondary" />
              <Text style={styles.detailText}>
                {count} {count === 1 ? 'tarefa' : 'tarefas'}
              </Text>
            </View>

            {item.shared && (
              <View style={styles.detailRow}>
                <ThemedIcon lib="MaterialIcons" name="cloud" size={16} colorKey="textSecondary" />
                <Text style={styles.detailText}>
                  {item.ownershipRole === 'owner' 
                    ? 'Compartilhado (Você é o dono)' 
                    : item.ownershipRole === 'collaborator'
                    ? 'Colaborando (Compartilhado com você)'
                    : 'Compartilhado'}
                </Text>
              </View>
            )}

            {item.isDefault && (
              <View style={styles.detailRow}>
                <ThemedIcon lib="MaterialIcons" name="star" size={16} colorKey="textSecondary" />
                <Text style={styles.detailText}>Label padrão</Text>
              </View>
            )}

            <View style={styles.actionsRow}>
              <View style={styles.labelActions}>
                {/* Apenas owner pode compartilhar */}
                {user && !item.isDefault && item.ownershipRole !== 'collaborator' && (
                  <TouchableOpacity
                    onPress={() => handleShare(item)}
                    style={styles.actionButton}
                    disabled={sharingLabelId === item.id}>
                    {sharingLabelId === item.id ? (
                      <ActivityIndicator size="small" color={theme.text} />
                    ) : (
                      <ThemedIcon lib="MaterialIcons" name="share" size={20} colorKey="text" />
                    )}
                  </TouchableOpacity>
                )}
                {!item.isDefault && (
                  <>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={styles.actionButton}>
                      <ThemedIcon lib="MaterialIcons" name="edit" size={20} colorKey="text" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={styles.actionButton}>
                      <ThemedIcon 
                        lib="MaterialIcons" 
                        name={item.ownershipRole === 'collaborator' ? 'exit-to-app' : 'delete'} 
                        size={20} 
                        colorKey="error" 
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={labels}
        renderItem={renderLabel}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhum label criado ainda
          </Text>
        }
      />

      <TouchableOpacity
        style={[styles.fab]}
        onPress={openCreateModal}>
        <ThemedIcon lib="MaterialIcons" name="add" size={24} colorKey="onPrimary" />
      </TouchableOpacity>

      <BaseModal
        visible={modalVisible}
        onClose={closeModal}
        title={editingLabel ? 'Editar Label' : 'Novo Label'}
        primaryButton={{
          label: editingLabel ? 'Salvar' : 'Criar',
          onPress: handleCreateOrUpdate,
          disabled: !labelName.trim(),
        }}
        secondaryButton={{
          label: 'Cancelar',
          onPress: closeModal,
        }}>
        {/* Preview com bolinha colorida */}
        <View style={styles.previewContainer}>
          <View style={[styles.previewDot, getColorDotStyle(selectedColor)]} />
          <Text style={styles.previewText}>
            {labelName || 'Nome do label'}
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nome do label"
          placeholderTextColor={theme.textSecondary}
          value={labelName}
          onChangeText={setLabelName}
        />

        <Text style={styles.colorLabel}>Escolha uma cor</Text>
        <View style={styles.colorPicker}>
          {COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                getColorDotStyle(color),
                selectedColor === color && styles.colorSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
      </BaseModal>
    </View>
  );
};
