import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { DebtModal } from '@/modals/DebtModal';
import { PaymentModal } from '@/modals/PaymentModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCurrency } from '@/context/CurrencyContext';
import { useHousehold } from '@/context/HouseholdContext';
import { pct } from '@/lib/format';
import { service } from '@/services';
import type { Debt } from '@/services/types';

type Filter = 'todas' | 'ana' | 'luis' | 'compartidas';
const filters: { key: Filter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'ana', label: 'Ana' },
  { key: 'luis', label: 'Luis' },
  { key: 'compartidas', label: 'Compartidas' },
];

export function Deudas() {
  const { format } = useCurrency();
  const { ownerLabel } = useHousehold();
  const labelFor = (key: Filter) =>
    key === 'ana' ? ownerLabel('Ana') : key === 'luis' ? ownerLabel('Luis') : key === 'todas' ? 'Todas' : 'Compartidas';
  const [filter, setFilter] = useState<Filter>('todas');
  const [all, setAll] = useState<Debt[]>([]);
  const [visible, setVisible] = useState<Debt[]>([]);
  const [newDebt, setNewDebt] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [toDelete, setToDelete] = useState<Debt | null>(null);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);

  const loadAll = () => {
    service.listDebts('todas').then(setAll);
  };
  useEffect(loadAll, []);
  useEffect(() => {
    service.listDebts(filter).then(setVisible);
  }, [filter, all]);

  // Resumen (sobre TODAS las deudas, no el filtro)
  const summary = useMemo(() => {
    const pending = all.reduce((a, d) => a + (d.total - d.paid), 0);
    const monthAna = all.filter((d) => d.owner === 'Ana').reduce((a, d) => a + d.monthly, 0);
    const monthLuis = all.filter((d) => d.owner === 'Luis').reduce((a, d) => a + d.monthly, 0);
    const monthPareja = all.filter((d) => d.owner === 'Pareja').reduce((a, d) => a + d.monthly, 0);
    return {
      pending,
      ana: monthAna + Math.round(monthPareja / 2),
      luis: monthLuis + Math.round(monthPareja / 2),
    };
  }, [all]);

  const ownerBadge = (d: Debt) =>
    d.owner === 'Pareja' ? (
      <Badge color="var(--gold)" bg="color-mix(in srgb,var(--gold) 15%,transparent)">
        Compartida
      </Badge>
    ) : (
      <Badge color="var(--text-2)" bg="var(--surface-2)">
        Personal · {ownerLabel(d.owner)}
      </Badge>
    );

  return (
    <div className="flex flex-col gap-5">
      {/* Resumen */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
        <Card className="!border-neg/30" style={{ background: 'var(--neg-weak)' }}>
          <div className="text-[13.5px] font-semibold text-text-2">Deuda pendiente total</div>
          <div className="fnum mt-1 text-[29px] font-extrabold text-neg">{format(summary.pending)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <OwnerAvatar owner="Ana" size={28} />
            <span className="text-[13.5px] font-semibold text-text-2">Paga {ownerLabel('Ana')} / mes</span>
          </div>
          <div className="fnum mt-2 text-[24px] font-extrabold">{format(summary.ana)}</div>
          <div className="text-[12px] text-text-3">incl. mitad compartida</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <OwnerAvatar owner="Luis" size={28} />
            <span className="text-[13.5px] font-semibold text-text-2">Paga {ownerLabel('Luis')} / mes</span>
          </div>
          <div className="fnum mt-2 text-[24px] font-extrabold">{format(summary.luis)}</div>
          <div className="text-[12px] text-text-3">incl. mitad compartida</div>
        </Card>
      </div>

      {/* Filtros + nueva */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-chip px-3.5 py-2 text-[13.5px] transition-colors ${
                  active
                    ? 'bg-accent font-bold text-accent-ink'
                    : 'border border-border bg-surface font-semibold text-text-2 hover:text-text'
                }`}
              >
                {labelFor(f.key)}
              </button>
            );
          })}
        </div>
        <Button onClick={() => { setEditDebt(null); setNewDebt(true); }}>
          <Plus size={18} />
          Nueva deuda
        </Button>
      </div>

      {/* Cards de deuda */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visible.map((d) => {
          const remaining = d.total - d.paid;
          const percent = pct(d.paid, d.total);
          return (
            <Card key={d.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-surface-2 text-text-2">
                    <Icon name={d.icon} size={20} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold">{d.name}</div>
                    <div className="text-[12.5px] text-text-3">
                      {d.issuer} · {d.rate} · vence {d.due}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {ownerBadge(d)}
                  <button onClick={() => { setEditDebt(d); setNewDebt(true); }} className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-surface-2 hover:text-text" aria-label="Editar">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setToDelete(d)} className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-neg-weak hover:text-neg" aria-label="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-text-3">Cuota mensual</div>
                  <div className="fnum text-[16px] font-extrabold">{format(d.monthly)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] text-text-3">Restante</div>
                  <div className="fnum text-[16px] font-extrabold text-neg">{format(remaining)}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setPayDebt(d)}>
                  Registrar pago
                </Button>
              </div>

              <div className="mb-1.5 flex items-center justify-between text-[12px] text-text-3">
                <span className="fnum">
                  {format(d.paid)} de {format(d.total)}
                </span>
                <span className="fnum font-bold text-pos">{percent}%</span>
              </div>
              <ProgressBar value={percent} gradient />
            </Card>
          );
        })}
      </div>

      <DebtModal open={newDebt} onClose={() => setNewDebt(false)} onSaved={loadAll} initial={editDebt} />
      <PaymentModal open={!!payDebt} onClose={() => setPayDebt(null)} debt={payDebt} onPaid={loadAll} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) await service.deleteDebt(toDelete.id); loadAll(); }}
        title="Eliminar deuda"
        message={`¿Eliminar "${toDelete?.name}"? Se borrará también su historial de pagos.`}
      />
    </div>
  );
}
