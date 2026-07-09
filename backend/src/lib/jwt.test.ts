import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signAccessToken, verifyAccessToken, type AccessPayload } from '@/lib/jwt';
import { AppError } from '@/lib/AppError';

// Tests de firma/verificación del access token (sin BD ni red). Los secretos de prueba
// los inyecta vitest.config.ts vía `test.env`.
const payload: AccessPayload = { sub: 'user-1', accountId: 'acc-1', role: 'admin' };

describe('jwt', () => {
  it('firma y verifica: el payload sobrevive el round-trip', () => {
    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.accountId).toBe(payload.accountId);
    expect(decoded.role).toBe(payload.role);
  });

  it('un token basura lanza AppError 401', () => {
    expect(() => verifyAccessToken('esto-no-es-un-jwt')).toThrow(AppError);
    try {
      verifyAccessToken('esto-no-es-un-jwt');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).statusCode).toBe(401);
    }
  });

  it('rechaza un token firmado con otro secreto', () => {
    const ajeno = jwt.sign(payload, 'otro_secreto_totalmente_distinto', { expiresIn: '15m' });
    expect(() => verifyAccessToken(ajeno)).toThrow(AppError);
  });

  it('rechaza un token expirado', () => {
    // Firmado con el MISMO secreto de prueba pero ya vencido.
    const secret = process.env.JWT_ACCESS_SECRET as string;
    const vencido = jwt.sign(payload, secret, { expiresIn: -10 });
    expect(() => verifyAccessToken(vencido)).toThrow(AppError);
  });
});
