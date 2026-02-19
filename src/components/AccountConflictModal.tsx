import React from 'react';
import { Modal, View, Text, StyleSheet, Button } from 'react-native';
import { DriveUser } from '../types';

type Conflict = {
  localEmail: string;
  remoteEmail: string;
  pendingUser: DriveUser;
} | null;

type Props = {
  visible: boolean;
  conflict: Conflict;
  onMerge: () => void;
  onRestore: () => void;
  onCancel: () => void;
};

export default function AccountConflictModal({ visible, conflict, onMerge, onRestore, onCancel }: Props) {
  if (!conflict) {
    return null;
  }

  console.log('[AccountConflictModal] Exibindo modal de conflito:', {
    localEmail: conflict.localEmail,
    remoteEmail: conflict.remoteEmail,
  });

  const handleMerge = () => {
    console.log('[AccountConflictModal] 🔵 Botão MESCLAR clicado!');
    onMerge();
  };

  const handleRestore = () => {
    console.log('[AccountConflictModal] 🔴 Botão SUBSTITUIR clicado!');
    onRestore();
  };

  const handleCancel = () => {
    console.log('[AccountConflictModal] ⚫ Botão CANCELAR clicado!');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Troca de Conta Detectada</Text>
          <Text style={styles.message}>
            Você está conectado como {conflict.remoteEmail}, mas os dados locais pertencem a {conflict.localEmail}.
            {'\n\n'}
            <Text style={styles.bold}>Escolha uma opção:</Text>
            {'\n\n'}
            <Text style={styles.bold}>Mesclar:</Text> Mantém suas tarefas locais + baixa da nova conta. Perde compartilhamentos.
            {'\n\n'}
            <Text style={styles.bold}>Substituir:</Text> APAGA TUDO local e baixa apenas da nova conta.
          </Text>
          <View style={styles.actions}>
            <View style={styles.button}><Button title="Mesclar (Manter locais)" onPress={handleMerge} /></View>
            <View style={styles.button}><Button title="Substituir (Baixar da nuvem)" onPress={handleRestore} color="#d9534f" /></View>
            <View style={styles.button}><Button title="Cancelar" onPress={handleCancel} color="#666" /></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '86%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    marginBottom: 12,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'column',
  },
  button: {
    marginTop: 6,
  },
});
