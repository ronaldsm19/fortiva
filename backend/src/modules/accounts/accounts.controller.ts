import type { Request, Response } from 'express';
import { accountsService } from './accounts.service';

export const accountsController = {
  async get(req: Request, res: Response) {
    res.json({ data: await accountsService.get(req.accountId!) });
  },
  async members(req: Request, res: Response) {
    res.json({ data: await accountsService.members(req.accountId!) });
  },
  async getCouple(req: Request, res: Response) {
    res.json({ data: await accountsService.getCouple(req.accountId!) });
  },
  async updateCouple(req: Request, res: Response) {
    res.json({ data: await accountsService.updateCouple(req.accountId!, req.body) });
  },
  async invite(req: Request, res: Response) {
    const result = await accountsService.invitePartner(
      req.accountId!,
      req.user!.sub,
      req.user!.role,
      req.body,
    );
    res.status(201).json({ data: result });
  },
};
