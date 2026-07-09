import { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Segmented } from '@/components/Segmented';
import { CurrencyAmount, CurrencyHint } from '@/components/CurrencyAmount';
import { money } from '@/lib/format';
import { useHousehold } from '@/context/HouseholdContext';
import { service } from '@/services';
import type { Debt, FxRate, OwnerKey } from '@/services/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initial?: Debt | null;
}

export function DebtModal({ open, onClose, onSaved, initial }: Props) {
  const { ownerLabel } = useHousehold();
  const editing = !!initial;
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [owner, setOwner] = useState<OwnerKey>('Ana');
  const [months, setMonths] = useState(12);
  const [monthly, setMonthly] = useState(150);
  const [curr, setCurr] = useState<'USD' | 'CRC'>('CRC');
  const [saving, setSaving] = useState(false);
  const [fx, setFx] = useState<FxRate | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setIssuer(initial?.issuer ?? '');
    setOwner(initial?.owner ?? 'Ana');
    const initCur = initial?.currency ?? 'USD';
    setCurr(initial ? initCur : 'CRC');
    // Prefill de montos en la moneda de entrada (colones congelados si aplica).
    const monthlyInCur = initial ? (initCur === 'CRC' ? (initial.monthlyCrc ?? 0) : initial.monthly) : 150;
    const totalInCur = initial ? (initCur === 'CRC' ? (initial.totalCrc ?? 0) : initial.total) : 0;
    setMonthly(monthlyInCur);
    setMonths(initial && monthlyInCur ? Math.max(1, Math.round(totalInCur / monthlyInCur)) : 12);
    service.getFxRate().then(setFx).catch(() => setFx(null));
  }, [open, initial]);

  const total = months * monthly;

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        name: name || 'Nueva deuda',
        issuer: issuer || '—',
        total, // en la moneda de `curr`
        monthly, // en la moneda de `curr`
        currency: curr,
        rate: initial?.rate ?? '—',
        due: initial?.due ?? '—',
        owner,
        icon: initial?.icon ?? 'credit-card',
      };
      if (editing) await service.updateDebt(initial!.id, payload);
      else await service.createDebt(payload);
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar deuda' : 'Nueva deuda'}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tarjeta" />
          <Input label="Entidad" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="BAC" />
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-text-2">¿De quién es la deuda?</span>
          <Segmented
            options={[
              { value: 'Ana', label: ownerLabel('Ana') },
              { value: 'Luis', label: ownerLabel('Luis') },
              { value: 'Pareja', label: 'Compartida' },
            ]}
            value={owner}
            onChange={(v) => setOwner(v as OwnerKey)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Plazo (meses)" type="number" value={months} onChange={(e) => setMonths(Number(e.target.value) || 0)} />
          <CurrencyAmount label="Pago mensual" value={String(monthly)} onChange={(v) => setMonthly(Number(v) || 0)} currency={curr} onCurrencyChange={setCurr} />
        </div>

        <div className="flex items-center gap-3 rounded-input bg-accent-weak px-4 py-3">
          <Calculator size={18} className="text-accent" />
          <span className="text-[13px] font-semibold text-text-2">Total de la deuda =</span>
          <span className="fnum ml-auto text-[17px] font-extrabold text-accent">{money(total, curr)}</span>
        </div>
        <CurrencyHint fx={fx} amount={String(total)} currency={curr} />

        <Button onClick={submit} className="w-full" disabled={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear deuda'}
        </Button>
      </div>
    </Modal>
  );
}
