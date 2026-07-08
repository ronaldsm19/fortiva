import type { Request, Response } from 'express';
import { categoriesService } from './categories.service';

export const categoriesController = {
  async list(req: Request, res: Response) {
    res.json({ data: await categoriesService.list(req.accountId!) });
  },
  async create(req: Request, res: Response) {
    res.status(201).json({ data: await categoriesService.create(req.accountId!, req.body) });
  },
  async update(req: Request, res: Response) {
    res.json({ data: await categoriesService.update(req.accountId!, req.params.id, req.body) });
  },
  async remove(req: Request, res: Response) {
    await categoriesService.remove(req.accountId!, req.params.id);
    res.status(204).send();
  },
};
