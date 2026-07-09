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
  // 'bccr'/'cache'/'fallback'/'db' → TC ACTUAL (ventanilla/snapshot del día).
  // 'bccr-hist' → TC HISTÓRICO de una fecha pasada vía el web service oficial (issue #1).
  source: 'bccr' | 'cache' | 'fallback' | 'db' | 'bccr-hist';
}

/**
 * TC HISTÓRICO por fecha (issue #1): la ventanilla de ARI y el snapshot diario solo dan el
 * TC ACTUAL, así que un movimiento con fecha pasada NO puede resolver su TC con ellos. Para
 * eso usamos el web service oficial del BCCR `ObtenerIndicadoresEconomicosXML` (indicadores
 * **317 = compra**, **318 = venta**), que devuelve la serie histórica por rango de fechas.
 * Ver `getFxRateForDate()` más abajo. Este scraping de la ventanilla (fila de ARI) sigue
 * siendo la fuente del TC del día.
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

// ---------- TC histórico por fecha (web service oficial del BCCR, issue #1) ----------

/**
 * Un movimiento con fecha PASADA debe congelarse con el TC de ESA fecha, no el de hoy. La
 * ventanilla de ARI y el snapshot diario solo exponen el TC ACTUAL, así que para fechas
 * pasadas consultamos el web service oficial del BCCR `ObtenerIndicadoresEconomicosXML`,
 * que devuelve la serie histórica de un indicador por rango de fechas. Indicadores del
 * dólar: **317 = compra**, **318 = venta**. Requiere registrarse en el BCCR para obtener un
 * correo + token (variables `BCCR_WS_EMAIL` / `BCCR_WS_TOKEN`).
 */
const BCCR_WS_URL =
  'https://gee.bccr.fi.cr/IndicadoresEconomicos/WebServices/wsIndicadoresEconomicos.asmx';
const BCCR_WS_NS = 'http://ws.sdde.bccr.fi.cr';
const FX_INDICATOR_BUY = '317'; // compra del dólar
const FX_INDICATOR_SELL = '318'; // venta del dólar
// Fines de semana y feriados no publican TC: consultamos un rango que TERMINA en la fecha
// pedida y arranca unos días antes, y tomamos el último dato disponible ≤ esa fecha.
const HIST_LOOKBACK_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

// Caché en memoria por día: la serie histórica de una fecha ya pasada no cambia.
const histCache = new Map<string, FxRates>();

/** Fecha en formato dd/mm/yyyy (en UTC) que espera el web service del BCCR. */
function fmtBccrDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** Escapa un valor para incrustarlo con seguridad en el XML del sobre SOAP. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Revierte las entidades XML (el resultado puede venir escapado dentro del sobre SOAP). */
function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Parsea un `NUM_VALOR` del web service. El BCCR lo devuelve con punto decimal ("580.87");
 * toleramos también coma decimal por robustez. Los TC del dólar (~ cientos) no traen
 * separador de miles.
 */
function parseWsNumber(s: string): number {
  const t = s.trim();
  if (t === '') return NaN;
  if (t.includes(',') && t.includes('.')) return Number(t.replace(/\./g, '').replace(',', '.'));
  if (t.includes(',')) return Number(t.replace(',', '.'));
  return Number(t);
}

/**
 * Del XML de la serie de un indicador, devuelve el dato MÁS RECIENTE (mayor `DES_FECHA`)
 * con valor válido. Así resolvemos "el último dato ≤ la fecha pedida" aunque el rango
 * incluya fines de semana/feriados sin valor. Devuelve null si no hay ningún dato.
 */
function parseLatestFromSeries(rawXml: string): { value: number; date: Date } | null {
  const xml = unescapeXml(rawXml);
  const blocks = xml.matchAll(
    /<INGC011_CAT_INDICADORECONOMIC\b[^>]*>([\s\S]*?)<\/INGC011_CAT_INDICADORECONOMIC>/gi,
  );
  let best: { value: number; date: Date } | null = null;
  for (const b of blocks) {
    const body = b[1];
    const vm = body.match(/<NUM_VALOR\b[^>]*>([\s\S]*?)<\/NUM_VALOR>/i);
    if (!vm) continue;
    const value = parseWsNumber(vm[1]);
    if (!Number.isFinite(value) || value <= 0) continue; // fecha sin dato publicado: se salta
    const dm = body.match(/<DES_FECHA\b[^>]*>([\s\S]*?)<\/DES_FECHA>/i);
    const date = dm ? new Date(dm[1].trim()) : new Date();
    if (!best || date.getTime() > best.date.getTime()) best = { value, date };
  }
  return best;
}

