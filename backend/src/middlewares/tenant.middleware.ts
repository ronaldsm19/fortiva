import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@/lib/AppError';

/**
 * Resuelve el tenant (accountId) desde el token ya verificado.
 * Debe ir DESPUÉS de requireAuth. Todos los repositorios filtran por req.accountId.
 */
export function resolveTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.accountId) {
    throw AppError.unauthorized('No se pudo resolver la cuenta del usuario');
  }
  req.accountId = req.user.accountId;
  next();
}
