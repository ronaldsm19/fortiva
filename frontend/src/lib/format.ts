export type Currency = 'USD' | 'CRC';

const CRC_RATE = Number(import.meta.env.VITE_CRC_RATE ?? 525);

/**
 * Formatea un monto **en USD** (base) según la moneda seleccionada.
 * Los montos internos siempre son USD; CRC se deriva con la tasa mock.
 */
export function fmt(usd: number, currency: Currency, rate: number = CRC_RATE): string {
  const n = Math.abs(usd);
  if (currency === 'CRC') {
    return '₡' + Math.round(n * rate).toLocaleString('es-CR');
  }
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** Formatea un monto ya expresado en su propia moneda (para mostrarlo tal cual se ingresó). */
export function money(amount: number, currency: Currency): string {
  const n = Math.abs(amount);
  return currency === 'CRC'
    ? '₡' + Math.round(n).toLocaleString('es-CR')
    : '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** Valor en colones de un movimiento: usa el guardado; si falta (mock/previos), deriva con `rate`. */
export function crcOf(m: { amount: number; amountCrc?: number }, rate: number): number {
  return m.amountCrc ?? Math.round(m.amount * rate);
}

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/** Fondo de icono a ~15% del color de categoría. */
export function tint(color: string, amount = 15): string {
  return `color-mix(in srgb, ${color} ${amount}%, transparent)`;
}
