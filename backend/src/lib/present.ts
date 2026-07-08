/**
 * Mappers de presentación: convierten el modelo interno (centavos, enums, fechas)
 * a los DTOs que espera el frontend (USD, etiquetas en español, "05 Jul").
 * Así el frontend no cambia: consume exactamente `services/types.ts`.
 */
export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const centsToUsd = (c: number): number => Math.round(c) / 100;
export const usdToCents = (n: number): number => Math.round(n * 100);

export const fmtDayMon = (d: Date | null): string =>
  d ? `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]}` : '—';

export const ownerToLabel = { ana: 'Ana', luis: 'Luis', pareja: 'Pareja' } as const;
export const scopeToLabel = { shared: 'Compartido', individual: 'Individual' } as const;
export const reminderStatusToLabel = { pending: 'pendiente', paid: 'pagado' } as const;

/** Categorías que cuentan como "ahorro" para el KPI del dashboard. */
export const SAVINGS_CATEGORIES = ['Inversión', 'Fondo de seguridad'];
