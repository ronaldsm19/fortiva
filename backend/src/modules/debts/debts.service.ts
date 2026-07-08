import { Prisma, type Debt } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { centsToUsd, fmtDayMon, ownerToLabel, usdToCents } from '@/lib/present';
import { AppError } from '@/lib/AppError';
import type { CreateDebtInput, PaymentInput, UpdateDebtInput } from './debts.schemas';

const labelToOwner = { Ana: 'ana', Luis: 'luis', Pareja: 'pareja' } as const;

function mapDebt(d: Debt) {
  return {
    id: d.id,
    name: d.name,
    issuer: d.issuer,
    paid: centsToUsd(d.paidCents),
    total: centsToUsd(d.totalCents),
    monthly: centsToUsd(d.monthlyCents),
    rate: d.rate ?? '—',
    due: fmtDayMon(d.dueDate),
    owner: ownerToLabel[d.ownerKey],
    icon: d.icon,
  };
}

export const debtsService = {
  async list(accountId: string, filter: 'todas' | 'ana' | 'luis' | 'compartidas') {
    const where: Prisma.DebtWhereInput = { accountId };
    if (filter === 'compartidas') where.ownerKey = 'pareja';
    else if (filter === 'ana') where.ownerKey = 'ana';
    else if (filter === 'luis') where.ownerKey = 'luis';
    const rows = await prisma.debt.findMany({ where, orderBy: { createdAt: 'asc' } });
    return rows.map(mapDebt);
  },

  async create(accountId: string, input: CreateDebtInput) {
    const d = await prisma.debt.create({
      data: {
        accountId,
        name: input.name,
        issuer: input.issuer,
        ownerKey: labelToOwner[input.owner],
        totalCents: usdToCents(input.total),
        monthlyCents: usdToCents(input.monthly),
        rate: input.rate ?? null,
        icon: input.icon ?? 'credit-card',
      },
    });
    return mapDebt(d);
  },

  async update(accountId: string, id: string, input: UpdateDebtInput) {
    const found = await prisma.debt.findFirst({ where: { id, accountId } });
    if (!found) throw AppError.notFound('Deuda no encontrada');
    const data: Prisma.DebtUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.issuer !== undefined) data.issuer = input.issuer;
    if (input.owner !== undefined) data.ownerKey = labelToOwner[input.owner];
    if (input.total !== undefined) data.totalCents = usdToCents(input.total);
    if (input.monthly !== undefined) data.monthlyCents = usdToCents(input.monthly);
    if (input.rate !== undefined) data.rate = input.rate;
    if (input.icon !== undefined) data.icon = input.icon;
    const d = await prisma.debt.update({ where: { id }, data });
    return mapDebt(d);
  },

  async remove(accountId: string, id: string) {
    const found = await prisma.debt.findFirst({ where: { id, accountId } });
    if (!found) throw AppError.notFound('Deuda no encontrada');
    await prisma.debtPayment.deleteMany({ where: { debtId: id } });
    await prisma.debt.delete({ where: { id } });
  },

  async registerPayment(accountId: string, debtId: string, input: PaymentInput) {
    const debt = await prisma.debt.findFirst({ where: { id: debtId, accountId } });
    if (!debt) throw AppError.notFound('Deuda no encontrada');
    const cents = usdToCents(input.amount);
    const newPaid = Math.min(debt.totalCents, debt.paidCents + cents);

    await prisma.debtPayment.create({
      data: { debtId, accountId, amountCents: cents, paidOn: new Date(), method: input.method },
    });
    const updated = await prisma.debt.update({ where: { id: debtId }, data: { paidCents: newPaid } });
    return mapDebt(updated);
  },
};
