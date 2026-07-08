import type { AccessPayload } from '@/lib/jwt';

/** Augmenta Express.Request con el usuario autenticado y el tenant resuelto. */
declare global {
  namespace Express {
    interface Request {
      user?: AccessPayload;
      accountId?: string;
    }
  }
}

export {};
