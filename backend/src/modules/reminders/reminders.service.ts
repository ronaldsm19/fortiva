import { Prisma, type Reminder } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { centsToUsd, fmtDayMon, reminderStatusToLabel, usdToCents } from '@/lib/present';
import { AppError } from '@/lib/AppError';
import type { CreateReminderInput, UpdateReminderInput } from './reminders.schemas';

function mapReminder(r: Reminder) {
  return {
    id: r.id,
    name: r.name,
    issuer: r.issuer,
    amount: centsToUsd(r.amountCents),
    due: fmtDayMon(r.dueDate),
    status: reminderStatusToLabel[r.status],
    email: r.emailEnabled,
    icon: r.icon,
  };
}

/** Campos comunes (create/update) → data de Prisma. */
function toData(input: Partial<CreateReminderInput>): Prisma.ReminderUncheckedUpdateInput {
  const d: Prisma.ReminderUncheckedUpdateInput = {};
  if (input.name !== undefined) d.name = input.name;
  if (input.issuer !== undefined) d.issuer = input.issuer;
  if (input.amount !== undefined) d.amountCents = usdToCents(input.amount);
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
    const r = await prisma.reminder.create({
      data: {
        accountId,
        name: input.name,
        issuer: input.issuer,
        amountCents: usdToCents(input.amount),
        dueDate: new Date(input.dueDate),
        emailEnabled: input.emailEnabled ?? true,
        status: input.status ?? 'pending',
        icon: input.icon ?? 'bell',
      },
    });
    return mapReminder(r);
  },

  async update(accountId: string, id: string, input: UpdateReminderInput) {
    await assertOwned(accountId, id);
    const r = await prisma.reminder.update({ where: { id }, data: toData(input) });
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
