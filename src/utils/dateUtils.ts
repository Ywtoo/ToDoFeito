export function toDateValue(value: unknown, verification = true): Date | null {
  if (verification) {
    if (value == null) return null;
    if (value instanceof Date) return value;
  }

// Tenta converter strings e números
  if (typeof value === 'number' || 
    typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // Tenta converter objetos com método toDate
  if (
    value != null &&
    typeof value === 'object' &&
    typeof (value as any).toDate === 'function'
  ) {
    try {
      const d = (value as any).toDate();
      return toDateValue(d);
    } catch {
      return null;
    }
  }

  return null;
}

export function combineDateAndTime(date: Date, time: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0,
  );
}

/**
 * Formata data de forma situacional:
 * - Hoje: só hora ("14:30")
 * - Essa semana: dia da semana + hora ("Dom 14:30")
 * - Esse ano: dia/mês + hora ("15/03 14:30")
 * - Outro ano: dia/mês/ano + hora ("15/03/25 14:30")
 */
export function formatSituationalDate(date: Date | string | number | null): string {
  const d = toDateValue(date, true);
  if (!d) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const diffMs = targetDay.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  // Hoje: só hora
  if (diffDays === 0) {
    return timeStr;
  }

  // Essa semana (-7 a +7 dias)
  if (diffDays >= -7 && diffDays <= 7) {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = weekdays[d.getDay()];
    return `${dayName} ${timeStr}`;
  }

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');

  // Esse ano: dia/mês + hora
  if (d.getFullYear() === now.getFullYear()) {
    return `${day}/${month} ${timeStr}`;
  }

  // Outro ano: dia/mês/ano (2 dígitos) + hora
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year} ${timeStr}`;
}
