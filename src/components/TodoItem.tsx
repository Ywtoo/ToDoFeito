import React from "react";
import { View, Text, Pressable } from "react-native";
import { Todo } from "../types";
import { stylesTodoItem } from '../styles/TodoItem.styles';

interface Props {
    todo: Todo;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
}

export default function TodoItem({ todo, onToggle, onRemove }: Props) {
    return (
        <View style={stylesTodoItem.card}>
            <Pressable onPress={() => onToggle(todo.id)}
                style={({ pressed }) => [stylesTodoItem.checkbox, todo.completed && stylesTodoItem.checkboxCompleted, pressed && stylesTodoItem.checkboxPressed]}
                android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}>
                {todo.completed ? <Text style={stylesTodoItem.check}>✓</Text> : null}
            </Pressable>
            <Text style={[stylesTodoItem.title, todo.completed && stylesTodoItem.titleCompleted]}>
                    {todo.title}
                </Text>
            <Pressable onPress={() => onRemove(todo.id)}>
                <Text style={stylesTodoItem.remove}>X</Text>
            </Pressable>
        </View>
    );
}