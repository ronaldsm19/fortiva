import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const ROUNDS = 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Hash SHA-256 para almacenar refresh tokens (no reversible, comparación por igualdad). */
export const sha256 = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

/** Token opaco aleatorio (para refresh tokens e invitaciones). */
export const randomToken = () => crypto.randomBytes(48).toString('hex');

/** Contraseña temporal legible (10 chars alfanuméricos) para invitados. */
export const generateTempPassword = () =>
  crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
