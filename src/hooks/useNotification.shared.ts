import { useCallback, useState } from 'react';

type Notification = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

/**
 * Hook compartilhado para gerenciar notificações da UI
 * Usado por todos os hooks que precisam mostrar mensagens ao usuário
 */
export const useNotification = () => {
  const [notification, setNotification] = useState<Notification>(null);

  const showSuccess = useCallback((message: string) => {
    setNotification({ type: 'success', message });
  }, []);

  const showError = useCallback((message: string) => {
    setNotification({ type: 'error', message });
  }, []);

  const showInfo = useCallback((message: string) => {
    setNotification({ type: 'info', message });
  }, []);

  const clear = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showSuccess,
    showError,
    showInfo,
    clearNotification: clear,
  };
};
