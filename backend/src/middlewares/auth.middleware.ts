import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@/lib/jwt';
import { AppError } from '@/lib/AppError';

/** Verifica el access token del header Authorization y adjunta req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Falta el token de acceso');
  }
  const token = header.slice(7);
  req.user = verifyAccessToken(token);
  next();
}
