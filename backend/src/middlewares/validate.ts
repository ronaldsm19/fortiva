import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { AppError } from '@/lib/AppError';

type Source = 'body' | 'query' | 'params';

/** Valida req[source] con un schema Zod y reemplaza el valor con el parseado. */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw AppError.badRequest('Datos inválidos', err.flatten().fieldErrors);
      }
      throw err;
    }
  };
}
