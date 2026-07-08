import { Router } from 'express';
import { movementsController } from './movements.controller';
import { createMovementSchema, updateMovementSchema } from './movements.schemas';
import { validate } from '@/middlewares/validate';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

export const movementsRoutes = Router();
movementsRoutes.use(requireAuth, resolveTenant);

movementsRoutes.get('/movements/summary', asyncHandler(movementsController.summary));
movementsRoutes.get('/movements', asyncHandler(movementsController.list));
movementsRoutes.post('/movements', validate(createMovementSchema), asyncHandler(movementsController.create));
movementsRoutes.patch('/movements/:id', validate(updateMovementSchema), asyncHandler(movementsController.update));
movementsRoutes.delete('/movements/:id', asyncHandler(movementsController.remove));
