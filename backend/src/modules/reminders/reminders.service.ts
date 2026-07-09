import { Prisma, type Reminder } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { centsToUsd, fmtDayMon, reminderStatusToLabel } from '@/lib/present';
import { amountsFromCurrency, crcOrFallback } from '@/lib/fxAmounts';
import { getDailyFxRate } from '@/lib/bccrFx';
import { AppError } from '@/lib/AppError';
import type { CreateReminderInput, UpdateReminderInput } from './reminders.schemas';

function mapReminder(r: Reminder) {
  return {
    id: r.id,
    name: r.name,
    issuer: r.issuer,
    amount: centsToUsd(r.amountCents), // USD (canónico)
    // colones: si es un recordatorio previo sin valor, se deriva con el TC de respaldo.
    amountCrc: crcOrFallback(r.amountCrc, r.amountCents),
    currency: r.currency ?? 'USD', // moneda en que se ingresó (previos: USD)
    fxBuy: r.fxBuy ?? null,
    fxSell: r.fxSell ?? null,
    fxDate: r.fxDate ? r.fxDate.toISOString() : null,
    due: fmtDayMon(r.dueDate),
    status: reminderStatusToLabel[r.status],
    email: r.emailEnabled,
    icon: r.icon,
  };
}

/** Campos NO monetarios (create/update) → data de Prisma. El monto se maneja aparte (TC). */
function toData(input: Partial<CreateReminderInput>): Prisma.ReminderUncheckedUpdateInput {
  const d: Prisma.ReminderUncheckedUpdateInput = {};
  if (input.name !== undefined) d.name = input.name;
  if (input.issuer !== undefined) d.issuer = input.issuer;
  if (input.dueDate !== undefined) d.dueDate = new Date(input.dueDate);
  if (input.emailEnabled !== undefined) d.emailEnabled = input.emailEnabled;
  if (input.status !== undefined) d.status = input.status;
  if (input.icon !== undefined) d.icon = input.icon;
  return d;
}

async function assertOwned(accountId: string, id: string) {
  const found = await prisma.reminder.findFirst({ where: { id, accountId } });
  if (!found) throw AppError.notFound('Recordatorio no encontrado');
  return found;
}

export const remindersService = {
  async list(accountId: string) {
    const rows = await prisma.reminder.findMany({ where: { accountId }, orderBy: { dueDate: 'asc' } });
    return rows.map(mapReminder);
  },

  async create(accountId: string, input: CreateReminderInput) {
    // Congela el TC del día. Recordatorio no es ingreso/gasto → se usa el TC de venta.
    const fx = await getDailyFxRate();
    const currency = input.currency ?? 'USD';
    const { cents, crc } = amountsFromCurrency(input.amount, currency, fx.sell);
    const r = await prisma.reminder.create({
      data: {
        accountId,
        name: input.name,
        issuer: input.issuer,
        amountCents: cents,
        amountCrc: crc,
        currency,
        fxBuy: fx.buy,
        fxSell: fx.sell,
        fxDate: fx.date,
        dueDate: new Date(input.dueDate),
        emailEnabled: input.emailEnabled ?? true,
        status: input.status ?? 'pending',
        icon: input.icon ?? 'bell',
      },
    });
    return mapReminder(r);
  },

  async update(accountId: string, id: string, input: UpdateReminderInput) {
    const found = await assertOwned(accountId, id);
    const data = toData(input);
    if (input.currency !== undefined) data.currency = input.currency;

    // Recalcula el monto si cambió monto/moneda. Reusa el TC congelado; si es un
    // recordatorio viejo sin TC, toma el del día y lo congela.
    if (input.amount !== undefined || input.currency !== undefined) {
      const currency = (input.currency ?? found.currency ?? 'USD') as 'USD' | 'CRC';
      let sell = found.fxSell;
      if (sell == null) {
        const fx = await getDailyFxRate();
        sell = fx.sell;
        data.fxBuy = fx.buy;
        data.fxSell = fx.sell;
        data.fxDate = fx.date;
      }
      const amountInCur =
        input.amount ?? (currency === 'CRC' ? (found.amountCrc ?? 0) : centsToUsd(found.amountCents));
      const { cents, crc } = amountsFromCurrency(amountInCur, currency, sell);
      data.amountCents = cents;
      data.amountCrc = crc;
    }
    const r = await prisma.reminder.update({ where: { id }, data });
    return mapReminder(r);
  },

  async remove(accountId: string, id: string) {
    await assertOwned(accountId, id);
    await prisma.reminder.delete({ where: { id } });
  },

  async toggleEmail(accountId: string, id: string, enabled: boolean) {
    await assertOwned(accountId, id);
    const r = await prisma.reminder.update({ where: { id }, data: { emailEnabled: enabled } });
    return mapReminder(r);
  },
};
