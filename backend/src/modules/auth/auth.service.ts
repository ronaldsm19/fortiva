import { authRepository } from './auth.repository';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { hashPassword, verifyPassword, sha256, randomToken } from '@/lib/hash';
import { signAccessToken } from '@/lib/jwt';
import { trialEndDate, trialDaysLeft } from '@/lib/trial';
import { AppError } from '@/lib/AppError';
import { baseCategories } from '@/domain/baseCategories';
import { env } from '@/config/env';
import { resetPasswordEmailHtml, sendMail, welcomeTrialEmailHtml } from '@/lib/email';
import type { Account, User } from '@prisma/client';

/** Convierte "7d"/"15m" a milisegundos (para el vencimiento del refresh token). */
function ttlToMs(ttl: string): number {
  const m = ttl.match(/^(\d+)([smhd])$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]]!;
  return n * unit;
}

function toMe(user: User, account: Account) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    personKey: user.personKey,
    mustChangePw: user.mustChangePw,
    account: {
      id: account.id,
      name: account.name,
      plan: account.plan,
      status: account.status,
      coupleMode: account.coupleMode,
      trialEndsAt: account.trialEndsAt,
      trialDaysLeft: trialDaysLeft(account.trialEndsAt),
    },
  };
}

async function issueTokens(user: User & { account: Account }) {
  const accessToken = signAccessToken({
    sub: user.id,
    accountId: user.accountId,
    role: user.role,
  });
  const refreshToken = randomToken();
  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL)),
  });
  return { accessToken, refreshToken, user: toMe(user, user.account) };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) throw AppError.conflict('Ya existe una cuenta con ese correo');

    const passwordHash = await hashPassword(input.password);
    const trialEndsAt = trialEndDate();
    const account = await authRepository.createAccountWithAdmin({
      accountName: input.accountName,
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      nationalId: input.nationalId,
      phone: input.phone,
      trialEndsAt,
      baseCategories,
    });

    // Correo de bienvenida con la prueba de 7 días (no bloquea el registro si falla).
    await sendMail({
      to: input.email,
      subject: '¡Bienvenido a Fortiva! Tu prueba de 7 días está activa',
      html: welcomeTrialEmailHtml({
        name: input.fullName,
        loginUrl: `${env.APP_URL}/login`,
        trialDays: env.TRIAL_DAYS,
      }),
    });

    const created = await authRepository.findUserById(account.users[0].id);
    return issueTokens(created as User & { account: Account });
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw AppError.unauthorized('Credenciales inválidas');

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw AppError.unauthorized('Credenciales inválidas');

    // Trial: arranca en el PRIMER login (cuando aún no hay trialEndsAt).
    if (!user.account.trialEndsAt) {
      const ends = trialEndDate();
      await authRepository.setLoginAndTrial(user.id, user.accountId, ends);
      user.account.trialEndsAt = ends;
      user.account.status = 'trialing';
    } else {
      await authRepository.touchLogin(user.id);
    }

    return issueTokens(user);
  },

  async refresh(refreshToken: string) {
    const record = await authRepository.findValidRefreshToken(sha256(refreshToken));
    if (!record) throw AppError.unauthorized('Refresh token inválido o expirado');

    // Rotación: se revoca el usado y se emite uno nuevo.
    await authRepository.revokeRefreshToken(record.tokenHash);
    return issueTokens(record.user);
  },

  async logout(refreshToken: string) {
    await authRepository.revokeRefreshToken(sha256(refreshToken));
  },

  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw AppError.notFound('Usuario no encontrado');
    return toMe(user, user.account);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw AppError.notFound('Usuario no encontrado');

    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw AppError.unauthorized('La contraseña actual no es correcta');
    if (currentPassword === newPassword) {
      throw AppError.badRequest('La nueva contraseña debe ser diferente a la actual');
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePassword(userId, passwordHash);
  },

  /** Solicitud de reset: genera token, lo guarda hasheado y envía correo.
   *  No revela si el correo existe (responde igual siempre). */
  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (user) {
      const token = randomToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      await authRepository.setResetToken(user.id, sha256(token), expiresAt);
      await sendMail({
        to: user.email,
        subject: 'Restablece tu contraseña de Fortiva',
        html: resetPasswordEmailHtml({
          name: user.fullName,
          resetUrl: `${env.APP_URL}/reset-password?token=${token}`,
        }),
      });
    }
    return { ok: true };
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await authRepository.findByResetToken(sha256(token));
    if (!user) throw AppError.badRequest('El enlace es inválido o expiró');
    const passwordHash = await hashPassword(newPassword);
    await authRepository.clearResetTokenAndSetPassword(user.id, passwordHash);
    return { ok: true };
  },
};
