import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import {
  centsToUsd, fmtDayMon, MESES, ownerToLabel, scopeToLabel, usdToCents, SAVINGS_CATEGORIES,
} from '@/lib/present';
import { AppError } from '@/lib/AppError';
import type { CreateMovementInput, UpdateMovementInput } from './movements.schemas';

type MovementWithCat = Prisma.MovementGetPayload<{ include: { category: true } }>;

function mapMovement(m: MovementWithCat) {
  return {
    id: m.id,
    date: fmtDayMon(m.occurredOn),
    cat: m.category?.name ?? '—',
    type: m.type,
    amount: centsToUsd(m.amountCents),
    desc: m.description,
    scope: scopeToLabel[m.scope],
    owner: ownerToLabel[m.ownerKey],
    icon: m.icon,
  };
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
    const m = await prisma.movement.create({
      data: {
        accountId,
        categoryId: category?.id ?? null,
        type: input.type,
        amountCents: usdToCents(input.amount),
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
    if (input.type !== undefined) data.type = input.type;
    if (input.amount !== undefined) data.amountCents = usdToCents(input.amount);
    if (input.description !== undefined) data.description = input.description;
    if (input.occurredOn !== undefined) data.occurredOn = new Date(input.occurredOn);
    if (input.scope !== undefined) data.scope = input.scope;
    if (input.ownerKey !== undefined) data.ownerKey = input.ownerKey;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.categoryName !== undefined) {
      const cat = input.categoryName
        ? await prisma.category.findFirst({ where: { accountId, name: input.categoryName } })
        : null;
      data.categoryId = cat?.id ?? null;
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
