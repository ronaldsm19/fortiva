/**
 * Rango [inicio, fin) de un mes en UTC. `month` es 0–11 (como el MonthContext del
 * frontend). Devuelve undefined si falta month o year (→ sin filtro de fecha).
 */
export function monthRange(month?: number, year?: number): { gte: Date; lt: Date } | undefined {
  if (month == null || Number.isNaN(month) || year == null || Number.isNaN(year)) return undefined;
  return {
    gte: new Date(Date.UTC(year, month, 1)),
    lt: new Date(Date.UTC(year, month + 1, 1)),
  };
}

/** Lee month/year de un query object (?month=&year=). */
export function rangeFromQuery(q: { month?: unknown; year?: unknown }) {
  const month = q.month != null ? Number(q.month) : undefined;
  const year = q.year != null ? Number(q.year) : undefined;
  return monthRange(month, year);
}
