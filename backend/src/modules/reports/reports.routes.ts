import { Router, type Request, type Response } from 'express';
import { prisma } from '@/config/prisma';
import { centsToUsd, MESES } from '@/lib/present';
import { env } from '@/config/env';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';
import { AppError } from '@/lib/AppError';
import { rangeFromQuery } from '@/lib/dates';
import { rowsToCsv } from '@/lib/csv';
import { movementsService } from '@/modules/movements/movements.service';

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

// ---------- Export CSV ----------

/** Encabezados del CSV de movimientos (orden fijo, en español). */
const EXPORT_HEADERS: string[] = [
  'Fecha', 'Descripción', 'Categoría', 'Tipo', 'Moneda',
  'Monto (moneda de entrada)', 'Monto USD', 'Monto CRC',
  'TC compra', 'TC venta', 'Fecha TC',
];

/** Movimiento (ya mapeado por movementsService.list) que necesita el export. */
type ExportMovement = {
  date: string; // "05 Jul"
  desc: string;
  cat: string;
  type: 'income' | 'expense';
  currency: 'USD' | 'CRC';
  amount: number; // USD
  amountCrc: number; // colones
  fxBuy: number | null;
  fxSell: number | null;
  fxDate: string | null; // ISO
};

/** Fila del CSV para un movimiento, en el mismo orden que EXPORT_HEADERS. */
function movementToRow(m: ExportMovement): (string | number)[] {
  const tipo = m.type === 'income' ? 'Ingreso' : 'Gasto';
  // "Monto (moneda de entrada)": el monto tal como se ingresó (colones si currency=CRC).
  const montoEntrada = m.currency === 'CRC' ? String(m.amountCrc) : m.amount.toFixed(2);
  return [
    m.date,
    m.desc,
    m.cat,
    tipo,
    m.currency,
    montoEntrada,
    m.amount.toFixed(2),
    String(m.amountCrc),
    m.fxBuy ?? '',
    m.fxSell ?? '',
    m.fxDate ? m.fxDate.slice(0, 10) : '', // solo la fecha (sin hora)
  ];
}

// GET /reports/export?format=csv&year=&month=&owner= → descarga un CSV de los movimientos
// del período. Protegido a nivel de router (requireAuth + resolveTenant): usa req.accountId,
// por lo que respeta el aislamiento por cuenta.
reportsRoutes.get(
  '/reports/export',
  asyncHandler(async (req: Request, res: Response) => {
    const accountId = req.accountId!;
    const format = String(req.query.format ?? 'csv').toLowerCase();

    // PDF es fase 2 del issue #7: se deja pendiente para no meter una dependencia pesada.
    if (format === 'pdf') {
      throw new AppError(501, 'La exportación a PDF está pendiente (fase 2).', 'NOT_IMPLEMENTED');
    }

    // Rango: mes+año (rangeFromQuery). Si solo viene el año (reporte anual), el año completo.
    const yearNum = req.query.year != null ? Number(req.query.year) : undefined;
    let range = rangeFromQuery(req.query);
    if (!range && yearNum != null && !Number.isNaN(yearNum)) {
      range = { gte: new Date(Date.UTC(yearNum, 0, 1)), lt: new Date(Date.UTC(yearNum + 1, 0, 1)) };
    }

    const owner = (req.query.owner as 'todos' | 'ana' | 'luis' | 'pareja') ?? 'todos';
    const movements = await movementsService.list(accountId, owner, range);
    const csv = rowsToCsv([EXPORT_HEADERS, ...movements.map(movementToRow)]);

    // Nombre del archivo: fortiva-movimientos-<año>[-<mes>].csv (mes 1-based, 2 dígitos).
    const year = yearNum != null && !Number.isNaN(yearNum) ? yearNum : new Date().getUTCFullYear();
    const monthNum = req.query.month != null ? Number(req.query.month) : NaN;
    const monthPart = Number.isInteger(monthNum) ? `-${String(monthNum + 1).padStart(2, '0')}` : '';
    const filename = `fortiva-movimientos-${year}${monthPart}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // BOM UTF-8 para que Excel muestre bien acentos y símbolos de moneda.
    res.send('﻿' + csv);
  }),
);
