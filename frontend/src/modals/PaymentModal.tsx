import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Button } from '@/components/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { service } from '@/services';
import type { Debt } from '@/services/types';

interface Props {
  open: boolean;
  onClose: () => void;
  debt: Debt | null;
  onPaid?: (d: Debt) => void;
}

export function PaymentModal({ open, onClose, debt, onPaid }: Props) {
  const { format } = useCurrency();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState('transfer');

  useEffect(() => {
    if (debt) setAmount(String(debt.monthly));
  }, [debt]);

  if (!debt) return null;
  const remaining = debt.total - debt.paid;

  const submit = async () => {
    const updated = await service.registerPayment(debt.id, Number(amount) || 0);
    onPaid?.(updated);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Registrar pago">
      <div className="flex flex-col gap-4">
        <div className="rounded-input bg-surface-2 px-4 py-3">
          <div className="text-[14.5px] font-bold">{debt.name}</div>
          <div className="fnum text-[12.5px] text-text-3">
            {debt.issuer} · restante {format(remaining)}
          </div>
        </div>

        <div>
          <Input
            label="Monto del pago"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="fnum mt-1.5 text-[12px] text-text-3">
            Cuota mensual sugerida: {format(debt.monthly)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Hoy" />
          <Select label="Método" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="transfer">Transferencia</option>
            <option value="debit">Tarjeta de débito</option>
            <option value="cash">Efectivo</option>
            <option value="sinpe">Sinpe Móvil</option>
          </Select>
        </div>

        <Button variant="success" onClick={submit} className="w-full">
          Confirmar pago
        </Button>
      </div>
    </Modal>
  );
}
