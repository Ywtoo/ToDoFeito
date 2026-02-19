import React, { useState, useEffect, useMemo } from 'react';
import { TextInput, Text, View } from 'react-native';
import DateTimePickerField from './DateTimePickerField';
import { LabelPicker } from './LabelPicker';
import { BaseModal } from './BaseModal';
import { useTheme } from '../contexts/ThemeContext';
import { createTodoModalStyles } from '../styles/TodoModal.styles';
import { Todo, Label } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    dueInitial?: number;
    dueAt?: number;
    reminderInterval?: number;
    labelId?: string;
  }) => void;
  initial?: Partial<Todo> | null;
  labels: Label[];
  defaultLabelId: string;
}

export default function TodoModal({
  visible,
  onClose,
  onSave,
  initial,
  labels,
  defaultLabelId,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createTodoModalStyles(theme), [theme]);
  
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueInitial, setDueInitial] = useState<Date | null>(initial?.dueInitial ? new Date(initial.dueInitial) : null);
  const [dueAt, setDueAt] = useState<Date | null>(initial?.dueAt ? new Date(initial.dueAt) : null);
  const [labelId, setLabelId] = useState<string>(initial?.labelId ?? defaultLabelId);

  useEffect(() => {
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setDueInitial(initial?.dueInitial ? new Date(initial.dueInitial) : null);
    setDueAt(initial?.dueAt ? new Date(initial.dueAt) : null);
    setLabelId(initial?.labelId ?? defaultLabelId);
  }, [initial, visible, defaultLabelId]);

  function clearAll() {
    setTitle('');
    setDescription('');
    setDueInitial(null);
    setDueAt(null);
    setLabelId(defaultLabelId);
  }

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      title: trimmed,
      description: description.trim() || undefined,
      dueInitial: dueInitial?.getTime(),
      dueAt: dueAt?.getTime(),
      reminderInterval: dueAt ? 0 : undefined, // 0 = notification at deadline
      labelId,
    });
    clearAll();
    onClose();
  }

  function handleCancel() {
    clearAll();
    onClose();
  }

  return (
    <BaseModal
      visible={visible}
      onClose={handleCancel}
      title={initial ? 'Editar Tarefa' : 'Nova Tarefa'}
      primaryButton={{
        label: initial ? 'Salvar' : 'Adicionar',
        onPress: handleSave,
        disabled: !title.trim(),
      }}
      secondaryButton={{
        label: 'Cancelar',
        onPress: handleCancel,
      }}>
      <View>
        <TextInput
          placeholder="Título da tarefa"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholderTextColor={theme.textTertiary}
        />
        
        <TextInput
          placeholder="Adicione uma descrição (opcional)"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.inputMultiline]}
          multiline
          numberOfLines={4}
          placeholderTextColor={theme.textTertiary}
        />

        <LabelPicker
          labels={labels}
          selectedLabelId={labelId}
          onSelectLabel={setLabelId}
        />
        
        <Text style={styles.sectionLabel}>Datas</Text>
        
        <DateTimePickerField 
          value={dueInitial} 
          onChange={setDueInitial} 
          placeholder="Início Previsto (Opcional)"
        />
        
        <DateTimePickerField 
          value={dueAt} 
          onChange={setDueAt} 
          placeholder="Prazo Final (Define notificações)"
        />
      </View>
    </BaseModal>
  );
}