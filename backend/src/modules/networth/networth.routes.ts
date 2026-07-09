import { Router, type Request, type Response } from 'express';
import { assetsService } from '@/modules/assets/assets.service';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

export const networthRoutes = Router();
networthRoutes.use(requireAuth, resolveTenant);

// Lista de activos/pasivos (el frontend calcula neto y donut). GET /networth
// Reusa el mapper de assetsService para incluir moneda/colones/TC congelado por registro.
networthRoutes.get(
  '/networth',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await assetsService.list(req.accountId!) });
  }),
);
