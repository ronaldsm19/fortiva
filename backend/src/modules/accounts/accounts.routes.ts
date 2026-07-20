import { Router } from 'express';
import { accountsController } from './accounts.controller';
import { coupleSchema, currencySchema, inviteMemberSchema } from './accounts.schemas';
import { validate } from '@/middlewares/validate';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

export const accountsRoutes = Router();

// Todas las rutas de cuenta requieren auth + tenant resuelto.
accountsRoutes.use(requireAuth, resolveTenant);

accountsRoutes.get('/account', asyncHandler(accountsController.get));
accountsRoutes.get('/account/members', asyncHandler(accountsController.members));
accountsRoutes.post(
  '/account/members',
  validate(inviteMemberSchema),
  asyncHandler(accountsController.invite),
);
accountsRoutes.get('/account/couple', asyncHandler(accountsController.getCouple));
accountsRoutes.patch(
  '/account/couple',
  validate(coupleSchema),
  asyncHandler(accountsController.updateCouple),
);
accountsRoutes.patch(
  '/account/currency',
  validate(currencySchema),
  asyncHandler(accountsController.updateCurrency),
);
