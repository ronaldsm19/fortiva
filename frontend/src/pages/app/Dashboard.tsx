import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { KpiCard } from '@/components/KpiCard';
import { ChartCard, LegendDot } from '@/components/ChartCard';
import { Card } from '@/components/Card';
import { TransactionRow } from '@/components/TransactionRow';
import { IncomeExpenseChart } from '@/components/IncomeExpenseChart';
import { MovementModal } from '@/modals/MovementModal';
import { useAuth } from '@/context/AuthContext';
import { useMonth } from '@/context/MonthContext';
import { service } from '@/services';
import type { Kpi, Movement, MonthPoint } from '@/services/types';

export function Dashboard() {
  const { user } = useAuth();
  const { monthIdx, year } = useMonth();
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [series, setSeries] = useState<MonthPoint[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [modal, setModal] = useState(false);

  const load = () => {
    service.getKpis(monthIdx, year).then(setKpis);
    service.getDashboardSeries(monthIdx, year).then(setSeries);
    service.listMovements('todos', monthIdx, year).then((m) => setMovements(m.slice(0, 5)));
  };
  useEffect(load, [monthIdx, year]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] text-text-2">
          Buen día, {user?.fullName.split(' ')[0]}. Así va el hogar este mes.
        </p>
        <Button onClick={() => setModal(true)}>
          <Plus size={18} />
          Agregar movimiento
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <ChartCard
          title="Ingresos vs gastos"
          action={<span className="text-[13px] font-semibold text-accent">6 meses</span>}
          legend={
            <>
              <LegendDot color="var(--pos)" label="Ingresos" />
              <LegendDot color="var(--accent)" label="Gastos" />
            </>
          }
        >
          <IncomeExpenseChart data={series} />
        </ChartCard>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[16px] font-extrabold tracking-tight">Últimos movimientos</h3>
            <Link to="/app/movimientos" className="text-[13px] font-semibold text-accent">
              Ver todos
            </Link>
          </div>
          <div>
            {movements.map((m) => (
              <TransactionRow key={m.id} m={m} />
            ))}
          </div>
        </Card>
      </div>

      <MovementModal open={modal} onClose={() => setModal(false)} onSaved={load} />
    </div>
  );
}
