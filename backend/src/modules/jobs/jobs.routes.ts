import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { runReminderNotifications } from '@/jobs/reminders.job';
import { refreshDailyFxRate } from '@/lib/bccrFx';
import { env } from '@/config/env';

/**
 * Endpoints de tareas programadas. En Vercel no hay proceso permanente, así que
 * `node-cron` no corre: en su lugar, Vercel Cron (ver `vercel.json`) llama a estos
 * endpoints en el horario configurado. Vercel añade `Authorization: Bearer <CRON_SECRET>`
 * cuando la variable `CRON_SECRET` está definida; validamos ese secreto aquí.
 */
export const jobsRoutes = Router();

jobsRoutes.get(
  '/jobs/reminders',
  asyncHandler(async (req: Request, res: Response) => {
    if (env.CRON_SECRET) {
      const auth = req.header('authorization');
      if (auth !== `Bearer ${env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'No autorizado' });
      }
    }
    const result = await runReminderNotifications();
    res.json({ ok: true, ...result });
  }),
);

// Snapshot diario del TC del BCCR (issue #5): guarda el TC del día en `fx_rates` para
// que los movimientos del día lo lean de la BD en vez de scrapear por movimiento.
jobsRoutes.get(
  '/jobs/fx-snapshot',
  asyncHandler(async (req: Request, res: Response) => {
    if (env.CRON_SECRET) {
      const auth = req.header('authorization');
      if (auth !== `Bearer ${env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'No autorizado' });
      }
    }
    const fx = await refreshDailyFxRate();
    res.json({
      ok: true,
      buy: fx.buy,
      sell: fx.sell,
      date: fx.date.toISOString(),
      source: fx.source,
    });
  }),
);
