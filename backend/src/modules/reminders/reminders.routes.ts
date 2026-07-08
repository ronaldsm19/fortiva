import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { remindersService } from './reminders.service';
import { createReminderSchema, updateReminderSchema } from './reminders.schemas';
import { validate } from '@/middlewares/validate';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

export const remindersRoutes = Router();
remindersRoutes.use(requireAuth, resolveTenant);

remindersRoutes.get(
  '/reminders',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await remindersService.list(req.accountId!) });
  }),
);

remindersRoutes.post(
  '/reminders',
  validate(createReminderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ data: await remindersService.create(req.accountId!, req.body) });
  }),
);

remindersRoutes.patch(
  '/reminders/:id/email',
  validate(z.object({ enabled: z.boolean() })),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await remindersService.toggleEmail(req.accountId!, req.params.id, req.body.enabled) });
  }),
);

remindersRoutes.patch(
  '/reminders/:id',
  validate(updateReminderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await remindersService.update(req.accountId!, req.params.id, req.body) });
  }),
);

remindersRoutes.delete(
  '/reminders/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await remindersService.remove(req.accountId!, req.params.id);
    res.status(204).send();
  }),
);
