import { useEffect, useState, useCallback } from 'react';
import {
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
  NativeModules,
} from 'react-native';
import PushNotification from 'react-native-push-notification';
import { Todo } from '../types';
import {
  scheduleVerificationCycle as schedulerScheduleVerificationCycle,
  scheduleNotificationFor as schedulerScheduleNotificationFor,
  cancelNotificationById as cancelById,
} from '../services/notification';

const { AlarmPermission } = NativeModules;

const CHANNEL_ID = 'completion-channel';

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const showSettingsAlert = useCallback(() => {
    Alert.alert(
      'Notificações desativadas',
      'Para receber lembretes ative as notificações nas configurações do app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
      ],
    );
  }, []);

  const createChannel = useCallback(() => {
    PushNotification.createChannel(
      {
        channelId: CHANNEL_ID,
        channelName: 'Tarefas',
        channelDescription: 'Lembretes de tarefas concluídas',
        importance: 4,
        vibrate: true,
      },
      () => {},
    );
  }, []);

  const ensurePermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        // iOS solicita permissão runtime
        const res = await (PushNotification.requestPermissions
          ? PushNotification.requestPermissions()
          : Promise.resolve({ alert: true, badge: true, sound: true }));
        const granted = !!(
          res &&
          ((res as any).alert || (res as any).badge || (res as any).sound)
        );
        setHasPermission(granted);
        if (!granted) showSettingsAlert();
      } else {
        // Android 13+ requer permissão runtime para notificações
        const sdk = Platform.Version as number;
        if (sdk >= 33) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Permissão de notificações',
              message:
                'Permita notificações para receber lembretes de tarefas.',
              buttonPositive: 'Permitir',
              buttonNegative: 'Negar',
            },
          );
          const granted = result === PermissionsAndroid.RESULTS.GRANTED;
          setHasPermission(granted);
          if (!granted) showSettingsAlert();
        } else {
          setHasPermission(true);
        }
      }
    } catch (e) {
      console.warn('Erro ao solicitar permissão de notificações:', e);
      setHasPermission(false);
    }
  }, [showSettingsAlert]);

  useEffect(() => {
    createChannel();
    ensurePermissions();

    // Solicitar permissão de alarmes exatos (Android 13+)
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      if (AlarmPermission) {
        AlarmPermission.checkAlarmPermission()
          .then((hasPermission: boolean) => {
            if (!hasPermission) {
              Alert.alert(
                'Permissão de Alarme Necessária',
                'Para que o agendamento funcione o Android exige a permissão "Alarmes e lembretes".\n\nToque em "Configurar", procure pelo app ToDoFeito e ative a chave.',
                [
                  { text: 'Agora não', style: 'cancel' },
                  {
                    text: 'Configurar',
                    onPress: () => {
                      Linking.sendIntent(
                        'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
                      );
                    },
                  },
                ],
              );
            }
          })
          .catch((e: any) =>
            console.warn('Falha ao checar permissão de alarme:', e),
          );
      } else {
        console.warn(
          'Módulo AlarmPermission não encontrado. Verifique se o app foi rebuildado.',
        );
      }
    }
  }, [createChannel, ensurePermissions]);

  const cancelNotificationById = useCallback(
    (notificationId?: string | string[]) => {
      if (!notificationId) return;
      try {
        console.log(
          '[Notifications] Delegando cancelNotificationById para util:',
          notificationId,
        );
        cancelById(notificationId);
      } catch (e) {
        console.warn('Erro ao cancelar notificação (wrapper):', e);
      }
    },
    [],
  );

  // Agenda um CICLO de notificações (Vários horários fixos)
  // Retorna uma string com todos os IDs gerados separados por vírgula
  // customOffsets: permite passar intervalos personalizados (futuro feature de config)
  const scheduleVerificationCycle = useCallback(
    (
      todo: Todo,
      startFromNow: boolean = false,
      customOffsets?: number[],
    ): string => {
      const ids = schedulerScheduleVerificationCycle(
        todo,
        startFromNow,
        customOffsets,
      );
      return ids.length > 0 ? ids.join(',') : '';
    },
    [],
  );

  const scheduleNotificationFor = useCallback(
    (todo: Todo): string | undefined => {
      try {
        return schedulerScheduleNotificationFor(todo);
      } catch (e) {
        console.warn(
          '[Notifications] scheduleNotificationFor wrapper failed:',
          e,
        );
        return undefined;
      }
    },
    [],
  );

  const cancelAllNotifications = useCallback(() => {
    console.log('[Notifications] Cancelando TODAS as notificações agendadas');
    PushNotification.cancelAllLocalNotifications();
  }, []);

  return {
    hasPermission,
    cancelNotificationById,
    cancelAllNotifications,
    scheduleVerificationCycle,
    scheduleNotificationFor,
    ensurePermissions,
  };
}
