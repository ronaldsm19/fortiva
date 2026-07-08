import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import {
  centsToUsd, fmtDayMon, MESES, ownerToLabel, scopeToLabel, usdToCents, SAVINGS_CATEGORIES,
} from '@/lib/present';
import { AppError } from '@/lib/AppError';
import { getFxRates } from '@/lib/bccrFx';
import { env } from '@/config/env';
import type { CreateMovementInput, UpdateMovementInput } from './movements.schemas';

type MovementWithCat = Prisma.MovementGetPayload<{ include: { category: true } }>;

function mapMovement(m: MovementWithCat) {
  return {
    id: m.id,
    date: fmtDayMon(m.occurredOn),
    cat: m.category?.name ?? '—',
    type: m.type,
    amount: centsToUsd(m.amountCents), // USD
    // colones: si es un movimiento previo sin valor, se deriva con el TC de respaldo.
    amountCrc: m.amountCrc ?? Math.round(centsToUsd(m.amountCents) * env.FX_FALLBACK),
    currency: m.currency ?? 'USD', // moneda en que se ingresó (previos: USD)
    fxBuy: m.fxBuy ?? null,
    fxSell: m.fxSell ?? null,
    fxDate: m.fxDate ? m.fxDate.toISOString() : null,
    desc: m.description,
    scope: scopeToLabel[m.scope],
    owner: ownerToLabel[m.ownerKey],
    icon: m.icon,
  };
}

/**
 * A partir del monto ingresado (en `currency`), calcula el valor en USD (centavos) y en
 * colones (enteros) con el TC: **compra para ingresos, venta para gastos**.
 */
function computeAmounts(
  amount: number,
  currency: 'USD' | 'CRC',
  type: 'income' | 'expense',
  fxBuy: number,
  fxSell: number,
): { amountCents: number; amountCrc: number } {
  const rate = type === 'income' ? fxBuy : fxSell;
  if (currency === 'CRC') {
    const crc = Math.round(amount);
    const usd = rate > 0 ? crc / rate : 0;
    return { amountCents: usdToCents(usd), amountCrc: crc };
  }
  return { amountCents: usdToCents(amount), amountCrc: Math.round(amount * rate) };
}

type Range = { gte: Date; lt: Date } | undefined;

