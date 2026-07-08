import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { AppError } from '@/lib/AppError';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json({ data: result });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.status(200).json({ data: result });
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json({ data: result });
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const me = await authService.me(req.user.sub);
    res.status(200).json({ data: me });
  },

  async changePassword(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    await authService.changePassword(req.user.sub, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({ data: { success: true } });
  },

  async forgotPassword(req: Request, res: Response) {
    await authService.forgotPassword(req.body.email);
    // Respuesta uniforme (no revela si el correo existe)
    res.status(200).json({ data: { message: 'Si el correo existe, enviamos un enlace de restablecimiento.' } });
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json({ data: { success: true } });
  },
};
