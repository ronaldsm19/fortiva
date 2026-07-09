/**
 * Utilidades para generar CSV a mano (sin dependencias): escapa comillas, comas y saltos
 * de línea según RFC 4180. Separador coma; fin de línea CRLF (lo que espera Excel).
 * El BOM UTF-8 lo agrega quien envía la respuesta (ver reports.routes).
 */

/** Escapa un campo: lo encierra en comillas si contiene coma, comilla, CR o LF. */
export function escapeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Une una matriz de celdas en un CSV. `null`/`undefined` → celda vacía. */
export function rowsToCsv(
  rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>,
): string {
  return rows
    .map((row) => row.map((cell) => escapeCsvField(cell == null ? '' : String(cell))).join(','))
    .join('\r\n');
}
