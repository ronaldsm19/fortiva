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
