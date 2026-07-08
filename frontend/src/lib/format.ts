export type Currency = 'USD' | 'CRC';

const CRC_RATE = Number(import.meta.env.VITE_CRC_RATE ?? 525);

/**
 * Formatea un monto **en USD** (base) según la moneda seleccionada.
 * Los montos internos siempre son USD; CRC se deriva con la tasa mock.
 */
export function fmt(usd: number, currency: Currency): string {
  const n = Math.abs(usd);
  if (currency === 'CRC') {
    return '₡' + Math.round(n * CRC_RATE).toLocaleString('es-CR');
  }
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
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
