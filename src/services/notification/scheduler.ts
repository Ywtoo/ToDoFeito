import PushNotification from 'react-native-push-notification';
import { Todo } from '../../types';
import { generateNotifId, DEFAULT_CHECK_SCHEDULE_OFFSETS } from './utils';

// Agenda um ciclo e retorna array de IDs agendados (string[])
export function scheduleVerificationCycle(
  todo: Todo,
  startFromNow = false,
  customOffsets?: number[],
): string[] {
  if (!todo.dueAt) return [];

  const offsets = customOffsets || DEFAULT_CHECK_SCHEDULE_OFFSETS;
  const base = startFromNow ? Date.now() : todo.dueAt;
  const generatedIds: string[] = [];
  const now = Date.now();

  // 1) Pré-notificação: 30 minutos antes do início (se houver `dueInitial`)
  if (todo.dueInitial) {
    const preWhen = new Date(Number(todo.dueInitial) - 30 * 60 * 1000);
    if (preWhen.getTime() > now) {
      const preId = generateNotifId();
      try {
        PushNotification.localNotificationSchedule({
          id: preId,
          channelId: 'completion-channel',
          title: 'Começa em 30 minutos',
          message: todo.title,
          date: preWhen,
          playSound: true,
          vibrate: true,
          smallIcon: 'ic_notification_small',
          allowWhileIdle: true,
          userInfo: { notificationId: preId, todoId: todo.id, type: 'pre_start' },
        });
        generatedIds.push(preId);
      } catch (e) {
        console.warn('[Notifications] Falha ao agendar pré-notificação:', e);
      }
    }

    // 2) Notificação no início
    const startWhen = new Date(Number(todo.dueInitial));
    if (startWhen.getTime() > now) {
      const startId = generateNotifId();
      try {
        PushNotification.localNotificationSchedule({
          id: startId,
          channelId: 'completion-channel',
          title: 'Começou',
          message: todo.title,
          date: startWhen,
          playSound: true,
          vibrate: true,
          smallIcon: 'ic_notification_small',
          allowWhileIdle: true,
          userInfo: { notificationId: startId, todoId: todo.id, type: 'start' },
        });
        generatedIds.push(startId);
      } catch (e) {
        console.warn('[Notifications] Falha ao agendar notificação de início:', e);
      }
    }
  }

  // 3) Notificação no término (dueAt)
  const endWhen = new Date(Number(todo.dueAt));
  if (endWhen.getTime() > now) {
    const endId = generateNotifId();
    try {
      PushNotification.localNotificationSchedule({
        id: endId,
        channelId: 'completion-channel',
        title: 'Prazo',
        message: todo.title,
        date: endWhen,
        playSound: true,
        vibrate: true,
        smallIcon: 'ic_notification_small',
        allowWhileIdle: true,
        userInfo: { notificationId: endId, todoId: todo.id, type: 'end' },
      });
      generatedIds.push(endId);
    } catch (e) {
      console.warn('[Notifications] Falha ao agendar notificação de término:', e);
    }
  }

  // 4) Pós-término: os offsets já existentes (mantemos comportamento anterior)
  offsets.forEach((offsetMs, index) => {
    let effectiveOffset = offsetMs;
    if (startFromNow && index === 0) effectiveOffset = __DEV__ ? 5 * 1000 : 60 * 1000;

    const when = new Date(base + effectiveOffset);
    if (when.getTime() <= now) return;

    const notifId = generateNotifId(index + 1000);

    try {
      PushNotification.localNotificationSchedule({
        id: notifId,
        channelId: 'completion-channel',
        title: index === 0 ? 'Já concluiu essa tarefa?' : `Lembrete de atraso: ${todo.title}`,
        message: index === 0 ? todo.title : `Já se passaram ${Math.floor(offsetMs / 3600000)}h do prazo. Vamos concluir?`,
        date: when,
        playSound: true,
        vibrate: true,
          smallIcon: 'ic_notification_small',
        allowWhileIdle: true,
        userInfo: { notificationId: notifId, todoId: todo.id, type: 'cycle_check' },
      });

      generatedIds.push(notifId);
    } catch (e) {
      console.warn('[Notifications] Falha ao agendar check:', e);
    }
  });
  return generatedIds;
}

// Agenda um lembrete simples baseado em `todo.reminderInterval` (compat com antiga API)
export function scheduleNotificationFor(todo: Todo): string | undefined {
  if (!todo.reminderInterval) return undefined;
  const when = new Date(todo.reminderInterval);

  const safeId = generateNotifId();
  const id = String(safeId);

  const isImmediate = when.getTime() <= Date.now();
  try {
    if (isImmediate) {
      PushNotification.localNotification({
        channelId: 'completion-channel',
        title: 'Lembrete',
        message: todo.title,
        playSound: true,
        vibrate: true,
        smallIcon: 'ic_notification_small',
      });
    } else {
      PushNotification.localNotificationSchedule({
        id,
        channelId: 'completion-channel',
        title: 'Lembrete',
        message: todo.title,
        date: when,
        playSound: true,
        vibrate: true,
        allowWhileIdle: true,
        smallIcon: 'ic_notification_small',
      });
    }
    return id;
  } catch (e) {
    console.warn('[Notifications] Falha ao agendar lembrete:', e);
    return undefined;
  }
}
