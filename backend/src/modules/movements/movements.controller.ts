import type { Request, Response } from 'express';
import { movementsService } from './movements.service';
import { rangeFromQuery } from '@/lib/dates';

export const movementsController = {
  async list(req: Request, res: Response) {
    const owner = (req.query.owner as 'todos' | 'ana' | 'luis' | 'pareja') ?? 'todos';
    res.json({ data: await movementsService.list(req.accountId!, owner, rangeFromQuery(req.query)) });
  },
  async create(req: Request, res: Response) {
    res.status(201).json({ data: await movementsService.create(req.accountId!, req.body) });
  },
  async update(req: Request, res: Response) {
    res.json({ data: await movementsService.update(req.accountId!, req.params.id, req.body) });
  },
  async remove(req: Request, res: Response) {
    await movementsService.remove(req.accountId!, req.params.id);
    res.status(204).send();
  },
  async summary(req: Request, res: Response) {
    const series = req.query.series === '6m';
    const month = req.query.month != null ? Number(req.query.month) : undefined;
    const year = req.query.year != null ? Number(req.query.year) : undefined;
    if (series) {
      res.json({ data: await movementsService.series(req.accountId!, 6, month, year) });
    } else {
      res.json({ data: await movementsService.summary(req.accountId!, rangeFromQuery(req.query)) });
    }
  },
};
