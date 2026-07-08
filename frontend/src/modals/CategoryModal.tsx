import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { IconSelect, ColorSwatches } from '@/components/pickers';
import { service } from '@/services';
import type { Category } from '@/services/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Category | null;
}

export function CategoryModal({ open, onClose, onSaved, initial }: Props) {
  const editing = !!initial;
  const systemLocked = initial?.kind === 'system';
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('home');
  const [color, setColor] = useState('#2456C9');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setIcon(initial?.icon ?? 'home');
    setColor(initial?.color ?? '#2456C9');
    setBudget(initial?.budget ? String(initial.budget) : '');
    setError('');
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name, icon, color, spent: initial?.spent ?? 0, budget: Number(budget) || 0 };
      if (editing) await service.updateCategory(initial!.id, payload);
      else await service.createCategory(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar categoría' : 'Nueva categoría'}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Educación" required disabled={systemLocked} />
        {systemLocked && (
          <p className="-mt-2 text-[12px] text-text-3">Es una categoría del sistema: solo puedes ajustar el presupuesto.</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <IconSelect value={icon} onChange={setIcon} disabled={systemLocked} />
          <Input label="Presupuesto (USD)" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" />
        </div>
        <ColorSwatches value={color} onChange={setColor} disabled={systemLocked} />
        {error && <p className="text-[12.5px] font-semibold text-neg">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </form>
    </Modal>
  );
}
