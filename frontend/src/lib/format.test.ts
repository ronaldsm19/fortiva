import { describe, it, expect } from 'vitest';
import { money, crcOf, fmt } from '@/lib/format';

// Los separadores de miles dependen del locale (es-CR) y del ICU de Node, así que para
// CRC comprobamos el símbolo y los dígitos (sin el separador) en vez de la cadena exacta.
const soloDigitos = (s: string) => s.replace(/[^\d]/g, '');

describe('money (monto en su propia moneda)', () => {
  it('USD: prefijo $ y separador de miles', () => {
    expect(money(1000, 'USD')).toBe('$1,000');
  });

  it('usa el valor absoluto', () => {
    expect(money(-500, 'USD')).toBe('$500');
  });

  it('CRC: antepone ₡ y redondea', () => {
    const s = money(1234.6, 'CRC');
    expect(s.startsWith('₡')).toBe(true);
    expect(soloDigitos(s)).toBe('1235'); // 1234.6 -> 1235
  });
});

describe('fmt (base en USD -> moneda seleccionada)', () => {
  it('USD: muestra el monto tal cual', () => {
    expect(fmt(100, 'USD')).toBe('$100');
  });

  it('CRC: convierte con la tasa dada', () => {
    const s = fmt(2, 'CRC', 500); // 2 * 500 = 1000
    expect(s.startsWith('₡')).toBe(true);
    expect(soloDigitos(s)).toBe('1000');
  });

  it('usa el valor absoluto', () => {
    expect(fmt(-100, 'USD')).toBe('$100');
  });
});

describe('crcOf (colones de un movimiento)', () => {
  it('usa amountCrc si está presente', () => {
    expect(crcOf({ amount: 100, amountCrc: 52_000 }, 500)).toBe(52_000);
  });

  it('si falta, lo deriva con la tasa', () => {
    expect(crcOf({ amount: 100 }, 500)).toBe(50_000);
  });
});
