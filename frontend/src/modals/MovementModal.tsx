import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { DatePicker } from '@/components/DatePicker';
import { Select } from '@/components/Select';
import { Button } from '@/components/Button';
import { Segmented } from '@/components/Segmented';
import { service } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useHousehold } from '@/context/HouseholdContext';
import type { Category, FxRate, Movement, OwnerKey } from '@/services/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initial?: Movement | null;
}

export function MovementModal({ open, onClose, onSaved, initial }: Props) {
  const { user } = useAuth();
  const { ownerLabel, hasPartner } = useHousehold();
  const currentOwner: OwnerKey = user?.personKey === 'luis' ? 'Luis' : 'Ana';
  const editing = !!initial;

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [scope, setScope] = useState<'Compartido' | 'Individual'>('Compartido');
  const [personOwner, setPersonOwner] = useState<OwnerKey>(currentOwner);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [curr, setCurr] = useState<'USD' | 'CRC'>('CRC');
  const [date, setDate] = useState('');
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [account, setAccount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fx, setFx] = useState<FxRate | null>(null);

  useEffect(() => {
    if (!open) return;
    service.listCategories().then(({ system, custom }) => {
      const all = [...system, ...custom];
      setCats(all);
      setCat(initial?.cat ?? all[0]?.name ?? '');
    });
    setType(initial?.type ?? 'expense');
    setScope(initial?.scope ?? 'Compartido');
    setPersonOwner(initial && initial.owner !== 'Pareja' ? initial.owner : currentOwner);
    setDesc(initial?.desc ?? '');
    const initCur = initial?.currency ?? 'USD';
    setCurr(initial ? initCur : 'CRC');
    setAmount(initial ? String(initCur === 'CRC' ? (initial.amountCrc ?? 0) : initial.amount) : '');
    setDate(initial?.dateIso ?? ''); // al editar, prefilla la fecha del movimiento
    setAccount(initial?.account ?? '');
    setError('');
    service.getFxRate().then(setFx).catch(() => setFx(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const owner: OwnerKey = scope === 'Compartido' ? 'Pareja' : personOwner;
      const payload: Omit<Movement, 'id'> = {
        date,
        cat: type === 'income' ? '' : cat,
        type,
        amount: Number(amount) || 0,
        currency: curr,
        desc: desc || 'Movimiento',
        scope,
        owner,
        icon: initial?.icon ?? (type === 'income' ? 'sparkles' : 'shopping-cart'),
        account: account.trim() || null,
      };
      if (editing) await service.updateMovement(initial!.id, payload);
      else await service.createMovement(payload);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar movimiento' : 'Agregar movimiento'}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Segmented
          options={[
            { value: 'income', label: 'Ingreso' },
            { value: 'expense', label: 'Gasto' },
          ]}
          value={type}
          onChange={(v) => setType(v as typeof type)}
        />
        <Input label="Descripción" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej. Alquiler" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-2">Monto</span>
              <div className="flex rounded-md bg-surface-2 p-0.5">
                {(['CRC', 'USD'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurr(c)}
                    className={`rounded px-2 py-0.5 text-[12px] font-bold transition-colors ${
                      curr === c ? 'bg-accent text-accent-ink' : 'text-text-3 hover:text-text'
                    }`}
                  >
                    {c === 'CRC' ? '₡ CRC' : '$ USD'}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              className="w-full rounded-input border border-border-strong bg-surface px-[14px] py-[13px] text-[14.5px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent"
            />
          </div>
          <DatePicker label="Fecha" align="right" value={date} onChange={setDate} />
        </div>
        {fx && (
          <p className="fnum -mt-2 text-[12px] text-text-3">
            TC BCCR · compra ₡{fx.buy.toFixed(2)} · venta ₡{fx.sell.toFixed(2)}
            {Number(amount) > 0 && (
              <span className="font-semibold text-text-2">
                {' · ≈ '}
                {curr === 'CRC'
                  ? '$' + (Number(amount) / (type === 'income' ? fx.buy : fx.sell)).toFixed(2)
                  : '₡' +
                    Math.round(Number(amount) * (type === 'income' ? fx.buy : fx.sell)).toLocaleString('es-CR')}
              </span>
            )}
          </p>
        )}
        {type === 'expense' && (
          <Select label="Categoría" value={cat} onChange={(e) => setCat(e.target.value)}>
            {cats.length === 0 && <option value="">Sin categorías</option>}
            {cats.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </Select>
        )}
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-text-2">
            Cuenta / medio de pago <span className="font-normal text-text-3">(opcional)</span>
          </label>
          <input
            list="account-options"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="Ej. BAC, Efectivo…"
            className="w-full rounded-input border border-border-strong bg-surface px-[14px] py-[13px] text-[14.5px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent"
          />
          <datalist id="account-options">
            <option value="BAC" />
            <option value="Efectivo" />
            <option value="Sinpe" />
            <option value="BAC débito" />
          </datalist>
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-text-2">Alcance</span>
          <Segmented
            options={[
              { value: 'Compartido', label: 'Compartido' },
              { value: 'Individual', label: 'Individual' },
            ]}
            value={scope}
            onChange={(v) => setScope(v as typeof scope)}
          />
        </div>
        {scope === 'Individual' && hasPartner && (
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-text-2">¿De quién?</span>
            <Segmented
              options={[
                { value: 'Ana', label: ownerLabel('Ana') },
                { value: 'Luis', label: ownerLabel('Luis') },
              ]}
              value={personOwner}
              onChange={(v) => setPersonOwner(v as OwnerKey)}
            />
          </div>
        )}
        {error && <p className="text-[12.5px] font-semibold text-neg">{error}</p>}
        <Button type="submit" className="mt-1 w-full" disabled={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar movimiento'}
        </Button>
      </form>
    </Modal>
  );
}
