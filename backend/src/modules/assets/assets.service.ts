import { Prisma, type Asset } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { centsToUsd } from '@/lib/present';
import { amountsFromCurrency, crcOrFallback } from '@/lib/fxAmounts';
import { getDailyFxRate } from '@/lib/bccrFx';
import { AppError } from '@/lib/AppError';
import type { CreateAssetInput, UpdateAssetInput } from './assets.schemas';

function mapAsset(a: Asset) {
  return {
    id: a.id,
    name: a.name,
    amount: centsToUsd(a.amountCents), // USD (canónico); negativo = pasivo
    // colones: si es un activo previo sin valor, se deriva con el TC de respaldo.
    amountCrc: crcOrFallback(a.amountCrc, a.amountCents),
    currency: a.currency ?? 'USD', // moneda en que se ingresó (previos: USD)
    fxBuy: a.fxBuy ?? null,
    fxSell: a.fxSell ?? null,
    fxDate: a.fxDate ? a.fxDate.toISOString() : null,
    icon: a.icon,
    color: a.color,
    isAsset: a.isAsset,
  };
}

/** Campos NO monetarios (create/update) → data de Prisma. El monto se maneja aparte (TC). */
function toData(input: Partial<CreateAssetInput>): Prisma.AssetUncheckedUpdateInput {
  const d: Prisma.AssetUncheckedUpdateInput = {};
  if (input.name !== undefined) d.name = input.name;
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
    // Congela el TC del día. Activo no es ingreso/gasto → se usa el TC de venta.
    const fx = await getDailyFxRate();
    const currency = input.currency ?? 'USD';
    const { cents, crc } = amountsFromCurrency(input.amount, currency, fx.sell);
    const a = await prisma.asset.create({
      data: {
        accountId,
        name: input.name,
        amountCents: cents,
        amountCrc: crc,
        currency,
        fxBuy: fx.buy,
        fxSell: fx.sell,
        fxDate: fx.date,
        icon: input.icon ?? 'banknote',
        color: input.color,
        isAsset: input.isAsset ?? input.amount >= 0,
      },
    });
    return mapAsset(a);
  },

  async update(accountId: string, id: string, input: UpdateAssetInput) {
    const found = await assertOwned(accountId, id);
    const data = toData(input);
    if (input.currency !== undefined) data.currency = input.currency;

    // Recalcula el monto si cambió monto/moneda. Reusa el TC congelado; si es un
    // activo viejo sin TC, toma el del día y lo congela.
    if (input.amount !== undefined || input.currency !== undefined) {
      const currency = (input.currency ?? found.currency ?? 'USD') as 'USD' | 'CRC';
      let sell = found.fxSell;
      if (sell == null) {
        const fx = await getDailyFxRate();
        sell = fx.sell;
        data.fxBuy = fx.buy;
        data.fxSell = fx.sell;
        data.fxDate = fx.date;
      }
      const amountInCur =
        input.amount ?? (currency === 'CRC' ? (found.amountCrc ?? 0) : centsToUsd(found.amountCents));
      const { cents, crc } = amountsFromCurrency(amountInCur, currency, sell);
      data.amountCents = cents;
      data.amountCrc = crc;
    }
    const a = await prisma.asset.update({ where: { id }, data });
    return mapAsset(a);
  },

  async remove(accountId: string, id: string) {
    await assertOwned(accountId, id);
    await prisma.asset.delete({ where: { id } });
  },
};
