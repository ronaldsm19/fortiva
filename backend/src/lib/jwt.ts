import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from './AppError';

export interface AccessPayload {
  sub: string; // user id
  accountId: string;
  role: 'admin' | 'member';
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  } catch {
    throw AppError.unauthorized('Token de acceso inválido o expirado');
  }
}

/** El refresh token es opaco (aleatorio) y se guarda hasheado en DB — ver hash.ts. */
