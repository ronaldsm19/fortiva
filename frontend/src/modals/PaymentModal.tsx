import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { DatePicker } from '@/components/DatePicker';
import { Select } from '@/components/Select';
import { Button } from '@/components/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { curOf, valueIn, money } from '@/lib/format';
import { service } from '@/services';
import type { Debt } from '@/services/types';

interface Props {
  open: boolean;
  onClose: () => void;
  debt: Debt | null;
  onPaid?: (d: Debt) => void;
}

export function PaymentModal({ open, onClose, debt, onPaid }: Props) {
  const { rate } = useCurrency();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState('transfer');

  // El pago va en la MONEDA de la deuda, con su TC congelado (previas sin TC: el actual).
  const cur = debt ? curOf(debt) : 'USD';
  const rd = debt?.fxSell ?? rate;

  useEffect(() => {
    // prefilla la cuota mensual EN la moneda de la deuda (₡50 000, no $97).
    if (debt) setAmount(String(Math.round(valueIn(debt.monthly, cur, debt.monthlyCrc, rd))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debt]);

  if (!debt) return null;
  // Restante y cuota en la moneda de la deuda, con su TC congelado (igual que la página Deudas).
  const remaining = valueIn(debt.total, cur, debt.totalCrc, rd) - valueIn(debt.paid, cur, null, rd);
  const monthlyIn = valueIn(debt.monthly, cur, debt.monthlyCrc, rd);
  const sym = cur === 'CRC' ? '₡ CRC' : '$ USD';

  const submit = async () => {
    const updated = await service.registerPayment(debt.id, Number(amount) || 0, cur);
    onPaid?.(updated);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Registrar pago">
      <div className="flex flex-col gap-4">
        <div className="rounded-input bg-surface-2 px-4 py-3">
          <div className="text-[14.5px] font-bold">{debt.name}</div>
          <div className="fnum text-[12.5px] text-text-3">
            {debt.issuer} · restante {money(remaining, cur)}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-text-2">Monto del pago</span>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-bold text-text-2">{sym}</span>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-input border border-border-strong bg-surface px-[14px] py-[13px] text-[14.5px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent"
          />
          <p className="fnum mt-1.5 text-[12px] text-text-3">
            Cuota mensual sugerida: {money(monthlyIn, cur)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DatePicker label="Fecha" value={date} onChange={setDate} placeholder="Hoy" />
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
