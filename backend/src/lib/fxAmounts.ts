import { centsToUsd, usdToCents } from './present';
import { env } from '@/config/env';

/**
 * A partir de un monto ingresado en `currency` y un TC (colones por USD), devuelve el valor
 * canónico en USD (centavos) y el valor en colones (enteros). Mismo criterio que
 * `computeAmounts` de Movimientos, pero con una sola tasa: deudas, recordatorios y activos
 * **no son ingreso/gasto**, así que se congelan con el TC de **venta** (`fx.sell`) por
 * defecto. (Si en el futuro se quisiera compra/venta según la naturaleza del registro,
 * basta con pasar aquí la tasa deseada.)
 *
 * Soporta montos negativos (p. ej. un pasivo en Patrimonio): el signo se conserva.
 */
export function amountsFromCurrency(
  amount: number,
  currency: 'USD' | 'CRC',
  rate: number,
): { cents: number; crc: number } {
  if (currency === 'CRC') {
    const crc = Math.round(amount);
    const usd = rate > 0 ? crc / rate : 0;
    return { cents: usdToCents(usd), crc };
  }
  return { cents: usdToCents(amount), crc: Math.round(amount * rate) };
}

/**
 * Valor en colones de un registro para mostrar/sumar: usa el `*Crc` congelado; si falta
 * (registros previos a esta función), lo deriva del valor en USD con el TC de respaldo.
 * Mismo fallback que usa `mapMovement` para que los totales cuadren entre pantallas.
 */
export function crcOrFallback(crc: number | null, cents: number): number {
  return crc ?? Math.round(centsToUsd(cents) * env.FX_FALLBACK);
}
