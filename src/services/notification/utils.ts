// Configuração dos tempos (Offsets em milissegundos a partir do término)
// Padrão: 1h, 2h, 4h, 7h
// Dev: 10s, 25s, 40s, 70s
export const DEFAULT_CHECK_SCHEDULE_OFFSETS = __DEV__ 
  ? [10 * 1000, 25 * 1000, 40 * 1000, 70 * 1000]
  : [
      1 * 60 * 60 * 1000,       // 1h
      2 * 60 * 60 * 1000,       // 2h
      4 * 60 * 60 * 1000,       // 4h
      7 * 60 * 60 * 1000        // 7h
    ];

export function generateNotifId(suffix = 0): string {
  const safe = Math.floor((Date.now() % 1_000_000_000) + Math.random() * 100_000) + suffix;
  return String(safe);
}

export function toIdArray(ids?: string | string[]): string[] {
  if (!ids) return [];
  if (Array.isArray(ids)) return ids;
  return String(ids).split(',').map(s => s.trim()).filter(Boolean);
}