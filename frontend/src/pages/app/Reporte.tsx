import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { ChartCard, LegendDot } from '@/components/ChartCard';
import { IncomeExpenseChart } from '@/components/IncomeExpenseChart';
import { ProgressBar } from '@/components/ProgressBar';
import { useCurrency } from '@/context/CurrencyContext';
import { useMonth } from '@/context/MonthContext';
import { service } from '@/services';
import type { MonthPoint, TopCategory } from '@/services/types';

export function Reporte() {
  const { format } = useCurrency();
  const { year } = useMonth();
  const [series, setSeries] = useState<MonthPoint[]>([]);
  const [cats, setCats] = useState<TopCategory[]>([]);

  useEffect(() => {
    service.getAnnualSeries(year).then(setSeries);
    service.getTopCategories(year).then(setCats);
  }, [year]);

  const kpis = useMemo(() => {
    const totIn = series.reduce((a, d) => a + d.i, 0);
    const totOut = series.reduce((a, d) => a + d.g, 0);
    const rate = totIn ? Math.round(((totIn - totOut) / totIn) * 100) : 0;
    return [
      { label: `Ingresos ${year}`, value: format(totIn), color: 'var(--pos)' },
      { label: `Gastos ${year}`, value: format(totOut), color: 'var(--neg)' },
      { label: 'Ahorro acumulado', value: format(totIn - totOut), color: 'var(--accent)' },
      { label: 'Tasa de ahorro', value: `${rate}%`, color: 'var(--gold)' },
    ];
  }, [series, format, year]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <div className="text-[13.5px] font-semibold text-text-2">{k.label}</div>
            <div className="fnum mt-1 text-[26px] font-extrabold tracking-tight" style={{ color: k.color }}>
              {k.value}
            </div>
          </Card>
        ))}
      </div>

      <ChartCard
        title={`Ingresos vs gastos · ${year}`}
        legend={
          <>
            <LegendDot color="var(--pos)" label="Ingresos" />
            <LegendDot color="var(--accent)" label="Gastos" />
          </>
        }
      >
        <IncomeExpenseChart data={series} height={280} />
      </ChartCard>

      <Card>
        <h3 className="mb-4 text-[16px] font-extrabold tracking-tight">Categorías más usadas</h3>
        <div className="flex flex-col gap-4">
          {cats.map((c) => (
            <div key={c.name}>
              <div className="mb-1.5 flex items-center justify-between text-[13.5px]">
                <span className="font-semibold">{c.name}</span>
                <span className="fnum text-text-2">
                  {format(c.amount)} · <b className="text-text">{c.pct}%</b>
                </span>
              </div>
              <ProgressBar value={c.pct} color={c.color} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
