import { describe, it, expect, vi } from 'vitest';

// bccrFx importa `@/config/prisma` (para el snapshot diario). Lo mockeamos: aquí solo
// probamos los PARSERS puros, sin BD ni red.
vi.mock('@/config/prisma', () => ({ prisma: {} }));

import {
  parseAri,
  parseCrNumber,
  parseWsNumber,
  parseLatestFromSeries,
} from '@/lib/bccrFx';

describe('parseCrNumber (formato de Costa Rica)', () => {
  it('coma decimal simple', () => {
    expect(parseCrNumber('451,60')).toBeCloseTo(451.6);
  });
  it('punto de miles + coma decimal', () => {
    expect(parseCrNumber('1.451,60')).toBeCloseTo(1451.6);
  });
});

describe('parseAri (HTML de la ventanilla del BCCR)', () => {
  // Fragmento fiel a la fila de ARI en la tabla del BCCR.
  const filaAri = `
    <tr>
      <td align="left">ARI Casa de Cambio Internacional S.A.</td>
      <td align="right">451,60</td>
      <td align="right">457,47</td>
      <td align="right">5,87</td>
      <td>07/07/2026&nbsp;&nbsp;04:39 p.m.</td>
    </tr>`;

  it('extrae compra, venta y fecha de la fila de ARI', () => {
    const r = parseAri(filaAri);
    expect(r).not.toBeNull();
    expect(r!.buy).toBeCloseTo(451.6); // primera columna = compra
    expect(r!.sell).toBeCloseTo(457.47); // segunda columna = venta
    expect(r!.date.getFullYear()).toBe(2026);
    expect(r!.date.getMonth()).toBe(6); // julio (0-indexado)
    expect(r!.date.getDate()).toBe(7);
  });

  it('soporta separador de miles en el TC', () => {
    const html = `
      <td align="left">ARI Casa de Cambio Internacional S.A.</td>
      <td align="right">1.451,60</td>
      <td align="right">1.457,47</td>`;
    const r = parseAri(html);
    expect(r!.buy).toBeCloseTo(1451.6);
    expect(r!.sell).toBeCloseTo(1457.47);
  });

  it('devuelve null si no está la fila de ARI', () => {
    expect(parseAri('<table><tr><td>Otro banco</td></tr></table>')).toBeNull();
  });

  it('devuelve null si no hay al menos dos valores (compra y venta)', () => {
    const html = `
      <td align="left">ARI Casa de Cambio Internacional S.A.</td>
      <td align="right">451,60</td>`;
    expect(parseAri(html)).toBeNull();
  });
});

describe('parseWsNumber (valor del web service histórico)', () => {
  it('punto decimal (formato del BCCR)', () => {
    expect(parseWsNumber('580.87')).toBeCloseTo(580.87);
  });
  it('coma decimal (tolerado)', () => {
    expect(parseWsNumber('580,87')).toBeCloseTo(580.87);
  });
  it('punto de miles + coma decimal', () => {
    expect(parseWsNumber('1.234,56')).toBeCloseTo(1234.56);
  });
  it('cadena vacía => NaN', () => {
    expect(Number.isNaN(parseWsNumber(''))).toBe(true);
  });
});

describe('parseLatestFromSeries (XML histórico del BCCR)', () => {
  // Serie con fechas DESORDENADAS y un día sin dato (fin de semana): debe devolver el
  // dato válido MÁS RECIENTE (2026-07-06), ignorando el NUM_VALOR vacío del 2026-07-04.
  const xml = `<?xml version="1.0" encoding="utf-8"?>
    <Datos_de_INGC011_CAT_INDICADORECONOMIC>
      <INGC011_CAT_INDICADORECONOMIC>
        <DES_FECHA>2026-07-03T00:00:00-06:00</DES_FECHA>
        <NUM_VALOR>579.50</NUM_VALOR>
      </INGC011_CAT_INDICADORECONOMIC>
      <INGC011_CAT_INDICADORECONOMIC>
        <DES_FECHA>2026-07-06T00:00:00-06:00</DES_FECHA>
        <NUM_VALOR>580.87</NUM_VALOR>
      </INGC011_CAT_INDICADORECONOMIC>
      <INGC011_CAT_INDICADORECONOMIC>
        <DES_FECHA>2026-07-04T00:00:00-06:00</DES_FECHA>
        <NUM_VALOR></NUM_VALOR>
      </INGC011_CAT_INDICADORECONOMIC>
    </Datos_de_INGC011_CAT_INDICADORECONOMIC>`;

  it('toma el dato válido más reciente e ignora los días sin valor', () => {
    const best = parseLatestFromSeries(xml);
    expect(best).not.toBeNull();
    expect(best!.value).toBeCloseTo(580.87);
    expect(best!.date.toISOString().startsWith('2026-07-06')).toBe(true);
  });

  it('funciona con el XML escapado dentro del sobre SOAP', () => {
    // El web service devuelve la serie con las entidades XML escapadas.
    const escapado =
      '&lt;INGC011_CAT_INDICADORECONOMIC&gt;' +
      '&lt;DES_FECHA&gt;2026-07-06T00:00:00-06:00&lt;/DES_FECHA&gt;' +
      '&lt;NUM_VALOR&gt;580.87&lt;/NUM_VALOR&gt;' +
      '&lt;/INGC011_CAT_INDICADORECONOMIC&gt;';
    const best = parseLatestFromSeries(escapado);
    expect(best!.value).toBeCloseTo(580.87);
  });

  it('devuelve null si no hay ningún dato', () => {
    expect(parseLatestFromSeries('<root></root>')).toBeNull();
  });
});
