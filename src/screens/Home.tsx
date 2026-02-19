import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedIcon from '../components/ThemedIcon';
import { useTheme } from '../contexts/ThemeContext';
import { useLabelsContext } from '../contexts/LabelsContext';
import TodoItem from '../components/TodoItem';
import TodoModal from '../components/TodoModal';
import { createHomeStyles, getFabStyle, getColorDotStyle } from '../styles/Home.styles';
import { Label, Todo, SyncStatus } from '../types';

interface HomeProps {
  todos: Todo[];
  add: (data: any) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  updateFields: (id: string, fields: any) => void;
  getTodosByLabel: (labelId: string) => Todo[];
  syncStatus?: SyncStatus;
}

export default function Home({
  todos,
  add,
  toggle,
  remove,
  updateFields,
  getTodosByLabel,
  syncStatus,
}: HomeProps) {
  const { labels, getDefaultLabel } = useLabelsContext();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedLabelId, setExpandedLabelId] = useState<string | null>(null);

  // FAB positioning
  const fabMargin = 16;
  const fabBottom = fabMargin;

  const styles = useMemo(() => createHomeStyles(theme, { insetsTop: insets.top, fabBottom }), [theme, insets.top, fabBottom]);
  const [selectedLabelId, setSelectedLabelId] = useState<string>(
    getDefaultLabel().id
  );

  const openCreate = useCallback(() => {
    setEditingId(null);
    setModalVisible(true);
  }, []);

  // Note: `reminderInterval` received from the form is treated as an offset in minutes.
  // The hook `useTodos` converts it into an absolute timestamp (ms) before storing.
  const handleSave = useCallback((data: {
    title: string;
    description?: string;
    dueInitial?: number;
    dueAt?: number;
    reminderInterval?: number;
    labelId?: string;
  }) => {
    // Normalize and validate incoming data
    const normalized: {
      title: string;
      description?: string;
      dueInitial?: number | null;
      dueAt?: number | null;
      reminderInterval?: number;
      labelId?: string;
    } = {
      title: String(data.title || '').trim(),
      description: data.description ? String(data.description) : undefined,
      dueInitial: data.dueInitial !== undefined ? (data.dueInitial || null) : undefined,
      dueAt: data.dueAt !== undefined && data.dueAt !== null ? Number(data.dueAt) : undefined,
      reminderInterval: data.reminderInterval !== undefined && data.reminderInterval !== null ? Number(data.reminderInterval) : undefined,
      labelId: data.labelId,
    };

    if (!normalized.title) return;

    if (editingId) {
      updateFields(editingId, normalized);
    } else {
      add(normalized);
    }
  }, [add, updateFields, editingId]);

  const editingTodo = editingId ? todos.find(t => t.id === editingId) ?? null : null;

  // Memoized wrappers for handlers passed to list items to reduce re-renders
  const onToggle = useCallback((id: string) => toggle(id), [toggle]);
  const onRemove = useCallback((id: string) => remove(id), [remove]);
  const onEdit = useCallback((id: string) => {
    setEditingId(id);
    setModalVisible(true);
  }, []);

  const rippleColor = theme.ripple;

  return (
    <View style={styles.geral}>
      {/* Centered accordion list (each label expands to show todos) */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.accordionContainer}>
        {labels.map(label => {
            const isExpanded = label.id === expandedLabelId;
            const todosForLabel = getTodosByLabel(label.id);
            return (
              <View key={label.id} style={styles.accordionItem}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => {
                    setSelectedLabelId(label.id);
                    setExpandedLabelId(prev => prev === label.id ? null : label.id);
                  }}>
                  <ThemedIcon lib="Ionicons" name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={18} colorKey="textSecondary" style={styles.chevronIcon} />
                  <View style={[styles.colorDot, getColorDotStyle(label.color)]} />
                  <Text style={styles.accordionHeaderText}>
                    {label.name}
                  </Text>
                  <Text style={styles.labelCountText}>({todosForLabel.length})</Text>
                </TouchableOpacity>

                <View style={styles.headerDivider} />

                {isExpanded ? (
                  <View style={styles.accordionContent}>
                    {todosForLabel.length ? todosForLabel.map(t => (
                      <TodoItem key={t.id} todo={t} onToggle={onToggle} onRemove={onRemove} onEdit={onEdit} />
                    )) : <Text style={styles.todoPreviewText}>Sem tarefas</Text>}
                  </View>
                ) : null}
              </View>
            );
          })}
      </ScrollView>

      <View style={styles.fabContainer}>
        <Pressable onPress={openCreate}
          style={getFabStyle(theme)}
          android_ripple={{ color: rippleColor, borderless: false }}
          accessibilityRole="button"
        >
          <ThemedIcon lib="Ionicons" name="add" size={32} colorKey="onPrimary" />
        </Pressable>
      </View>

      <TodoModal
        visible={modalVisible}
        initial={editingTodo ?? undefined}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        labels={labels}
        defaultLabelId={selectedLabelId}
      />
    </View>
  );
}