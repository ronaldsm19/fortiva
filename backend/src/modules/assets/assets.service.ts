import { Prisma, type Asset } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { centsToUsd, usdToCents } from '@/lib/present';
import { AppError } from '@/lib/AppError';
import type { CreateAssetInput, UpdateAssetInput } from './assets.schemas';

function mapAsset(a: Asset) {
  return {
    id: a.id,
    name: a.name,
    amount: centsToUsd(a.amountCents),
    icon: a.icon,
    color: a.color,
    isAsset: a.isAsset,
  };
}

function toData(input: Partial<CreateAssetInput>): Prisma.AssetUncheckedUpdateInput {
  const d: Prisma.AssetUncheckedUpdateInput = {};
  if (input.name !== undefined) d.name = input.name;
  if (input.amount !== undefined) d.amountCents = usdToCents(input.amount);
  if (input.icon !== undefined) d.icon = input.icon;
  if (input.color !== undefined) d.color = input.color;
  if (input.isAsset !== undefined) d.isAsset = input.isAsset;
  return d;
}

async function assertOwned(accountId: string, id: string) {
  const found = await prisma.asset.findFirst({ where: { id, accountId } });
  if (!found) throw AppError.notFound('Activo no encontrado');
  return found;
}

export const assetsService = {
  async list(accountId: string) {
    const rows = await prisma.asset.findMany({ where: { accountId }, orderBy: { createdAt: 'asc' } });
    return rows.map(mapAsset);
  },

  async create(accountId: string, input: CreateAssetInput) {
    const a = await prisma.asset.create({
      data: {
        accountId,
        name: input.name,
        amountCents: usdToCents(input.amount),
        icon: input.icon ?? 'banknote',
        color: input.color,
        isAsset: input.isAsset ?? input.amount >= 0,
      },
    });
    return mapAsset(a);
  },

  async update(accountId: string, id: string, input: UpdateAssetInput) {
    await assertOwned(accountId, id);
    const a = await prisma.asset.update({ where: { id }, data: toData(input) });
    return mapAsset(a);
  },

  async remove(accountId: string, id: string) {
    await assertOwned(accountId, id);
    await prisma.asset.delete({ where: { id } });
  },
};
