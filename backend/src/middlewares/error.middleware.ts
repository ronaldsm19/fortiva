import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '@/lib/AppError';
import { env } from '@/config/env';

/** Convierte cualquier error en una respuesta JSON uniforme { error: {...} }. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Violación de restricción única de Prisma (p. ej. email o categoría repetida)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'El recurso ya existe', details: err.meta },
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'Error interno del servidor',
      ...(env.NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
}

/** 404 para rutas no montadas. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
}
