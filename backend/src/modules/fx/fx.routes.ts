import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { getFxRates } from '@/lib/bccrFx';

/**
 * Tipo de cambio actual (colones por USD) desde el BCCR (ARI Casa de Cambio).
 * Lo consume el modal de movimientos para mostrar el TC del día. Es info pública.
 */
export const fxRoutes = Router();

fxRoutes.get(
  '/fx',
  asyncHandler(async (_req: Request, res: Response) => {
    const fx = await getFxRates();
    res.json({
      data: { buy: fx.buy, sell: fx.sell, date: fx.date.toISOString(), source: fx.source },
    });
  }),
);
