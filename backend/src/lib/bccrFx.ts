import { env } from '@/config/env';

/**
 * Tipo de cambio del dólar (colones por USD) tomado de la tabla de "ventanilla" del
 * BCCR, fila de **ARI Casa de Cambio Internacional S.A.**
 *
 *   https://gee.bccr.fi.cr/IndicadoresEconomicos/Cuadros/frmConsultaTCVentanilla.aspx
 *
 * La página es HTML estático (un GET simple la devuelve completa). Parseamos con regex
 * la fila de ARI, que luce así:
 *
 *   <td align="left">ARI Casa de Cambio Internacional S.A.</td>
 *   <td align="right">451,60</td>   ← compra
 *   <td align="right">457,47</td>   ← venta
 *   <td align="right">5,87</td>
 *   <td>07/07/2026  04:39 p.m.</td>
 *
 * Se cachea en memoria (TTL corto) y **nunca lanza**: ante cualquier fallo devuelve el
 * último valor conocido o el fallback de configuración, para no bloquear el guardado de
 * un movimiento.
 */
export interface FxRates {
  buy: number; // compra
  sell: number; // venta
  date: Date; // fecha/hora del TC según el BCCR
  source: 'bccr' | 'cache' | 'fallback';
}

/**
 * MEJORA FUTURA (fuente primaria más robusta): el BCCR ofrece un web service oficial
 * `GEEServicioWeb` (`/IndicadoresEconomicos/WebServices/wsIndicadoresEconomicos.asmx`)
 * con el método `ObtenerIndicadoresEconomicosXML`, que devuelve XML estable en vez de
 * HTML frágil. Los indicadores del dólar son **317 = compra** y **318 = venta**. Requiere
 * registrarse para obtener un correo+token de acceso. La integración sería: usar 317/318
 * como fuente primaria y dejar este scraping de la ventanilla (fila de ARI) como respaldo,
 * conservando la misma firma de `getFxRates()` y el mismo comportamiento de "nunca lanza".
 */
const BCCR_URL =
  'https://gee.bccr.fi.cr/IndicadoresEconomicos/Cuadros/frmConsultaTCVentanilla.aspx';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const FETCH_TIMEOUT_MS = 6000;

let cache: { rates: FxRates; at: number } | null = null;

/** "1.451,60" → 1451.6 (formato de Costa Rica: punto de miles, coma decimal). */
function parseCrNumber(s: string): number {
  return Number(s.trim().replace(/\./g, '').replace(',', '.'));
}

/** Extrae compra/venta/fecha de la fila de ARI. Devuelve null si no la encuentra. */
function parseAri(html: string): Omit<FxRates, 'source'> | null {
  const idx = html.indexOf('ARI Casa de Cambio Internacional');
  if (idx === -1) return null;
  const slice = html.slice(idx, idx + 800);
  const nums = [...slice.matchAll(/<td[^>]*align="right"[^>]*>\s*([\d.,]+)\s*<\/td>/gi)];
  if (nums.length < 2) return null;
  const buy = parseCrNumber(nums[0][1]);
  const sell = parseCrNumber(nums[1][1]);
  if (!Number.isFinite(buy) || !Number.isFinite(sell) || buy <= 0 || sell <= 0) return null;
  const dm = slice.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const date = dm ? new Date(Number(dm[3]), Number(dm[2]) - 1, Number(dm[1])) : new Date();
  return { buy, sell, date };
}

function fallback(): FxRates {
  return { buy: env.FX_FALLBACK, sell: env.FX_FALLBACK, date: new Date(), source: 'fallback' };
}

/** Devuelve el TC actual (cacheado ≤1h). Nunca lanza. */
export async function getFxRates(): Promise<FxRates> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { ...cache.rates, source: 'cache' };
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(BCCR_URL, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Fortiva)' },
    }).finally(() => clearTimeout(timer));
    if (!res.ok) throw new Error(`BCCR respondió HTTP ${res.status}`);
    const ari = parseAri(await res.text());
    if (!ari) throw new Error('No se encontró la fila de ARI en la tabla del BCCR');
    const rates: FxRates = { ...ari, source: 'bccr' };
    cache = { rates, at: Date.now() };
    return rates;
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    // Degradado pero aceptable: seguimos con el último TC conocido en caché.
    if (cache) {
      console.warn(
        `[bccrFx][FALLBACK] No se pudo refrescar el TC del BCCR (motivo: ${motivo}). ` +
          `Se reutiliza el último TC en caché (compra=${cache.rates.buy}, venta=${cache.rates.sell}).`,
      );
      return { ...cache.rates, source: 'cache' };
    }
    // Sin caché disponible: se usa el TC de respaldo de configuración (FX_FALLBACK).
    console.error(
      `[bccrFx][FALLBACK] No se pudo obtener el TC del BCCR y no hay caché (motivo: ${motivo}). ` +
        `Se usa el TC de respaldo FX_FALLBACK=${env.FX_FALLBACK} colones por USD. ` +
        `Posible causa: el BCCR cambió el HTML/formato o quitó a "ARI Casa de Cambio Internacional".`,
    );
    return fallback();
  }
}
