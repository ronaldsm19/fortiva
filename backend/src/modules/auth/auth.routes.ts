import { Router } from 'express';
import { authController } from './auth.controller';
import {
  changePasswordSchema, forgotPasswordSchema, loginSchema, refreshSchema,
  registerSchema, resetPasswordSchema,
} from './auth.schemas';
import { validate } from '@/middlewares/validate';
import { requireAuth } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

export const authRoutes = Router();

authRoutes.post('/auth/register', validate(registerSchema), asyncHandler(authController.register));
authRoutes.post('/auth/login', validate(loginSchema), asyncHandler(authController.login));
authRoutes.post('/auth/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
authRoutes.post('/auth/logout', validate(refreshSchema), asyncHandler(authController.logout));
authRoutes.post('/auth/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
authRoutes.post('/auth/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

// Perfil del usuario autenticado
authRoutes.get('/me', requireAuth, asyncHandler(authController.me));

// Cambio de contraseña (requiere sesión + contraseña actual)
authRoutes.post(
  '/auth/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
