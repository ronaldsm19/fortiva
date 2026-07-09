import { Router, type Request, type Response } from 'express';
import { prisma } from '@/config/prisma';
import { centsToUsd, MESES } from '@/lib/present';
import { env } from '@/config/env';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

/** Colones de un movimiento con el mismo fallback que `mapMovement` (TC histórico congelado). */
const crcOf = (m: { amountCrc: number | null; amountCents: number }): number =>
  m.amountCrc ?? Math.round(centsToUsd(m.amountCents) * env.FX_FALLBACK);

export const reportsRoutes = Router();
reportsRoutes.use(requireAuth, resolveTenant);

// GET /reports/annual?year=2026 → { series (12 meses), topCategories }
reportsRoutes.get(
  '/reports/annual',
  asyncHandler(async (req: Request, res: Response) => {
    const accountId = req.accountId!;
    const year = Number(req.query.year) || new Date().getUTCFullYear();

    const [movements, categories] = await Promise.all([
      prisma.movement.findMany({ where: { accountId } }),
      prisma.category.findMany({ where: { accountId } }),
    ]);

    // Serie mensual del año — USD (i/g) + colones (iCrc/gCrc) con TC histórico por movimiento.
    const months = Array.from({ length: 12 }, () => ({ i: 0, g: 0, iCrc: 0, gCrc: 0 }));
    for (const m of movements) {
      if (m.occurredOn.getUTCFullYear() !== year) continue;
      const idx = m.occurredOn.getUTCMonth();
      const crc = crcOf(m);
      if (m.type === 'income') {
        months[idx].i += m.amountCents;
        months[idx].iCrc += crc;
      } else {
        months[idx].g += m.amountCents;
        months[idx].gCrc += crc;
      }
    }
    const series = months.map((b, idx) => ({
      m: MESES[idx], i: centsToUsd(b.i), g: centsToUsd(b.g), iCrc: b.iCrc, gCrc: b.gCrc,
    }));

    // Top categorías por gasto (monto en USD y en colones)
    const byCat = new Map<string, number>();
    const byCatCrc = new Map<string, number>();
    let totalExpense = 0;
    for (const m of movements) {
      if (m.type !== 'expense' || !m.categoryId) continue;
      byCat.set(m.categoryId, (byCat.get(m.categoryId) ?? 0) + m.amountCents);
      byCatCrc.set(m.categoryId, (byCatCrc.get(m.categoryId) ?? 0) + crcOf(m));
      totalExpense += m.amountCents;
    }
    const colorOf = new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }]));
    const topCategories = [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, cents]) => ({
        name: colorOf.get(id)?.name ?? '—',
        color: colorOf.get(id)?.color ?? '#2456C9',
        amount: centsToUsd(cents),
        amountCrc: byCatCrc.get(id) ?? 0,
        pct: totalExpense ? Math.round((cents / totalExpense) * 100) : 0,
      }));

    res.json({ data: { series, topCategories } });
  }),
);
