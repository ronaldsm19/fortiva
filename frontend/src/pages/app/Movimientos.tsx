import { useEffect, useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TransactionRow } from '@/components/TransactionRow';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { EmptyState } from '@/components/EmptyState';
import { ArrowLeftRight } from 'lucide-react';
import { MovementModal } from '@/modals/MovementModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCurrency } from '@/context/CurrencyContext';
import { money, crcOf } from '@/lib/format';
import { useHousehold } from '@/context/HouseholdContext';
import { useMonth } from '@/context/MonthContext';
import { service } from '@/services';
import { downloadFile } from '@/services/http';
import type { Movement, OwnerKey } from '@/services/types';

type Filter = 'todos' | 'ana' | 'luis' | 'pareja';
const tabs: { key: Filter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ana', label: 'Ana' },
  { key: 'luis', label: 'Luis' },
  { key: 'pareja', label: 'Pareja' },
];
const filterOwner: Record<Exclude<Filter, 'todos'>, OwnerKey> = {
  ana: 'Ana',
  luis: 'Luis',
  pareja: 'Pareja',
};

export function Movimientos() {
  const { rate } = useCurrency();
  const { ownerLabel } = useHousehold();
  const labelFor = (key: Filter) =>
    key === 'ana' ? ownerLabel('Ana') : key === 'luis' ? ownerLabel('Luis') : key === 'pareja' ? 'Pareja' : 'Todos';
  const { monthIdx, year } = useMonth();
  const [filter, setFilter] = useState<Filter>('todos');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [toDelete, setToDelete] = useState<Movement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  const load = () => {
    service.listMovements(filter, monthIdx, year).then(setMovements);
  };
  useEffect(load, [filter, monthIdx, year]);

  // Cuentas / medios de pago presentes en los movimientos cargados (para filtrar por BAC, etc.).
  const accounts = useMemo(
    () => [...new Set(movements.map((m) => m.account).filter((a): a is string => !!a))].sort(),
    [movements],
  );
  // Movimientos visibles según el filtro de cuenta (el de persona/mes ya viene aplicado del backend).
  const visible = useMemo(
    () => (accountFilter ? movements.filter((m) => m.account === accountFilter) : movements),
    [movements, accountFilter],
  );

  // Exporta el CSV de los movimientos del mes/año/filtro actuales (endpoint protegido → con token).
  const handleExport = async () => {
    setExporting(true);
    try {
      const mes = String(monthIdx + 1).padStart(2, '0');
      await downloadFile(
        `/reports/export?format=csv&year=${year}&month=${monthIdx}&owner=${filter}`,
        `fortiva-movimientos-${year}-${mes}.csv`,
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudieron exportar los movimientos.');
    } finally {
      setExporting(false);
    }
  };

  // Totales en colones (suma real usando el TC congelado de cada movimiento; respeta el filtro de cuenta).
  const totals = useMemo(() => {
    const ins = visible.filter((m) => m.type === 'income').reduce((a, m) => a + crcOf(m, rate), 0);
    const outs = visible.filter((m) => m.type === 'expense').reduce((a, m) => a + crcOf(m, rate), 0);
    return { ins, outs, balance: ins - outs };
  }, [visible, rate]);
  const person = filter === 'todos' ? null : filterOwner[filter];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`rounded-chip px-3.5 py-2 text-[13.5px] transition-colors ${
                  active
                    ? 'bg-accent font-bold text-accent-ink'
                    : 'border border-border bg-surface font-semibold text-text-2 hover:text-text'
                }`}
              >
                {labelFor(t.key)}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            <Download size={18} />
            {exporting ? 'Exportando…' : 'Exportar'}
          </Button>
          <Button onClick={() => { setEditing(null); setModal(true); }}>
            <Plus size={18} />
            Agregar
          </Button>
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-text-3">Cuenta</span>
          <button
            onClick={() => setAccountFilter(null)}
            className={`rounded-chip px-3 py-1.5 text-[13px] transition-colors ${!accountFilter ? 'bg-accent font-bold text-accent-ink' : 'border border-border bg-surface font-semibold text-text-2 hover:text-text'}`}
          >
            Todas
          </button>
          {accounts.map((a) => (
            <button
              key={a}
              onClick={() => setAccountFilter(a)}
              className={`rounded-chip px-3 py-1.5 text-[13px] transition-colors ${accountFilter === a ? 'bg-accent font-bold text-accent-ink' : 'border border-border bg-surface font-semibold text-text-2 hover:text-text'}`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {person && (
        <Card>
          <div className="flex items-center gap-4">
            <OwnerAvatar owner={person} size={44} />
            <div>
              <div className="text-[14px] font-bold">Resumen de {ownerLabel(person)}</div>
              <div className="mt-0.5 flex gap-4 text-[13px]">
                <span className="fnum font-semibold text-pos">Ingresos {money(totals.ins, 'CRC')}</span>
                <span className="fnum font-semibold text-text-2">Gastos {money(totals.outs, 'CRC')}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {/* header de tabla (oculto en móvil) */}
        <div className="hidden border-b border-border pb-2 text-[12px] font-bold uppercase tracking-wide text-text-3 sm:flex">
          <span className="flex-1">Descripción</span>
          <span className="w-28">De quién</span>
          <span className="w-24 text-right">Monto</span>
        </div>
        {visible.map((m) => (
          <TransactionRow
            key={m.id}
            m={m}
            showOwner
            onEdit={(mv) => { setEditing(mv); setModal(true); }}
            onDelete={setToDelete}
          />
        ))}
        {visible.length === 0 && (
          <EmptyState icon={ArrowLeftRight} title="Sin movimientos este mes" text="Agrega tu primer ingreso o gasto." />
        )}
        {visible.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-x-5 gap-y-1 border-t border-border pt-3 text-[13px]">
            <span className="mr-auto text-[12px] font-semibold uppercase tracking-wide text-text-3">
              Total en colones
            </span>
            <span className="fnum text-text-2">
              Ingresos <b className="text-pos">{money(totals.ins, 'CRC')}</b>
            </span>
            <span className="fnum text-text-2">
              Gastos <b className="text-text">{money(totals.outs, 'CRC')}</b>
            </span>
            <span className="fnum text-text-2">
              Balance{' '}
              <b style={{ color: totals.balance >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                {money(totals.balance, 'CRC')}
              </b>
            </span>
          </div>
        )}
      </Card>

      <MovementModal open={modal} onClose={() => setModal(false)} onSaved={load} initial={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) await service.deleteMovement(toDelete.id); load(); }}
        title="Eliminar movimiento"
        message={`¿Eliminar "${toDelete?.desc}"?`}
      />
    </div>
  );
}
