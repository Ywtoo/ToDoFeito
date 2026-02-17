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
