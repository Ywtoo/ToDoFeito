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

  offsets.forEach((offsetMs, index) => {
    let effectiveOffset = offsetMs;
    if (startFromNow && index === 0) effectiveOffset = __DEV__ ? 5 * 1000 : 60 * 1000;

    const when = new Date(base + effectiveOffset);
    if (when.getTime() <= Date.now()) return;

    const notifId = generateNotifId(index);

    try {
      PushNotification.localNotificationSchedule({
        id: notifId,
        channelId: 'completion-channel',
        title: index === 0 ? 'Já concluiu essa tarefa?' : `Lembrete de atraso: ${todo.title}`,
        message: index === 0 ? todo.title : `Já se passaram ${Math.floor(offsetMs / 3600000)}h do prazo. Vamos concluir?`,
        date: when,
        playSound: true,
        vibrate: true,
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
      });
    }
    return id;
  } catch (e) {
    console.warn('[Notifications] Falha ao agendar lembrete:', e);
    return undefined;
  }
}