import { env } from '@/config/env';

/** Fecha de fin del trial: ahora + TRIAL_DAYS (arranca en el primer login). */
export function trialEndDate(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + env.TRIAL_DAYS);
  return d;
}

/** Días restantes de trial (null si no hay trial activo, 0 si ya venció). */
export function trialDaysLeft(trialEndsAt: Date | null): number | null {
  if (!trialEndsAt) return null;
  const ms = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
