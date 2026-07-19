import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { TransactionRow } from '@/components/TransactionRow';
import { CategoryGroup } from '@/components/CategoryGroup';
import { EmptyState } from '@/components/EmptyState';
import { MovementModal } from '@/modals/MovementModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCurrency } from '@/context/CurrencyContext';
import { money, crcOf } from '@/lib/format';
import { useHousehold } from '@/context/HouseholdContext';
import { useMonth } from '@/context/MonthContext';
import { service } from '@/services';
import { downloadFile } from '@/services/http';
import type { Category, Movement } from '@/services/types';

type Filter = 'todos' | 'ana' | 'luis' | 'pareja';
const tabs: { key: Filter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ana', label: 'Ana' },
  { key: 'luis', label: 'Luis' },
  { key: 'pareja', label: 'Pareja' },
];

const chip = (active: boolean) =>
  `rounded-chip px-3.5 py-2 text-[13.5px] transition-colors ${
    active ? 'bg-accent font-bold text-accent-ink' : 'border border-border bg-surface font-semibold text-text-2 hover:text-text'
  }`;

export function Movimientos() {
  const { rate } = useCurrency();
  const { ownerLabel } = useHousehold();
  const { monthIdx, year } = useMonth();
  const [filter, setFilter] = useState<Filter>('todos');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [toDelete, setToDelete] = useState<Movement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  const load = () => {
    service.listMovements(filter, monthIdx, year).then(setMovements);
  };
  useEffect(load, [filter, monthIdx, year]);
  // Categorías (para el color y el orden de las cards); no depende del mes para este uso.
  useEffect(() => {
    service.listCategories().then(({ system, custom }) => setCats([...system, ...custom]));
  }, []);

  const openEdit = (m: Movement) => { setEditing(m); setModal(true); };

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

  // Cuentas / medios de pago presentes (para filtrar por BAC, etc.).
  const accounts = useMemo(
    () => [...new Set(movements.map((m) => m.account).filter((a): a is string => !!a))].sort(),
    [movements],
  );
  const visible = useMemo(
    () => (accountFilter ? movements.filter((m) => m.account === accountFilter) : movements),
    [movements, accountFilter],
  );

  const income = useMemo(() => visible.filter((m) => m.type === 'income'), [visible]);
  const expenses = useMemo(() => visible.filter((m) => m.type === 'expense'), [visible]);

  const totals = useMemo(() => {
    const ins = income.reduce((a, m) => a + crcOf(m, rate), 0);
    const outs = expenses.reduce((a, m) => a + crcOf(m, rate), 0);
    return { ins, outs, balance: ins - outs };
  }, [income, expenses, rate]);

  // Agrupa los gastos por categoría (una card por categoría existente + huérfanas/sin categoría).
  const groups = useMemo(() => {
    const byCat = new Map<string, Movement[]>();
    for (const m of expenses) {
      const k = m.cat && m.cat !== '—' ? m.cat : 'Sin categoría';
      const arr = byCat.get(k);
      if (arr) arr.push(m); else byCat.set(k, [m]);
    }
    const known = new Set(cats.map((c) => c.name));
    const base = cats.map((c) => ({ key: c.id, name: c.name, color: c.color, icon: c.icon, movements: byCat.get(c.name) ?? [] }));
    for (const [name, ms] of byCat) {
      if (!known.has(name)) base.push({ key: name, name, color: 'var(--text-3)', icon: 'wallet', movements: ms });
    }
    return base
      .map((g) => ({ ...g, total: g.movements.reduce((a, m) => a + crcOf(m, rate), 0) }))
      .sort((a, b) => Number(b.movements.length > 0) - Number(a.movements.length > 0) || b.total - a.total);
  }, [expenses, cats, rate]);

  return (
    <div className="flex flex-col gap-5">
      {/* Filtros + acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setFilter(t.key)} className={chip(filter === t.key)}>
              {t.key === 'todos' ? 'Todos' : t.key === 'pareja' ? 'Pareja' : ownerLabel(t.key === 'ana' ? 'Ana' : 'Luis')}
            </button>
          ))}
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
          <button onClick={() => setAccountFilter(null)} className={chip(!accountFilter)}>Todas</button>
          {accounts.map((a) => (
            <button key={a} onClick={() => setAccountFilter(a)} className={chip(accountFilter === a)}>{a}</button>
          ))}
        </div>
      )}

      {/* Layout a un costado: resumen + ingresos a la izquierda, cards de categoría a la derecha */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[330px_1fr] lg:items-start">
        {/* Columna lateral */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4">
          <Card>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-text-3">Balance del mes</div>
            <div className="fnum mt-1 text-[27px] font-extrabold" style={{ color: totals.balance >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
              {money(totals.balance, 'CRC')}
            </div>
            <div className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3.5">
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-text-2">Ingresos</span>
                <span className="fnum font-bold text-pos">{money(totals.ins, 'CRC')}</span>
              </div>
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-text-2">Gastos</span>
                <span className="fnum font-bold text-text">{money(totals.outs, 'CRC')}</span>
              </div>
            </div>
          </Card>

          <Card pad="p-3">
            <div className="mb-1 flex items-center gap-2 px-1 py-1 text-[13.5px] font-bold">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-pos-weak text-pos"><Icon name="sparkles" size={13} /></span>
              Ingresos
            </div>
            {income.length === 0 ? (
              <p className="px-1 py-4 text-center text-[12.5px] text-text-3">Sin ingresos este mes</p>
            ) : (
              income.map((m) => (
                <TransactionRow key={m.id} m={m} onEdit={openEdit} onDelete={setToDelete} />
              ))
            )}
          </Card>
        </div>

        {/* Columna principal: cards por categoría */}
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <CategoryGroup
              key={g.key}
              name={g.name}
              color={g.color}
              icon={g.icon}
              total={g.total}
              movements={g.movements}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          ))}
          {expenses.length === 0 && (
            <EmptyState icon={ArrowLeftRight} title="Sin gastos este mes" text="Agrega tu primer gasto con “Agregar”." />
          )}
        </div>
      </div>

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
