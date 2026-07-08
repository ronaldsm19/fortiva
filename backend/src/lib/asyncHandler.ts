import type { NextFunction, Request, Response } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

/** Envuelve un handler async para propagar errores al error middleware (Express 4). */
export const asyncHandler =
  (fn: Handler) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
