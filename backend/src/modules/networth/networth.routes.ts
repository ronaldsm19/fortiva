import { Router, type Request, type Response } from 'express';
import { prisma } from '@/config/prisma';
import { centsToUsd } from '@/lib/present';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

export const networthRoutes = Router();
networthRoutes.use(requireAuth, resolveTenant);

// Lista de activos/pasivos (el frontend calcula neto y donut). GET /networth
networthRoutes.get(
  '/networth',
  asyncHandler(async (req: Request, res: Response) => {
    const rows = await prisma.asset.findMany({
      where: { accountId: req.accountId! },
      orderBy: { createdAt: 'asc' },
    });
    res.json({
      data: rows.map((a) => ({
        id: a.id,
        name: a.name,
        amount: centsToUsd(a.amountCents),
        icon: a.icon,
        color: a.color,
        isAsset: a.isAsset,
      })),
    });
  }),
);
