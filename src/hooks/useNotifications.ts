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

  // helper removed; alert inlined to avoid hook dependency issues

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

  const checkAlarmPermission = useCallback(() => {
    if (Platform.OS === 'android' && (Platform.Version as number) >= 31) {
      if (AlarmPermission) {
        AlarmPermission.checkAlarmPermission()
          .then((granted: boolean) => {
            if (!granted) {
              Alert.alert(
                'Permissão de Alarme Necessária',
                'Para que o agendamento funcione corretamente, o Android exige a permissão "Alarmes e lembretes".\n\nToque em "Configurar" para ativar.',
                [
                  { text: 'Agora não', style: 'cancel' },
                  {
                    text: 'Configurar',
                    onPress: () => {
                      // Abre especificamente a tela de permissão de alarmes exatos
                      Linking.sendIntent(
                        'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
                        [{ key: 'package', value: 'com.todofeito' }],
                      );
                    },
                  },
                ],
              );
            }
          })
          .catch((e: any) => {
            console.warn('Falha ao checar permissão de alarme:', e);
            // Retry em caso de erro
            setTimeout(checkAlarmPermission, 2000);
          });
      } else {
        console.warn(
          'Módulo AlarmPermission não encontrado. Verifique se o app foi rebuildado.',
        );
      }
    }
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
        if (!granted) {
          Alert.alert(
            'Notificações desativadas',
            'Para receber lembretes ative as notificações nas configurações do app.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
            ],
          );
        }
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
        } else {
          setHasPermission(true);
        }
      }

      // Após pedir permissão de notificações, verifica alarmes exatos (Android 12+)
      // Pequeno delay para não sobrepor UI
      setTimeout(() => {
        checkAlarmPermission();
      }, 500);
    } catch (e) {
      console.warn('Erro ao solicitar permissão de notificações:', e);
      setHasPermission(false);
      // Mesmo com erro, tenta verificar alarme
      setTimeout(() => {
        checkAlarmPermission();
      }, 500);
    }
  }, [checkAlarmPermission]);

  useEffect(() => {
    createChannel();
    ensurePermissions();
  }, [createChannel, ensurePermissions]);

  const cancelNotificationById = useCallback(
    (notificationId?: string | string[]) => {
      if (!notificationId) return;
      try {
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
