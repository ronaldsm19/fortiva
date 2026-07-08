import { prisma } from '@/config/prisma';
import type { Prisma } from '@prisma/client';

/** Acceso a datos de auth. Todo lo relacionado con users/accounts/refresh tokens. */
export const authRepository = {
  findUserByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email }, include: { account: true } }),

  findUserById: (id: string) =>
    prisma.user.findUnique({ where: { id }, include: { account: true } }),

  /** Crea cuenta (tenant) + usuario admin en una transacción, con categorías base. */
  createAccountWithAdmin: (data: {
    accountName: string;
    email: string;
    passwordHash: string;
    fullName: string;
    nationalId?: string;
    phone?: string;
    trialEndsAt: Date;
    baseCategories: Prisma.CategoryCreateWithoutAccountInput[];
  }) =>
    prisma.account.create({
      data: {
        name: data.accountName,
        // El trial arranca en el registro (que hace auto-login).
        trialEndsAt: data.trialEndsAt,
        status: 'trialing',
        users: {
          create: {
            email: data.email,
            passwordHash: data.passwordHash,
            fullName: data.fullName,
            nationalId: data.nationalId,
            phone: data.phone,
            role: 'admin',
            personKey: 'ana',
            lastLoginAt: new Date(),
          },
        },
        categories: { create: data.baseCategories },
      },
      include: { users: true },
    }),

  // Dos escrituras independientes (no requieren atomicidad estricta). Secuenciales
  // para no depender de transacciones (MongoDB las exige vía replica set).
  setLoginAndTrial: async (userId: string, accountId: string, trialEndsAt: Date) => {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
    await prisma.account.update({
      where: { id: accountId },
      data: { trialEndsAt, status: 'trialing' },
    });
  },

  touchLogin: (userId: string) =>
    prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }),

  createRefreshToken: (data: { userId: string; tokenHash: string; expiresAt: Date }) =>
    prisma.refreshToken.create({ data }),

  // NOTA MongoDB: los campos opcionales sin valor se OMITEN del documento, por lo que
  // filtrar `revokedAt: null` no matchea. Verificamos la revocación en código.
  findValidRefreshToken: async (tokenHash: string) => {
    const record = await prisma.refreshToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      include: { user: { include: { account: true } } },
    });
    if (!record || record.revokedAt) return null;
    return record;
  },

  // Revoca por hash (el tokenHash es único por token). Idempotente.
  revokeRefreshToken: (tokenHash: string) =>
    prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    }),

  updatePassword: (userId: string, passwordHash: string) =>
    prisma.user.update({ where: { id: userId }, data: { passwordHash, mustChangePw: false } }),

  setResetToken: (userId: string, tokenHash: string, expiresAt: Date) =>
    prisma.user.update({
      where: { id: userId },
      data: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt },
    }),

  findByResetToken: (tokenHash: string) =>
    prisma.user.findFirst({
      where: { resetTokenHash: tokenHash, resetTokenExpiresAt: { gt: new Date() } },
    }),

  clearResetTokenAndSetPassword: (userId: string, passwordHash: string) =>
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null, mustChangePw: false },
    }),
};
