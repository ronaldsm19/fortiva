import { z } from 'zod';

export const listDebtsQuery = z.object({
  owner: z.enum(['todas', 'ana', 'luis', 'compartidas']).default('todas'),
});

export const createDebtSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  total: z.number().nonnegative(), // en la moneda de `currency`
  monthly: z.number().nonnegative(), // en la moneda de `currency`
  currency: z.enum(['USD', 'CRC']).default('USD'),
  rate: z.string().optional(),
  due: z.string().optional(),
  owner: z.enum(['Ana', 'Luis', 'Pareja']),
  icon: z.string().optional(),
});

export const paymentSchema = z.object({
  amount: z.number().positive(), // en la moneda de `currency` (o la de la deuda)
  method: z.enum(['transfer', 'debit', 'cash', 'sinpe']).default('transfer'),
  currency: z.enum(['USD', 'CRC']).optional(), // moneda del pago; por defecto la de la deuda
});

export const updateDebtSchema = createDebtSchema.partial();

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
