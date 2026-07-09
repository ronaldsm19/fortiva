import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1),
  amount: z.number(), // en la moneda de `currency`; puede ser negativo (pasivo)
  currency: z.enum(['USD', 'CRC']).default('USD'),
  icon: z.string().optional(),
  color: z.string().min(1),
  isAsset: z.boolean().optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
