import type { Prisma } from '@prisma/client';

/**
 * Categorías del sistema que toda cuenta recibe al crearse.
 * Montos de presupuesto en centavos USD. Reutilizado en registro y en el seed.
 */
export const baseCategories: Prisma.CategoryCreateWithoutAccountInput[] = [
  { name: 'Gastos fijos', icon: 'home', color: '#2456C9', kind: 'system', budgetCents: 160000 },
  { name: 'Inversión', icon: 'trending-up', color: '#2E8B6B', kind: 'system', budgetCents: 60000 },
  { name: 'Fondo de seguridad', icon: 'shield', color: '#A9822F', kind: 'system', budgetCents: 30000 },
  { name: 'Gastos afuera', icon: 'utensils', color: '#C0503B', kind: 'system', budgetCents: 40000 },
];
