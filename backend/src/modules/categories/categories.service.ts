import { Prisma, type Category } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { centsToUsd, usdToCents } from '@/lib/present';
import { AppError } from '@/lib/AppError';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.schemas';

/** Suma de gastos por categoría (para la barra "gastado de presupuesto"). */
async function spentByCategory(accountId: string): Promise<Map<string, number>> {
  const grouped = await prisma.movement.groupBy({
    by: ['categoryId'],
    where: { accountId, type: 'expense' },
    _sum: { amountCents: true },
  });
  const map = new Map<string, number>();
  for (const g of grouped) {
    if (g.categoryId) map.set(g.categoryId, g._sum.amountCents ?? 0);
  }
  return map;
}

const mapCategory = (c: Category, spentCents = 0) => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
  color: c.color,
  kind: c.kind,
  spent: centsToUsd(spentCents),
  budget: centsToUsd(c.budgetCents ?? 0),
});

export const categoriesService = {
  async list(accountId: string) {
    const [rows, spent] = await Promise.all([
      prisma.category.findMany({ where: { accountId }, orderBy: { createdAt: 'asc' } }),
      spentByCategory(accountId),
    ]);
    const mapped = rows.map((c) => mapCategory(c, spent.get(c.id) ?? 0));
    return {
      system: mapped.filter((c) => c.kind === 'system'),
      custom: mapped.filter((c) => c.kind === 'custom'),
    };
  },

  async create(accountId: string, input: CreateCategoryInput) {
    const c = await prisma.category.create({
      data: {
        accountId,
        name: input.name,
        icon: input.icon,
        color: input.color,
        kind: 'custom',
        budgetCents: input.budget != null ? usdToCents(input.budget) : null,
      },
    });
    return mapCategory(c);
  },

  async update(accountId: string, id: string, input: UpdateCategoryInput) {
    const c = await prisma.category.findFirst({ where: { id, accountId } });
    if (!c) throw AppError.notFound('Categoría no encontrada');

    const data: Prisma.CategoryUncheckedUpdateInput = {};
    if (input.budget !== undefined) data.budgetCents = usdToCents(input.budget);
    // Las categorías del sistema solo permiten cambiar el presupuesto.
    if (c.kind === 'custom') {
      if (input.name !== undefined) data.name = input.name;
      if (input.icon !== undefined) data.icon = input.icon;
      if (input.color !== undefined) data.color = input.color;
    }
    const updated = await prisma.category.update({ where: { id }, data });
    const spent = await spentByCategory(accountId);
    return mapCategory(updated, spent.get(id) ?? 0);
  },

  async remove(accountId: string, id: string) {
    const c = await prisma.category.findFirst({ where: { id, accountId } });
    if (!c) throw AppError.notFound('Categoría no encontrada');
    if (c.kind === 'system') {
      throw AppError.forbidden('Las categorías del sistema no se pueden eliminar');
    }
    await prisma.category.delete({ where: { id } });
  },
};
