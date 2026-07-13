import { z } from 'zod';

export const listMovementsQuery = z.object({
  owner: z.enum(['todos', 'ana', 'luis', 'pareja']).default('todos'),
});

export const createMovementSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().nonnegative(), // en la moneda de `currency`
  currency: z.enum(['USD', 'CRC']).default('USD'),
  description: z.string().min(1),
  occurredOn: z.string().optional(), // ISO; si falta, se usa hoy
  scope: z.enum(['shared', 'individual']),
  ownerKey: z.enum(['ana', 'luis', 'pareja']),
  categoryName: z.string().optional(),
  icon: z.string().optional(),
  account: z.string().max(40).optional(), // cuenta / medio de pago (BAC, Efectivo…)
});

export const updateMovementSchema = createMovementSchema.partial();

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type UpdateMovementInput = z.infer<typeof updateMovementSchema>;
