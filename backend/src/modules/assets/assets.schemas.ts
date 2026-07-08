import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1),
  amount: z.number(), // puede ser negativo (pasivo)
  icon: z.string().optional(),
  color: z.string().min(1),
  isAsset: z.boolean().optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
