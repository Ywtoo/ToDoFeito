import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import ThemedIcon from './ThemedIcon';
import { Todo } from "../types";
import { useTheme } from '../contexts/ThemeContext';
import { createTodoItemStyles } from '../styles/TodoItem.styles';
import { formatSituationalDate } from '../utils/dateUtils';
import { colors } from '../styles/variables';

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}

export default function TodoItem({ todo, onToggle, onRemove, onEdit }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createTodoItemStyles(theme), [theme]);
  
  const dueInitialText = formatSituationalDate(todo.dueInitial || null);
  const dueText = formatSituationalDate(todo.dueAt || null);

  return (
    <View style={styles.card}>
      <Pressable onPress={() => onToggle(todo.id)}
        style={({ pressed }) => [styles.checkbox, todo.completed && styles.checkboxCompleted, pressed && styles.checkboxPressed]}
        android_ripple={{ color: theme.ripple, borderless: true }}>
        {todo.completed ? <ThemedIcon lib="Ionicons" name="checkmark" size={18} colorKey="onPrimary" /> : null}
      </Pressable>

      <View style={styles.content}>
        <Text style={[styles.title, todo.completed && styles.titleCompleted]}>
          {todo.title}
        </Text>
        {todo.description ? <Text style={styles.description}>{todo.description}</Text> : null}
      </View>

      <View style={styles.right}>
        {dueInitialText && <Text style={styles.smallDate}>Início: {dueInitialText}</Text>}
        {dueText ? <Text style={styles.dueDate}>Fim: {dueText}</Text> : null}
        
        <View style={styles.actions}>
          <Pressable onPress={() => onEdit(todo.id)} style={styles.actionButton}>
            <ThemedIcon lib="Ionicons" name="create-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => onRemove(todo.id)} style={styles.actionButton}>
            <ThemedIcon lib="Ionicons" name="trash-outline" size={20} colorKey="error" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}