export const movementsService = {
  async list(accountId: string, owner: 'todos' | 'ana' | 'luis' | 'pareja', range?: Range) {
    const where: Prisma.MovementWhereInput = { accountId };
    if (owner !== 'todos') where.ownerKey = owner;
    if (range) where.occurredOn = range;
    const rows = await prisma.movement.findMany({
      where,
      include: { category: true },
      orderBy: { occurredOn: 'desc' },
    });
    return rows.map(mapMovement);
  },

  async create(accountId: string, input: CreateMovementInput) {
    const category = input.categoryName
      ? await prisma.category.findFirst({ where: { accountId, name: input.categoryName } })
      : null;
    const fx = await getFxRates();
    const currency = input.currency ?? 'USD';
    const { amountCents, amountCrc } = computeAmounts(input.amount, currency, input.type, fx.buy, fx.sell);
    const m = await prisma.movement.create({
      data: {
        accountId,
        categoryId: category?.id ?? null,
        type: input.type,
        amountCents,
        amountCrc,
        currency,
        fxBuy: fx.buy,
        fxSell: fx.sell,
        fxDate: fx.date,
        description: input.description,
        occurredOn: input.occurredOn ? new Date(input.occurredOn) : new Date(),
        scope: input.scope,
        ownerKey: input.ownerKey,
        icon: input.icon ?? 'wallet',
      },
      include: { category: true },
    });
    return mapMovement(m);
  },

  async update(accountId: string, id: string, input: UpdateMovementInput) {
    const found = await prisma.movement.findFirst({ where: { id, accountId } });
    if (!found) throw AppError.notFound('Movimiento no encontrado');
    const data: Prisma.MovementUncheckedUpdateInput = {};
    if (input.description !== undefined) data.description = input.description;
    if (input.occurredOn !== undefined) data.occurredOn = new Date(input.occurredOn);
    if (input.scope !== undefined) data.scope = input.scope;
    if (input.ownerKey !== undefined) data.ownerKey = input.ownerKey;
    if (input.type !== undefined) data.type = input.type;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.categoryName !== undefined) {
      const cat = input.categoryName
        ? await prisma.category.findFirst({ where: { accountId, name: input.categoryName } })
        : null;
      data.categoryId = cat?.id ?? null;
    }

    // Recalcula montos si cambió monto/moneda/tipo. Usa el TC ya guardado (histórico);
    // si es un movimiento viejo sin TC, toma el actual y lo congela.
    if (input.amount !== undefined || input.currency !== undefined || input.type !== undefined) {
      const type = input.type ?? found.type;
      const currency = (input.currency ?? found.currency ?? 'USD') as 'USD' | 'CRC';
      let buy = found.fxBuy;
      let sell = found.fxSell;
      if (buy == null || sell == null) {
        const fx = await getFxRates();
        buy = fx.buy;
        sell = fx.sell;
        data.fxBuy = fx.buy;
        data.fxSell = fx.sell;
        data.fxDate = fx.date;
      }
      const amountInCurrency =
        input.amount ?? (currency === 'CRC' ? (found.amountCrc ?? 0) : centsToUsd(found.amountCents));
      const { amountCents, amountCrc } = computeAmounts(amountInCurrency, currency, type, buy, sell);
      data.amountCents = amountCents;
      data.amountCrc = amountCrc;
    }

    const m = await prisma.movement.update({ where: { id }, data, include: { category: true } });
    return mapMovement(m);
  },

  async remove(accountId: string, id: string) {
    const found = await prisma.movement.findFirst({ where: { id, accountId } });
    if (!found) throw AppError.notFound('Movimiento no encontrado');
    await prisma.movement.delete({ where: { id } });
  },

  /** KPIs del dashboard (ingresos, gastos, disponible, ahorro) en USD. */
  async summary(accountId: string, range?: Range) {
    const where: Prisma.MovementWhereInput = { accountId };
    if (range) where.occurredOn = range;
    const rows = await prisma.movement.findMany({ where, include: { category: true } });
    let ingresos = 0, gastos = 0, ahorro = 0;
    for (const r of rows) {
      if (r.type === 'income') ingresos += r.amountCents;
      else {
        gastos += r.amountCents;
        if (r.category && SAVINGS_CATEGORIES.includes(r.category.name)) ahorro += r.amountCents;
      }
    }
    return {
      ingresos: centsToUsd(ingresos),
      gastos: centsToUsd(gastos),
      disponible: centsToUsd(ingresos - gastos),
      ahorro: centsToUsd(ahorro),
    };
  },

  /** Serie de los últimos N meses (ingreso/gasto por mes) terminando en refMonth/refYear. */
  async series(accountId: string, months: number, refMonth?: number, refYear?: number) {
    const rows = await prisma.movement.findMany({ where: { accountId } });
    const bucket = new Map<string, { i: number; g: number }>();
    for (const r of rows) {
      const k = `${r.occurredOn.getUTCFullYear()}-${r.occurredOn.getUTCMonth()}`;
      const b = bucket.get(k) ?? { i: 0, g: 0 };
      if (r.type === 'income') b.i += r.amountCents;
      else b.g += r.amountCents;
      bucket.set(k, b);
    }
    const now = new Date();
    const endYear = refYear ?? now.getUTCFullYear();
    const endMonth = refMonth ?? now.getUTCMonth();
    const out = [];
    for (let k = months - 1; k >= 0; k--) {
      const dt = new Date(Date.UTC(endYear, endMonth - k, 1));
      const b = bucket.get(`${dt.getUTCFullYear()}-${dt.getUTCMonth()}`) ?? { i: 0, g: 0 };
      out.push({ m: MESES[dt.getUTCMonth()], i: centsToUsd(b.i), g: centsToUsd(b.g) });
    }
    return out;
  },
};
