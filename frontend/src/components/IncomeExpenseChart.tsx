import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { MonthPoint } from '@/services/types';
import { useCurrency } from '@/context/CurrencyContext';

/** Barras agrupadas ingreso (verde) vs gasto (azul). Reemplaza los divs del prototipo. */
export function IncomeExpenseChart({ data, height = 240 }: { data: MonthPoint[]; height?: number }) {
  const { format } = useCurrency();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={4} barCategoryGap="20%">
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
          formatter={(value: number, name) => [format(value), name === 'i' ? 'Ingresos' : 'Gastos']}
        />
        <Bar dataKey="i" fill="var(--pos)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="g" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
