import { Router, type Request, type Response } from 'express';
import { assetsService } from './assets.service';
import { createAssetSchema, updateAssetSchema } from './assets.schemas';
import { validate } from '@/middlewares/validate';
import { requireAuth } from '@/middlewares/auth.middleware';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { asyncHandler } from '@/lib/asyncHandler';

export const assetsRoutes = Router();
assetsRoutes.use(requireAuth, resolveTenant);

assetsRoutes.get(
  '/assets',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await assetsService.list(req.accountId!) });
  }),
);

assetsRoutes.post(
  '/assets',
  validate(createAssetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ data: await assetsService.create(req.accountId!, req.body) });
  }),
);

assetsRoutes.patch(
  '/assets/:id',
  validate(updateAssetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await assetsService.update(req.accountId!, req.params.id, req.body) });
  }),
);

assetsRoutes.delete(
  '/assets/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assetsService.remove(req.accountId!, req.params.id);
    res.status(204).send();
  }),
);
