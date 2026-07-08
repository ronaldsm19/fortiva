import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  budget: z.number().nonnegative().optional(), // USD
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
