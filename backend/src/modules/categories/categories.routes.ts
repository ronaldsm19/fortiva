import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { createCategorySchema, updateCategorySchema } from './categories.schemas';
import { validate } from '@/middlewares/validate';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

export const categoriesRoutes = Router();
categoriesRoutes.use(requireAuth, resolveTenant);

categoriesRoutes.get('/categories', asyncHandler(categoriesController.list));
categoriesRoutes.post('/categories', validate(createCategorySchema), asyncHandler(categoriesController.create));
categoriesRoutes.patch('/categories/:id', validate(updateCategorySchema), asyncHandler(categoriesController.update));
categoriesRoutes.delete('/categories/:id', asyncHandler(categoriesController.remove));
