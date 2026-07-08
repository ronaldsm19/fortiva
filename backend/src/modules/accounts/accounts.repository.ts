import { prisma } from '@/config/prisma';
import type { CoupleInput } from './accounts.schemas';

/** Repositorio de la cuenta (tenant). Siempre acotado por accountId. */
export const accountsRepository = {
  findById: (accountId: string) =>
    prisma.account.findUnique({ where: { id: accountId } }),

  listMembers: (accountId: string) =>
    prisma.user.findMany({
      where: { accountId },
      select: { id: true, fullName: true, email: true, role: true, personKey: true },
      orderBy: { createdAt: 'asc' },
    }),

  updateCouple: (accountId: string, data: CoupleInput) =>
    prisma.account.update({ where: { id: accountId }, data }),

  getUser: (userId: string) => prisma.user.findUnique({ where: { id: userId } }),

  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  /** La "pareja" es el miembro con personKey = 'luis' (persona 2). */
  findPartner: (accountId: string) =>
    prisma.user.findFirst({ where: { accountId, personKey: 'luis' } }),

  createMember: (data: {
    accountId: string;
    email: string;
    passwordHash: string;
    fullName: string;
  }) =>
    prisma.user.create({
      data: { ...data, role: 'member', personKey: 'luis', mustChangePw: true },
    }),
};
