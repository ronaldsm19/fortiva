import { describe, it, expect } from 'vitest';
import { escapeCsvField, rowsToCsv } from '@/lib/csv';

// Generación de CSV a mano: lo crítico es escapar bien (comillas/comas/saltos) para que
// ninguna descripción rompa las columnas al abrir en Excel.
describe('escapeCsvField', () => {
  it('deja intactos los valores simples', () => {
    expect(escapeCsvField('Hola')).toBe('Hola');
    expect(escapeCsvField('100.00')).toBe('100.00');
  });

  it('encierra en comillas cuando hay coma', () => {
    expect(escapeCsvField('Pago, mensual')).toBe('"Pago, mensual"');
  });

  it('duplica las comillas internas y encierra', () => {
    expect(escapeCsvField('Caja "chica"')).toBe('"Caja ""chica"""');
  });

  it('encierra cuando hay saltos de línea', () => {
    expect(escapeCsvField('línea1\nlínea2')).toBe('"línea1\nlínea2"');
    expect(escapeCsvField('a\r\nb')).toBe('"a\r\nb"');
  });
});

describe('rowsToCsv', () => {
  it('une celdas con coma y filas con CRLF', () => {
    const csv = rowsToCsv([
      ['Fecha', 'Descripción', 'Monto USD'],
      ['05 Jul', 'Café', 3.5],
    ]);
    expect(csv).toBe('Fecha,Descripción,Monto USD\r\n05 Jul,Café,3.5');
  });

  it('trata null/undefined como celda vacía', () => {
    expect(rowsToCsv([[null, undefined, '']])).toBe(',,');
  });

  it('escapa celdas con comas dentro (no rompe columnas)', () => {
    expect(rowsToCsv([['Salario, quincena', 1000]])).toBe('"Salario, quincena",1000');
  });
});
