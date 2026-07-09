import rateLimit from 'express-rate-limit';
import { RedisStore, type SendCommandFn } from 'rate-limit-redis';
import Redis from 'ioredis';
import { env } from '@/config/env';

/**
 * Rate limiting con store compartido OPCIONAL (issue #2).
 *
 * En Vercel (Fluid compute) la app corre en varias instancias y el MemoryStore por
 * defecto de `express-rate-limit` guarda el contador en la memoria de CADA instancia,
 * así que el límite real NO es global (cada instancia cuenta por su lado).
 *
 * Si hay Redis configurado en el entorno, usamos un store compartido y el contador pasa
 * a ser GLOBAL entre instancias. Soportamos dos formas de conexión:
 *   - `REDIS_URL`                → Redis clásico por TCP (ioredis). También sirve la URL
 *                                  `rediss://` de Upstash.
 *   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 *                                → Upstash por REST (estándar en Vercel: sin conexión
 *                                  persistente, ideal para serverless).
 *
 * Si no hay Redis, caemos al MemoryStore con un `console.warn` (suficiente para dev/local;
 * no bloquea el arranque).
 *
 * NOTA (fuera del alcance de este issue): para que el contador sea por-cliente detrás del
 * proxy de Vercel hay que además configurar `trust proxy` / la IP real del cliente. Sin
 * eso el conteo sigue siendo global entre instancias (que es lo que pide este issue), pero
 * agrupado por la IP del proxy en vez de por la del cliente.
 */

// `SendCommandFn` (exportada por rate-limit-redis) es la función que reenvía comandos
// crudos a Redis: `(...args: string[]) => Promise<RedisReply>`.
let sendCommand: SendCommandFn | null = null;

if (env.REDIS_URL) {
  // Redis clásico por TCP.
  const client = new Redis(env.REDIS_URL, {
    // En serverless conviene fallar rápido en vez de encolar comandos indefinidamente.
    maxRetriesPerRequest: 3,
  });
  client.on('error', (err) => {
    console.warn(
      '[rateLimit] Error de conexión con Redis (ioredis):',
      err instanceof Error ? err.message : err,
    );
  });
  const rawCall = client.call.bind(client) as unknown as (...args: string[]) => Promise<unknown>;
  sendCommand = ((...args: string[]) => rawCall(...args)) as SendCommandFn;
  console.log('[rateLimit] Store compartido: Redis vía REDIS_URL (conteo global entre instancias).');
} else if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  // Upstash por REST: cada comando es un POST con el array `[CMD, ...args]` y responde
  // `{ result }` (o `{ error }`). No abre conexión persistente → ideal para serverless.
  const restUrl = env.UPSTASH_REDIS_REST_URL;
  const restToken = env.UPSTASH_REDIS_REST_TOKEN;
  sendCommand = (async (...args: string[]) => {
    const res = await fetch(restUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${restToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    const data = (await res.json()) as { result?: unknown; error?: string };
    if (!res.ok || data.error) {
      throw new Error(`Upstash REST respondió error: ${data.error ?? `HTTP ${res.status}`}`);
    }
    return data.result;
  }) as SendCommandFn;
  console.log('[rateLimit] Store compartido: Upstash Redis REST (conteo global entre instancias).');
} else {
  console.warn(
    '[rateLimit] Sin Redis configurado: se usa MemoryStore por instancia. En serverless ' +
      '(Vercel) el límite NO es global entre instancias. Configura REDIS_URL o ' +
      'UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (ver issue #2).',
  );
}

/**
 * Crea el store para un limiter. Con Redis devuelve un `RedisStore` (contador global,
 * separado por `prefix`); sin Redis devuelve `undefined` para que `express-rate-limit`
 * use su MemoryStore por defecto (uno propio por limiter).
 */
function makeStore(prefix: string) {
  return sendCommand ? new RedisStore({ prefix, sendCommand }) : undefined;
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

/** Límite general de la API: 300 peticiones / 15 min (como hoy). */
export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('fortiva:rl:api:'),
});

/**
 * Límite estricto para autenticación: 10 peticiones / 15 min. Frena la fuerza bruta en
 * las rutas sensibles (`/auth/login`, `/auth/register`).
 */
export const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación. Inténtalo de nuevo más tarde.' },
  store: makeStore('fortiva:rl:auth:'),
});
