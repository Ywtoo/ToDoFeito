import PushNotification from 'react-native-push-notification';
import { toIdArray } from './utils';

export function cancelNotificationById(ids?: string | string[]) {
  toIdArray(ids).forEach(id => {
    try {
      PushNotification.cancelLocalNotification(id);
    } catch (e) {
      console.warn('[Notifications] Falha ao cancelar notificação', id, e);
    }
  });
}