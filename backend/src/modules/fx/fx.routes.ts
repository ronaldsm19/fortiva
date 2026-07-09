import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { getDailyFxRate } from '@/lib/bccrFx';

/**
 * Tipo de cambio del día (colones por USD): el snapshot en BD (mismo TC que usan los
 * movimientos del día). Lo consume el modal de movimientos para mostrar el TC. Es
 * info pública.
 */
export const fxRoutes = Router();

fxRoutes.get(
  '/fx',
  asyncHandler(async (_req: Request, res: Response) => {
    const fx = await getDailyFxRate();
    res.json({
      data: { buy: fx.buy, sell: fx.sell, date: fx.date.toISOString(), source: fx.source },
    });
  }),
);
