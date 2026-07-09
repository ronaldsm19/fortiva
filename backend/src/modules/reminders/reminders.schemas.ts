import { z } from 'zod';

export const createReminderSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  amount: z.number().nonnegative(), // en la moneda de `currency`
  currency: z.enum(['USD', 'CRC']).default('USD'),
  dueDate: z.string().min(1), // ISO o YYYY-MM-DD
  emailEnabled: z.boolean().optional(),
  status: z.enum(['pending', 'paid']).optional(),
  icon: z.string().optional(),
});

export const updateReminderSchema = createReminderSchema.partial();

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
