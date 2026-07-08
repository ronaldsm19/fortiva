import { z } from 'zod';

export const listDebtsQuery = z.object({
  owner: z.enum(['todas', 'ana', 'luis', 'compartidas']).default('todas'),
});

export const createDebtSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  total: z.number().nonnegative(),
  monthly: z.number().nonnegative(),
  rate: z.string().optional(),
  due: z.string().optional(),
  owner: z.enum(['Ana', 'Luis', 'Pareja']),
  icon: z.string().optional(),
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['transfer', 'debit', 'cash', 'sinpe']).default('transfer'),
});

export const updateDebtSchema = createDebtSchema.partial();

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
