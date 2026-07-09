/**
 * Backfill de amountCrc/currency/TC para movimientos PREVIOS (issue #6).
 *
 * Los movimientos creados ANTES del feature de TC no tienen `currency` ni `amountCrc`; hoy
 * `mapMovement` (movements.service.ts) deriva su valor en colones con `FX_FALLBACK` (~505),
 * que no refleja el TC real de su fecha. Este script recorre esos movimientos y congela su
 * valor en colones con el TC de su `occurredOn` (histórico del BCCR si la fecha es pasada,
 * del día si es hoy), con el MISMO criterio que usa el servicio al crear/editar:
 * **compra para ingresos, venta para gastos**.
 *
 * Es IDEMPOTENTE: solo toca los que aún tienen `amountCrc`/`currency` en null; tras correrlo
 * ninguno depende ya de `FX_FALLBACK` en `mapMovement`, y correrlo de nuevo no cambia nada.
 *
 * Uso:  npm run backfill:fx   (con DATABASE_URL apuntando a la BD; BCCR_WS_EMAIL/TOKEN
 *       opcionales para el TC histórico exacto). Ver DEPLOY.md.
 */
import { prisma } from '@/config/prisma';
import { getDailyFxRate, getFxRateForDate, type FxRates } from '@/lib/bccrFx';
import { centsToUsd } from '@/lib/present';

/** true si el día (en UTC) de `d` es anterior al día de hoy: es una fecha pasada. */
function isPastUtcDay(d: Date): boolean {
  return d.toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10);
}

/**
 * TC a congelar según la fecha del movimiento (mismo criterio que `movements.service.ts`):
 * el histórico de esa fecha si es pasada, el del día si es hoy. Ambos caminos nunca lanzan
 * y traen su propio fallback, así que el backfill nunca se bloquea por el BCCR.
 */
function fxForOccurredOn(occurredOn: Date): Promise<FxRates> {
  return isPastUtcDay(occurredOn) ? getFxRateForDate(occurredOn) : getDailyFxRate();
}

async function main() {
  // Movimientos previos: sin colones o sin moneda congelados. Los creados por el código
  // actual siempre traen ambos, así que no entran aquí (en Mongo `null` también matchea el
  // campo ausente en documentos viejos).
  const pending = await prisma.movement.findMany({
    where: { OR: [{ amountCrc: null }, { currency: null }] },
    select: { id: true, type: true, amountCents: true, occurredOn: true },
    orderBy: { occurredOn: 'asc' },
  });

  console.log(`[backfill-fx] ${pending.length} movimiento(s) pendiente(s) de backfill.`);
  if (pending.length === 0) {
    console.log('[backfill-fx] Nada que hacer (idempotente).');
    return;
  }

  let updated = 0;
  for (const m of pending) {
    // TC de la FECHA del movimiento; compra para ingresos, venta para gastos.
    const fx = await fxForOccurredOn(m.occurredOn);
    const rate = m.type === 'income' ? fx.buy : fx.sell;
    const amountCrc = Math.round(centsToUsd(m.amountCents) * rate);
    await prisma.movement.update({
      where: { id: m.id },
      data: {
        currency: 'USD', // los movimientos previos se ingresaron en USD
        amountCrc,
        fxBuy: fx.buy, // congelamos el TC usado, igual que al crear un movimiento
        fxSell: fx.sell,
        fxDate: fx.date,
      },
    });
    updated++;
  }

  console.log(`[backfill-fx] Listo. ${updated} de ${pending.length} movimiento(s) actualizados.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('[backfill-fx] Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