/** Sobre SOAP 1.1 para `ObtenerIndicadoresEconomicosXML`. */
function buildSoapEnvelope(
  indicador: string, inicio: string, fin: string, email: string, token: string,
): string {
  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
    ' xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
    ' xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
    '<soap:Body>' +
    `<ObtenerIndicadoresEconomicosXML xmlns="${BCCR_WS_NS}">` +
    `<Indicador>${indicador}</Indicador>` +
    `<FechaInicio>${inicio}</FechaInicio>` +
    `<FechaFinal>${fin}</FechaFinal>` +
    '<Nombre>Fortiva</Nombre>' +
    '<SubNiveles>N</SubNiveles>' +
    `<CorreoElectronico>${escapeXml(email)}</CorreoElectronico>` +
    `<Token>${escapeXml(token)}</Token>` +
    '</ObtenerIndicadoresEconomicosXML>' +
    '</soap:Body>' +
    '</soap:Envelope>'
  );
}

/** Consulta un indicador (317/318) en el rango dado y devuelve su dato más reciente. */
async function fetchIndicator(
  indicador: string, inicio: string, fin: string, email: string, token: string,
): Promise<{ value: number; date: Date } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  const res = await fetch(BCCR_WS_URL, {
    method: 'POST',
    signal: ctrl.signal,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `${BCCR_WS_NS}/ObtenerIndicadoresEconomicosXML`,
      'User-Agent': 'Mozilla/5.0 (Fortiva)',
    },
    body: buildSoapEnvelope(indicador, inicio, fin, email, token),
  }).finally(() => clearTimeout(timer));
  if (!res.ok) throw new Error(`el web service del BCCR respondió HTTP ${res.status}`);
  return parseLatestFromSeries(await res.text());
}

/**
 * TC (compra/venta) del BCCR para una FECHA PASADA vía el web service oficial (317/318).
 * Toma el último dato ≤ `date` (fines de semana/feriados no publican valor). Cachea por día
 * en memoria. **NUNCA lanza**: si faltan credenciales o el servicio falla, cae a
 * `getDailyFxRate()` (TC del día), que a su vez ya trae su propio fallback — así no se
 * bloquea el guardado del movimiento.
 */
export async function getFxRateForDate(date: Date): Promise<FxRates> {
  const key = utcDayKey(date);
  const cached = histCache.get(key);
  if (cached) return cached;

  const email = env.BCCR_WS_EMAIL;
  const token = env.BCCR_WS_TOKEN;
  // Sin credenciales del web service no podemos consultar históricos: usamos el TC del día.
  if (!email || !token) return getDailyFxRate();

  try {
    const fin = fmtBccrDate(date);
    const inicio = fmtBccrDate(new Date(date.getTime() - HIST_LOOKBACK_DAYS * DAY_MS));
    const [buy, sell] = await Promise.all([
      fetchIndicator(FX_INDICATOR_BUY, inicio, fin, email, token),
      fetchIndicator(FX_INDICATOR_SELL, inicio, fin, email, token),
    ]);
    if (!buy || !sell) {
      throw new Error('el web service del BCCR no devolvió compra y/o venta para la fecha');
    }
    const rates: FxRates = {
      buy: buy.value,
      sell: sell.value,
      // Fecha real del TC (la más reciente entre compra/venta; normalmente coinciden).
      date: buy.date.getTime() >= sell.date.getTime() ? buy.date : sell.date,
      source: 'bccr-hist',
    };
    histCache.set(key, rates); // la serie histórica de esa fecha ya no cambia
    return rates;
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.warn(
      `[bccrFx][hist][FALLBACK] No se pudo obtener el TC histórico del BCCR para ${key} ` +
        `(motivo: ${motivo}). Se usa el TC del día.`,
    );
    return getDailyFxRate();
  }
}
