import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { runReminderNotifications } from '@/jobs/reminders.job';
import { env } from '@/config/env';

/**
 * Endpoints de tareas programadas. En Vercel no hay proceso permanente, así que
 * `node-cron` no corre: en su lugar, Vercel Cron (ver `vercel.json`) llama a estos
 * endpoints en el horario configurado. Vercel añade `Authorization: Bearer <CRON_SECRET>`
 * cuando la variable `CRON_SECRET` está definida; validamos ese secreto aquí.
 */
export const jobsRoutes = Router();

/** Resultado de la validación del secreto de cron. */
type CronAuthResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Valida que la petición provenga de Vercel Cron (o de quien conozca el secreto).
 *
 * - En **producción** el `CRON_SECRET` es OBLIGATORIO: si no está definido, el endpoint
 *   quedaría abierto, así que respondemos 500 (mala configuración del servidor).
 * - Siempre que el secreto exista, exigimos `Authorization: Bearer <CRON_SECRET>` → 401.
 * - En **desarrollo** se permite sin secreto para facilitar las pruebas locales.
 *
 * Reutilizable para cualquier endpoint de cron de este módulo.
 */
function requireCronSecret(req: Request): CronAuthResult {
  if (!env.CRON_SECRET) {
    if (env.NODE_ENV === 'production') {
      console.error(
        '[jobs][config] CRON_SECRET no está definido en producción: se rechaza la petición de cron.',
      );
      return { ok: false, status: 500, error: 'CRON_SECRET no está configurado en el servidor' };
    }
    // Solo en desarrollo: sin secreto configurado, se permite el acceso.
    return { ok: true };
  }
  const auth = req.header('authorization');
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return { ok: false, status: 401, error: 'No autorizado' };
  }
  return { ok: true };
}

jobsRoutes.get(
  '/jobs/reminders',
  asyncHandler(async (req: Request, res: Response) => {
    const auth = requireCronSecret(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }
    const result = await runReminderNotifications();
    res.json({ ok: true, ...result });
  }),
);
