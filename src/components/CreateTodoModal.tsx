import React, { useState } from "react";
import { Modal, View, TextInput, Button } from "react-native";
import { stylesTodoModal } from '../styles/CreateTodoModal.styles';

interface Props {
    visible: boolean;
    onClose: () => void;
    onAdd: (title: string) => void;
}

export default function CreateTodoModal({ visible, onClose, onAdd }: Props) {
    const [title, setTitle] = useState('');

    function handleCreate() {
        const trimmedTitle = title.trim();
        if (trimmedTitle) {
            onAdd(trimmedTitle);
            setTitle('');
            onClose();
        }
    }
        return (
            <Modal visible={visible} onRequestClose={onClose} animationType="slide" transparent>
                <View style={stylesTodoModal.background}>
                    <View style={stylesTodoModal.modal}>
                        <TextInput
                            placeholder="New todo title"
                            value={title}
                            onChangeText={setTitle}
                            style={stylesTodoModal.input}
                        />
                        <Button title="Add" onPress={handleCreate} />
                        <Button title="Cancel" onPress={onClose} color="red" />
                    </View>
                </View>
            </Modal>
        );
    }