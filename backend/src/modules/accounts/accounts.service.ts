import type { SplitMode } from '@prisma/client';
import { accountsRepository } from './accounts.repository';
import type { CoupleInput, InviteMemberInput } from './accounts.schemas';
import { AppError } from '@/lib/AppError';
import { trialDaysLeft } from '@/lib/trial';
import { prisma } from '@/config/prisma';
import { centsToUsd } from '@/lib/present';
import { generateTempPassword, hashPassword } from '@/lib/hash';
import { invitePartnerEmailHtml, sendMail } from '@/lib/email';
import { env } from '@/config/env';

/** Total de gastos compartidos del mes (para la vista previa de reparto). */
async function sharedExpenseTotal(accountId: string): Promise<number> {
  const agg = await prisma.movement.aggregate({
    where: { accountId, type: 'expense', scope: 'shared' },
    _sum: { amountCents: true },
  });
  return centsToUsd(agg._sum.amountCents ?? 0);
}

/** Salario del mes actual por persona: suma de ingresos con ownerKey = ana | luis. */
async function salaryByOwner(accountId: string): Promise<{ ana: number; luis: number }> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const rows = await prisma.movement.groupBy({
    by: ['ownerKey'],
    where: {
      accountId,
      type: 'income',
      ownerKey: { in: ['ana', 'luis'] },
      occurredOn: { gte: monthStart },
    },
    _sum: { amountCents: true },
  });
  const sumFor = (k: 'ana' | 'luis') =>
    centsToUsd(rows.find((r) => r.ownerKey === k)?._sum.amountCents ?? 0);
  return { ana: sumFor('ana'), luis: sumFor('luis') };
}

/**
 * Reparto efectivo según el modo. En modo salario deriva el % de la pareja 1
 * con la fórmula salarioAna / (salarioAna + salarioLuis). Si aún no hay ingresos
 * por persona, cae al splitP1Pct guardado y devuelve salarios en 0 para que la UI avise.
 */
async function resolveSplit(
  accountId: string,
  splitMode: SplitMode,
  storedP1Pct: number,
): Promise<{ splitP1Pct: number; salaryP1: number; salaryP2: number }> {
  if (splitMode !== 'salary') {
    return { splitP1Pct: storedP1Pct, salaryP1: 0, salaryP2: 0 };
  }
  const { ana, luis } = await salaryByOwner(accountId);
  const total = ana + luis;
  const splitP1Pct = total > 0 ? Math.round((ana / total) * 100) : storedP1Pct;
  return { splitP1Pct, salaryP1: ana, salaryP2: luis };
}

async function coupleView(accountId: string, acc: { coupleMode: boolean; splitMode: SplitMode; splitP1Pct: number }) {
  const [sharedTotal, split] = await Promise.all([
    sharedExpenseTotal(accountId),
    resolveSplit(accountId, acc.splitMode, acc.splitP1Pct),
  ]);
  return {
    coupleMode: acc.coupleMode,
    splitMode: acc.splitMode,
    splitP1Pct: split.splitP1Pct,
    salaryP1: split.salaryP1,
    salaryP2: split.salaryP2,
    sharedTotal,
  };
}

export const accountsService = {
  async get(accountId: string) {
    const acc = await accountsRepository.findById(accountId);
    if (!acc) throw AppError.notFound('Cuenta no encontrada');
    return {
      id: acc.id,
      name: acc.name,
      plan: acc.plan,
      status: acc.status,
      currencyPref: acc.currencyPref,
      trialEndsAt: acc.trialEndsAt,
      trialDaysLeft: trialDaysLeft(acc.trialEndsAt),
    };
  },

  members: (accountId: string) => accountsRepository.listMembers(accountId),

  async getCouple(accountId: string) {
    const acc = await accountsRepository.findById(accountId);
    if (!acc) throw AppError.notFound('Cuenta no encontrada');
    return coupleView(accountId, acc);
  },

  async updateCouple(accountId: string, input: CoupleInput) {
    const acc = await accountsRepository.updateCouple(accountId, input);
    return coupleView(accountId, acc);
  },

  /**
   * Invita a la pareja: crea su usuario (persona 2, acceso completo al mismo hogar)
   * con contraseña temporal y le envía un correo con los accesos. Solo el admin.
   */
  async invitePartner(
    accountId: string,
    inviterUserId: string,
    inviterRole: 'admin' | 'member',
    input: InviteMemberInput,
  ) {
    if (inviterRole !== 'admin') {
      throw AppError.forbidden('Solo el administrador del hogar puede invitar');
    }
    const emailTaken = await accountsRepository.findUserByEmail(input.email);
    if (emailTaken) throw AppError.conflict('Ese correo ya está registrado');

    const partner = await accountsRepository.findPartner(accountId);
    if (partner) throw AppError.conflict('Ya agregaste a tu pareja en este hogar');

    const [account, inviter] = await Promise.all([
      accountsRepository.findById(accountId),
      accountsRepository.getUser(inviterUserId),
    ]);

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const member = await accountsRepository.createMember({
      accountId,
      email: input.email,
      passwordHash,
      fullName: input.fullName,
    });

    const emailRes = await sendMail({
      to: input.email,
      subject: `${inviter?.fullName ?? 'Tu pareja'} te invitó a Fortiva`,
      html: invitePartnerEmailHtml({
        partnerName: input.fullName,
        inviterName: inviter?.fullName ?? 'Tu pareja',
        householdName: account?.name ?? 'tu hogar',
        email: input.email,
        tempPassword,
        loginUrl: `${env.APP_URL}/login`,
      }),
    });

    return {
      member: { id: member.id, fullName: member.fullName, email: member.email, personKey: member.personKey },
      tempPassword, // se devuelve para mostrarlo en la UI como respaldo si el correo falla
      emailed: emailRes.ok,
      emailError: emailRes.ok ? undefined : emailRes.error,
    };
  },
};
