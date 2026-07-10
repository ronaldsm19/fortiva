import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import { Switch } from '@/components/Switch';
import { ReminderModal } from '@/modals/ReminderModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCurrency } from '@/context/CurrencyContext';
import { moneyIn, curOf } from '@/lib/format';
import { service } from '@/services';
import type { Reminder } from '@/services/types';

export function Recordatorios() {
  const { rate } = useCurrency();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [toDelete, setToDelete] = useState<Reminder | null>(null);

  const load = () => {
    service.listReminders().then(setReminders);
  };
  useEffect(load, []);

  const toggle = (r: Reminder) => service.toggleReminderEmail(r.id, !r.email).then(load);
  const togglePaid = (r: Reminder) =>
    service.updateReminder(r.id, { status: r.status === 'pagado' ? 'pendiente' : 'pagado' }).then(load);
  const openNew = () => {
    setEditing(null);
    setModal(true);
  };
  const openEdit = (r: Reminder) => {
    setEditing(r);
    setModal(true);
  };
  const confirmDelete = async () => {
    if (toDelete) await service.deleteReminder(toDelete.id);
    load();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus size={18} />
          Nuevo recordatorio
        </Button>
      </div>

      <Card pad="p-2">
        {reminders.map((r) => {
          const paid = r.status === 'pagado';
          return (
            <div key={r.id} className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-4 last:border-0">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-surface-2 text-text-2">
                <Icon name={r.icon} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-bold">{r.name}</div>
                <div className="text-[12.5px] text-text-3">{r.issuer} · vence {r.due}</div>
              </div>
              <div className="fnum text-[15px] font-extrabold">{moneyIn(r.amount, curOf(r), r.amountCrc, r.fxSell ?? rate)}</div>
              <Badge color={paid ? 'var(--pos)' : 'var(--neg)'} bg={paid ? 'var(--pos-weak)' : 'var(--neg-weak)'}>
                {paid ? 'Pagado' : 'Pendiente'}
              </Badge>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-text-3" />
                <Switch checked={r.email} onChange={() => toggle(r)} aria-label="Recordatorio por email" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePaid(r)}
                  className={`grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2 ${paid ? 'text-pos' : 'text-text-3 hover:text-pos'}`}
                  aria-label={paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                  title={paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                >
                  {paid ? <RotateCcw size={15} /> : <CheckCircle2 size={15} />}
                </button>
                <button onClick={() => openEdit(r)} className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-surface-2 hover:text-text" aria-label="Editar">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setToDelete(r)} className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-neg-weak hover:text-neg" aria-label="Eliminar">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
        {reminders.length === 0 && (
          <p className="px-4 py-8 text-center text-[13.5px] text-text-3">
            Sin recordatorios. Agrega el primero con "Nuevo recordatorio".
          </p>
        )}
      </Card>

      <ReminderModal open={modal} onClose={() => setModal(false)} onSaved={load} initial={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar recordatorio"
        message={`¿Eliminar "${toDelete?.name}"?`}
      />
    </div>
  );
}
