import { Card } from './Card';
import { Icon } from './Icon';
import { useCurrency } from '@/context/CurrencyContext';
import type { Kpi } from '@/services/types';

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const { format } = useCurrency();
  return (
    <Card pad="p-[22px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-semibold text-text-2">{kpi.label}</span>
        <div
          className="grid h-9 w-9 place-items-center rounded-[10px]"
          style={{ background: kpi.bg, color: kpi.color }}
        >
          <Icon name={kpi.icon} size={18} />
        </div>
      </div>
      <div className="fnum text-[29px] font-extrabold tracking-tight">{format(kpi.value)}</div>
      <div className="mt-1 text-[12.5px] font-semibold" style={{ color: kpi.deltaColor }}>
        {kpi.delta}
      </div>
    </Card>
  );
}
