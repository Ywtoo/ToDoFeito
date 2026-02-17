import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Pressable, FlatList, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTodos } from '../hooks/useTodos';
import { useTheme } from '../contexts/ThemeContext';
import TodoItem from '../components/TodoItem';
import TodoModal from '../components/TodoModal';
import { createHomeStyles } from '../styles/Home.styles';

export default function Home() {
  const { todos, add, toggle, remove, updateFields } = useTodos();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createHomeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates?.height || 0)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // FAB positioning: small margin from bottom (16px) or above keyboard
  const fabMargin = 16;
  const fabBottom = keyboardHeight > 0 
    ? keyboardHeight + fabMargin 
    : fabMargin;

  const openCreate = useCallback(() => {
    setEditingId(null);
    setModalVisible(true);
  }, []);



  // Note: `reminderInterval` received from the form is treated as an offset in minutes.
  // The hook `useTodos` converts it into an absolute timestamp (ms) before storing.
  const handleSave = useCallback((data: { title: string; description?: string; dueAt?: number; reminderInterval?: number }) => {
    // Normalize and validate incoming data
    const normalized: { title: string; description?: string; dueAt?: number; reminderInterval?: number } = {
      title: String(data.title || '').trim(),
      description: data.description ? String(data.description) : undefined,
      dueAt: data.dueAt !== undefined && data.dueAt !== null ? Number(data.dueAt) : undefined,
      reminderInterval: data.reminderInterval !== undefined && data.reminderInterval !== null ? Number(data.reminderInterval) : undefined,
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
      <FlatList
        data={todos}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <TodoItem todo={item} onToggle={onToggle} onRemove={onRemove} onEdit={onEdit} />
        )}
      />
      <View style={[styles.fabContainer, { bottom: fabBottom }]}>
        <Pressable onPress={openCreate}
          style={styles.fab}
          android_ripple={{ color: rippleColor, borderless: false }}
          accessibilityRole="button"
        >
          <Icon name="add" size={32} color="#fff" />
        </Pressable>
      </View>

      <TodoModal
        visible={modalVisible}
        initial={editingTodo ?? undefined}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}