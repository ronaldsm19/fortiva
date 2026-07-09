import { describe, it, expect, vi } from 'vitest';

// El módulo importa `@prisma/client` (solo para tipos) y `@/config/prisma` (instancia
// PrismaClient). Mockeamos ambos para que el test sea unitario y puro: `computeAmounts` no
// toca la BD, y así el suite pasa incluso sin haber corrido `prisma generate`.
vi.mock('@prisma/client', () => ({ Prisma: {}, PrismaClient: class {} }));
vi.mock('@/config/prisma', () => ({ prisma: {} }));

import { computeAmounts } from '@/modules/movements/movements.service';

// Regla de negocio: para el TC se usa COMPRA en ingresos y VENTA en gastos.
// amountCents = USD en centavos; amountCrc = colones enteros.
describe('computeAmounts', () => {
  describe('monto ingresado en USD', () => {
    it('ingreso usa el TC de COMPRA para los colones', () => {
      const r = computeAmounts(100, 'USD', 'income', 500, 520);
      expect(r.amountCents).toBe(10_000); // 100 USD
      expect(r.amountCrc).toBe(50_000); // 100 * 500 (compra)
    });

    it('gasto usa el TC de VENTA para los colones', () => {
      const r = computeAmounts(100, 'USD', 'expense', 500, 520);
      expect(r.amountCents).toBe(10_000);
      expect(r.amountCrc).toBe(52_000); // 100 * 520 (venta)
    });
  });

  describe('monto ingresado en CRC', () => {
    it('ingreso deriva los USD con el TC de COMPRA', () => {
      const r = computeAmounts(50_000, 'CRC', 'income', 500, 520);
      expect(r.amountCrc).toBe(50_000);
      expect(r.amountCents).toBe(10_000); // 50000 / 500 = 100 USD
    });

    it('gasto deriva los USD con el TC de VENTA', () => {
      const r = computeAmounts(52_000, 'CRC', 'expense', 500, 520);
      expect(r.amountCrc).toBe(52_000);
      expect(r.amountCents).toBe(10_000); // 52000 / 520 = 100 USD
    });
  });

  it('redondea centavos y colones', () => {
    const r = computeAmounts(10.005, 'USD', 'income', 500, 500);
    expect(r.amountCents).toBe(1001); // round(10.005 * 100)
    expect(r.amountCrc).toBe(5003); // round(10.005 * 500)
  });

  it('si el TC es 0 no divide (USD = 0) pero conserva los colones', () => {
    const r = computeAmounts(50_000, 'CRC', 'income', 0, 0);
    expect(r.amountCrc).toBe(50_000);
    expect(r.amountCents).toBe(0);
  });
});
