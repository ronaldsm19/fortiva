import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { MonthPoint } from '@/services/types';
import { useCurrency } from '@/context/CurrencyContext';
import { money } from '@/lib/format';

/** Barras agrupadas ingreso (verde) vs gasto (azul). Reemplaza los divs del prototipo. */
export function IncomeExpenseChart({ data, height = 240 }: { data: MonthPoint[]; height?: number }) {
  const { currency, format, rate } = useCurrency();
  const isCrc = currency === 'CRC';
  // En ₡ grafica y formatea con el total en colones del backend (TC histórico por
  // movimiento); si faltara, deriva con el TC actual. En USD, sin cambios.
  const rows = isCrc
    ? data.map((d) => ({ ...d, i: d.iCrc ?? Math.round(d.i * rate), g: d.gCrc ?? Math.round(d.g * rate) }))
    : data;
  const fmtVal = (v: number) => (isCrc ? money(v, 'CRC') : format(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} barGap={4} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="m"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--text-3)', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: 'var(--surface-2)' }}
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(value: number, name) => [fmtVal(value), name === 'i' ? 'Ingresos' : 'Gastos']}
        />
        <Bar dataKey="i" fill="var(--pos)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="g" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
