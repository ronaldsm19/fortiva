import { z } from 'zod';

export const coupleSchema = z.object({
  coupleMode: z.boolean().optional(),
  splitMode: z.enum(['fifty', 'custom', 'salary']).optional(),
  splitP1Pct: z.number().int().min(0).max(100).optional(),
});

export const inviteMemberSchema = z.object({
  fullName: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email(),
});

export type CoupleInput = z.infer<typeof coupleSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
