import { Router, type Request, type Response } from 'express';
import { prisma } from '@/config/prisma';
import { centsToUsd, MESES } from '@/lib/present';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

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

    // Serie mensual del año
    const months = Array.from({ length: 12 }, () => ({ i: 0, g: 0 }));
    for (const m of movements) {
      if (m.occurredOn.getUTCFullYear() !== year) continue;
      const idx = m.occurredOn.getUTCMonth();
      if (m.type === 'income') months[idx].i += m.amountCents;
      else months[idx].g += m.amountCents;
    }
    const series = months.map((b, idx) => ({ m: MESES[idx], i: centsToUsd(b.i), g: centsToUsd(b.g) }));

    // Top categorías por gasto
    const byCat = new Map<string, number>();
    let totalExpense = 0;
    for (const m of movements) {
      if (m.type !== 'expense' || !m.categoryId) continue;
      byCat.set(m.categoryId, (byCat.get(m.categoryId) ?? 0) + m.amountCents);
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
        pct: totalExpense ? Math.round((cents / totalExpense) * 100) : 0,
      }));

    res.json({ data: { series, topCategories } });
  }),
);
