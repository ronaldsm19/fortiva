import { Prisma, type Debt } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { centsToUsd, fmtDayMon, ownerToLabel } from '@/lib/present';
import { amountsFromCurrency, crcOrFallback } from '@/lib/fxAmounts';
import { getDailyFxRate } from '@/lib/bccrFx';
import { AppError } from '@/lib/AppError';
import type { CreateDebtInput, PaymentInput, UpdateDebtInput } from './debts.schemas';

const labelToOwner = { Ana: 'ana', Luis: 'luis', Pareja: 'pareja' } as const;

function mapDebt(d: Debt) {
  return {
    id: d.id,
    name: d.name,
    issuer: d.issuer,
    paid: centsToUsd(d.paidCents), // USD
    total: centsToUsd(d.totalCents), // USD (canónico)
    monthly: centsToUsd(d.monthlyCents), // USD (canónico)
    // colones: si es una deuda previa sin valor, se deriva con el TC de respaldo.
    totalCrc: crcOrFallback(d.totalCrc, d.totalCents),
    monthlyCrc: crcOrFallback(d.monthlyCrc, d.monthlyCents),
    currency: d.currency ?? 'USD', // moneda en que se ingresó (previas: USD)
    fxBuy: d.fxBuy ?? null,
    fxSell: d.fxSell ?? null,
    fxDate: d.fxDate ? d.fxDate.toISOString() : null,
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
    // Congela el TC del día (una deuda se valora al momento de crearla).
    const fx = await getDailyFxRate();
    const currency = input.currency ?? 'USD';
    // Deuda no es ingreso/gasto → se usa el TC de venta (fx.sell).
    const totals = amountsFromCurrency(input.total, currency, fx.sell);
    const monthly = amountsFromCurrency(input.monthly, currency, fx.sell);
    const d = await prisma.debt.create({
      data: {
        accountId,
        name: input.name,
        issuer: input.issuer,
        ownerKey: labelToOwner[input.owner],
        totalCents: totals.cents,
        totalCrc: totals.crc,
        monthlyCents: monthly.cents,
        monthlyCrc: monthly.crc,
        currency,
        fxBuy: fx.buy,
        fxSell: fx.sell,
        fxDate: fx.date,
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
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.rate !== undefined) data.rate = input.rate;
    if (input.icon !== undefined) data.icon = input.icon;

    // Recalcula montos si cambió total/cuota/moneda. Reusa el TC ya congelado; si es una
    // deuda vieja sin TC, toma el del día y lo congela (mismo criterio que Movimientos).
    if (input.total !== undefined || input.monthly !== undefined || input.currency !== undefined) {
      const currency = (input.currency ?? found.currency ?? 'USD') as 'USD' | 'CRC';
      let sell = found.fxSell;
      if (sell == null) {
        const fx = await getDailyFxRate();
        sell = fx.sell;
        data.fxBuy = fx.buy;
        data.fxSell = fx.sell;
        data.fxDate = fx.date;
      }
      const totalInCur =
        input.total ?? (currency === 'CRC' ? (found.totalCrc ?? 0) : centsToUsd(found.totalCents));
      const monthlyInCur =
        input.monthly ?? (currency === 'CRC' ? (found.monthlyCrc ?? 0) : centsToUsd(found.monthlyCents));
      const totals = amountsFromCurrency(totalInCur, currency, sell);
      const monthly = amountsFromCurrency(monthlyInCur, currency, sell);
      data.totalCents = totals.cents;
      data.totalCrc = totals.crc;
      data.monthlyCents = monthly.cents;
      data.monthlyCrc = monthly.crc;
    }
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
    // El pago va en la moneda de la deuda (o la indicada). Se convierte a centavos USD con el
    // TC de venta CONGELADO de la deuda, para que `paidCents` quede consistente con `totalCents`
    // (una deuda vieja sin TC congelado usa el del día).
    const currency = (input.currency ?? debt.currency ?? 'USD') as 'USD' | 'CRC';
    const sell = debt.fxSell ?? (await getDailyFxRate()).sell;
    const { cents } = amountsFromCurrency(input.amount, currency, sell);
    const newPaid = Math.min(debt.totalCents, debt.paidCents + cents);

    await prisma.debtPayment.create({
      data: { debtId, accountId, amountCents: cents, paidOn: new Date(), method: input.method },
    });
    const updated = await prisma.debt.update({ where: { id: debtId }, data: { paidCents: newPaid } });
    return mapDebt(updated);
  },
};
