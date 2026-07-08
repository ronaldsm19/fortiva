import { Router } from 'express';
import { debtsController } from './debts.controller';
import { createDebtSchema, paymentSchema, updateDebtSchema } from './debts.schemas';
import { validate } from '@/middlewares/validate';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

export const debtsRoutes = Router();
debtsRoutes.use(requireAuth, resolveTenant);

debtsRoutes.get('/debts', asyncHandler(debtsController.list));
debtsRoutes.post('/debts', validate(createDebtSchema), asyncHandler(debtsController.create));
debtsRoutes.post('/debts/:id/payments', validate(paymentSchema), asyncHandler(debtsController.pay));
debtsRoutes.patch('/debts/:id', validate(updateDebtSchema), asyncHandler(debtsController.update));
debtsRoutes.delete('/debts/:id', asyncHandler(debtsController.remove));
