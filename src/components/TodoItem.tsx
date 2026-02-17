import React from "react";
import { View, Text, Pressable } from "react-native";
import { Todo } from "../types";
import { stylesTodoItem } from '../styles/TodoItem.styles';

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}

export default function TodoItem({ todo, onToggle, onRemove, onEdit }: Props) {
  const dueInitialText = todo.dueInitial ? new Date(todo.dueInitial).toLocaleString() : null;
  const dueText = todo.dueAt ? new Date(todo.dueAt).toLocaleString() : null;

  return (
    <View style={stylesTodoItem.card}>
      <Pressable onPress={() => onToggle(todo.id)}
        style={({ pressed }) => [stylesTodoItem.checkbox, todo.completed && stylesTodoItem.checkboxCompleted, pressed && stylesTodoItem.checkboxPressed]}
        android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}>
        {todo.completed ? <Text style={stylesTodoItem.check}>✓</Text> : null}
      </Pressable>

      <View style={stylesTodoItem.content}>
        <Text style={[stylesTodoItem.title, todo.completed && stylesTodoItem.titleCompleted]}>
          {todo.title}
        </Text>
        {todo.description ? <Text style={stylesTodoItem.description}>{todo.description}</Text> : null}
      </View>

      <View style={stylesTodoItem.right}>
        {dueInitialText && <Text style={[stylesTodoItem.dueDate, stylesTodoItem.smallDate]}>Início: {dueInitialText}</Text>}
        {dueText ? <Text style={stylesTodoItem.dueDate}>Fim: {dueText}</Text> : null}
        
        <View style={stylesTodoItem.actions}>
          <Pressable onPress={() => onEdit(todo.id)} style={stylesTodoItem.actionButton}>
            <Text style={stylesTodoItem.actionText}>✎</Text>
          </Pressable>
          <Pressable onPress={() => onRemove(todo.id)} style={stylesTodoItem.actionButton}>
            <Text style={stylesTodoItem.remove}>✕</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}