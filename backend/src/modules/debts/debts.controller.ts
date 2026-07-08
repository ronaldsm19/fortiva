import type { Request, Response } from 'express';
import { debtsService } from './debts.service';

export const debtsController = {
  async list(req: Request, res: Response) {
    const owner = (req.query.owner as 'todas' | 'ana' | 'luis' | 'compartidas') ?? 'todas';
    res.json({ data: await debtsService.list(req.accountId!, owner) });
  },
  async create(req: Request, res: Response) {
    res.status(201).json({ data: await debtsService.create(req.accountId!, req.body) });
  },
  async pay(req: Request, res: Response) {
    res.status(201).json({ data: await debtsService.registerPayment(req.accountId!, req.params.id, req.body) });
  },
  async update(req: Request, res: Response) {
    res.json({ data: await debtsService.update(req.accountId!, req.params.id, req.body) });
  },
  async remove(req: Request, res: Response) {
    await debtsService.remove(req.accountId!, req.params.id);
    res.status(204).send();
  },
};
