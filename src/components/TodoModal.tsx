import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, TextInput, Button } from 'react-native';
import DateTimePickerField from './DateTimePickerField';
import { useTheme } from '../contexts/ThemeContext';
import { createTodoModalStyles } from '../styles/TodoModal.styles';
import { colors } from '../styles/variables';
import { Todo } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description?: string; dueInitial?: number; dueAt?: number; reminderInterval?: number }) => void;
  initial?: Partial<Todo> | null;
}

export default function TodoModal({ visible, onClose, onSave, initial }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createTodoModalStyles(theme), [theme]);
  
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueInitial, setDueInitial] = useState<Date | null>(initial?.dueInitial ? new Date(initial.dueInitial) : null);
  const [dueAt, setDueAt] = useState<Date | null>(initial?.dueAt ? new Date(initial.dueAt) : null);

  useEffect(() => {
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setDueInitial(initial?.dueInitial ? new Date(initial.dueInitial) : null);
    setDueAt(initial?.dueAt ? new Date(initial.dueAt) : null);
  }, [initial, visible]);

  function clearAll() {
    setTitle('');
    setDescription('');
    setDueInitial(null);
    setDueAt(null);
  }

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      title: trimmed,
      description: description.trim() || undefined,
      dueInitial: dueInitial?.getTime(),
      dueAt: dueAt?.getTime(),
      reminderInterval: dueAt ? 30 : undefined,
    });
    clearAll();
    onClose();
  }

  function handleCancel() {
    clearAll();
    onClose();
  }

  return (
    <Modal visible={visible} onRequestClose={handleCancel} animationType="slide" transparent>
      <View style={styles.background}>
        <View style={styles.modal}>
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholderTextColor={theme.textTertiary}
          />
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.inputMultiline]}
            multiline
            placeholderTextColor={theme.textTertiary}
          />
          
          <DateTimePickerField 
            value={dueInitial} 
            onChange={setDueInitial} 
            placeholder="Início Previsto (Opcional)"
          />
          
          <DateTimePickerField 
            value={dueAt} 
            onChange={setDueAt} 
            placeholder="Término Previsto (Define o Prazo)"
          />

          <View style={styles.actions}>
            <View style={styles.btn}>
              <Button title={initial ? 'Save' : 'Add'} onPress={handleSave} color={colors.primary} />
            </View>
            <View style={styles.btn}>
              <Button title="Cancel" onPress={handleCancel} color={theme.error} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}