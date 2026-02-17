import React, { useEffect, useState, useCallback } from 'react';
import { View, Pressable, Text, FlatList, Keyboard, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTodos } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';
import TodoModal from '../components/TodoModal';
import { stylesHome, fabRippleColors } from '../styles/Home.styles';

export default function Home() {
  const { todos, add, toggle, remove, updateFields } = useTodos();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates?.height || 0)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const margin = 16;
  const fabBottom = margin + Math.max(insets.bottom, keyboardHeight);

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

  // choose ripple color from styles based on theme
  const rippleColor = colorScheme === 'dark' ? fabRippleColors.dark : fabRippleColors.light;

  return (
    <View style={stylesHome.geral}>
      <FlatList
        data={todos}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <TodoItem todo={item} onToggle={onToggle} onRemove={onRemove} onEdit={onEdit} />
        )}
      />
      <View style={[stylesHome.fabContainer, { bottom: fabBottom }]}>
        <Pressable onPress={openCreate}
          style={stylesHome.fab}
          android_ripple={{ color: rippleColor, borderless: false }}
          accessibilityRole="button"
        >
          <Text style={stylesHome.fabText}>+</Text>
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