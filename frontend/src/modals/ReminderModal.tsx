import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { DatePicker } from '@/components/DatePicker';
import { Button } from '@/components/Button';
import { Switch } from '@/components/Switch';
import { IconSelect } from '@/components/pickers';
import { service } from '@/services';
import type { Reminder } from '@/services/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Reminder | null;
}

export function ReminderModal({ open, onClose, onSaved, initial }: Props) {
  const editing = !!initial;
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [email, setEmail] = useState(true);
  const [icon, setIcon] = useState('bell');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setIssuer(initial?.issuer ?? '');
    setAmount(initial?.amount ? String(initial.amount) : '');
    setDueDate('');
    setEmail(initial?.email ?? true);
    setIcon(initial?.icon ?? 'bell');
    setError('');
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !dueDate) {
      setError('Indica la fecha de vencimiento');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const patch: Partial<Omit<Reminder, 'id'>> = {
          name, issuer, amount: Number(amount) || 0, email, icon,
        };
        if (dueDate) patch.due = dueDate;
        await service.updateReminder(initial!.id, patch);
      } else {
        await service.createReminder({
          name, issuer, amount: Number(amount) || 0, due: dueDate,
          status: 'pendiente', email, icon,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar recordatorio' : 'Nuevo recordatorio'}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Electricidad" required />
          <Input label="Entidad" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="ICE" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Monto (USD)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required />
          <DatePicker label={editing ? 'Nueva fecha (opcional)' : 'Vence'} align="right" value={dueDate} onChange={setDueDate} />
        </div>
        <IconSelect value={icon} onChange={setIcon} />
        <div className="flex items-center justify-between rounded-input border border-border px-4 py-3">
          <span className="flex items-center gap-2 text-[13.5px] font-semibold text-text-2">
            <Mail size={16} /> Recordatorio por correo
          </span>
          <Switch checked={email} onChange={setEmail} aria-label="Recordatorio por email" />
        </div>
        {error && <p className="text-[12.5px] font-semibold text-neg">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear recordatorio'}
        </Button>
      </form>
    </Modal>
  );
}
