import { prisma } from '@/config/prisma';
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
 *
 * Además de `getFxRates()` (scraper directo), este módulo expone `getDailyFxRate()`, que
 * persiste un **snapshot por día** en la BD (`fx_rates`) para que todos los movimientos
 * del mismo día usen el MISMO TC y el BCCR se consulte una sola vez al día (ver issue #5).
 */
export interface FxRates {
  buy: number; // compra
  sell: number; // venta
  date: Date; // fecha/hora del TC según el BCCR
  source: 'bccr' | 'cache' | 'fallback' | 'db';
}

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

/** Scraping puro del BCCR (sin caché). Lanza si la petición o el parseo fallan. */
async function fetchFromBccr(): Promise<FxRates> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  const res = await fetch(BCCR_URL, {
    signal: ctrl.signal,
    headers: { 'User-Agent': 'Mozilla/5.0 (Fortiva)' },
  }).finally(() => clearTimeout(timer));
  if (!res.ok) throw new Error(`BCCR respondió HTTP ${res.status}`);
  const ari = parseAri(await res.text());
  if (!ari) throw new Error('No se encontró la fila de ARI en la tabla del BCCR');
  return { ...ari, source: 'bccr' };
}

/** Devuelve el TC actual (cacheado ≤1h). Nunca lanza. */
export async function getFxRates(): Promise<FxRates> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { ...cache.rates, source: 'cache' };
  }
  try {
    const rates = await fetchFromBccr();
    cache = { rates, at: Date.now() };
    return rates;
  } catch (err) {
    console.error('[bccrFx] no se pudo obtener el TC del BCCR:', err instanceof Error ? err.message : err);
    if (cache) return { ...cache.rates, source: 'cache' };
    return fallback();
  }
}

// ---------- Snapshot diario (persistido en BD) ----------

/** Clave de día en UTC ("YYYY-MM-DD"): identifica el snapshot del día. */
function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// Snapshot del día cacheado en memoria: capa rápida para instancias serverless
// "calientes" (evita ir a la BD en cada movimiento). Se invalida al cambiar de día.
let dailyCache: { day: string; rates: FxRates } | null = null;

/** Convierte un registro de `fx_rates` al contrato FxRates (source: 'db'). */
function snapToRates(snap: { buy: number; sell: number; fetchedAt: Date }): FxRates {
  return { buy: snap.buy, sell: snap.sell, date: snap.fetchedAt, source: 'db' };
}

/**
 * TC del día leído del snapshot en BD (`fx_rates`): así todos los movimientos del mismo
 * día usan el MISMO TC y el BCCR se scrapea una sola vez al día.
 *
 * Orden: caché en memoria → snapshot del día en BD → (si falta) scraping + upsert.
 * Nunca lanza: ante cualquier error cae al scraper directo (que ya trae su fallback).
 */
export async function getDailyFxRate(): Promise<FxRates> {
  const day = utcDayKey();
  if (dailyCache && dailyCache.day === day) return dailyCache.rates;
  try {
    const snap = await prisma.fxRate.findUnique({ where: { day } });
    if (snap) {
      const rates = snapToRates(snap);
      dailyCache = { day, rates };
      return rates;
    }
    // Primer movimiento del día sin snapshot (el cron no corrió aún): lo crea on-demand.
    return await refreshDailyFxRate(day);
  } catch (err) {
    console.error('[bccrFx] no se pudo leer el snapshot diario del TC:', err instanceof Error ? err.message : err);
    return getFxRates();
  }
}

/**
 * Fuerza obtener el TC del día y hace upsert del snapshot en BD. Lo usa el cron diario
 * (`/jobs/fx-snapshot`) y el camino on-demand cuando aún no existe el snapshot del día.
 * Solo persiste datos reales del BCCR (nunca el fallback, para poder reintentar luego).
 * Nunca lanza.
 */
export async function refreshDailyFxRate(day = utcDayKey()): Promise<FxRates> {
  const fresh = await getFxRates();
  // No congelamos el fallback como el TC del día: dejamos que un intento posterior
  // (o el cron) cree el snapshot con datos reales del BCCR.
  if (fresh.source === 'fallback') return fresh;
  try {
    const snap = await prisma.fxRate.upsert({
      where: { day },
      create: { day, buy: fresh.buy, sell: fresh.sell, source: fresh.source, fetchedAt: fresh.date },
      update: { buy: fresh.buy, sell: fresh.sell, source: fresh.source, fetchedAt: fresh.date },
    });
    const rates = snapToRates(snap);
    dailyCache = { day, rates };
    return rates;
  } catch (err) {
    console.error('[bccrFx] no se pudo guardar el snapshot diario del TC:', err instanceof Error ? err.message : err);
    return fresh;
  }
}
