import { Router, type Request, type Response } from 'express';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';

/**
 * Namespaces reservados para Fase 7 (integraciones externas de recibos/gastos fijos).
 * Protegidos por auth+tenant, devuelven 501 hasta implementarse.
 * Los módulos de negocio (movements, categories, debts, reminders, networth, reports)
 * ya están implementados en sus propios routers.
 */
export const placeholderRoutes = Router();
placeholderRoutes.use(requireAuth, resolveTenant);

const notImplemented = (module: string) => (_req: Request, res: Response) =>
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: `Módulo "${module}" llega en una fase posterior` },
  });

// Fase 7 — integraciones externas de recibos/gastos fijos.
placeholderRoutes.all('/integrations', notImplemented('integrations'));
