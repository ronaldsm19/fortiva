import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Segmented } from '@/components/Segmented';
import { IconSelect, ColorSwatches } from '@/components/pickers';
import { service } from '@/services';
import type { Asset } from '@/services/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Asset | null;
}

export function AssetModal({ open, onClose, onSaved, initial }: Props) {
  const editing = !!initial;
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<'asset' | 'liability'>('asset');
  const [icon, setIcon] = useState('banknote');
  const [color, setColor] = useState('#2456C9');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setAmount(initial ? String(Math.abs(initial.amount)) : '');
    setKind(initial ? (initial.isAsset ? 'asset' : 'liability') : 'asset');
    setIcon(initial?.icon ?? 'banknote');
    setColor(initial?.color ?? '#2456C9');
    setError('');
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isAsset = kind === 'asset';
      const value = (Number(amount) || 0) * (isAsset ? 1 : -1);
      const payload = { name, amount: value, icon, color, isAsset };
      if (editing) await service.updateAsset(initial!.id, payload);
      else await service.createAsset(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar activo' : 'Agregar activo'}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Segmented
          options={[
            { value: 'asset', label: 'Activo' },
            { value: 'liability', label: 'Pasivo / deuda' },
          ]}
          value={kind}
          onChange={(v) => setKind(v as typeof kind)}
        />
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cuenta bancaria" required />
        <Input label="Monto (USD)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required />
        <div className="grid grid-cols-2 gap-3">
          <IconSelect value={icon} onChange={setIcon} />
          <ColorSwatches value={color} onChange={setColor} />
        </div>
        {error && <p className="text-[12.5px] font-semibold text-neg">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar activo'}
        </Button>
      </form>
    </Modal>
  );
}
