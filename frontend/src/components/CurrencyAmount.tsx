import type { Currency } from '@/lib/format';
import type { FxRate } from '@/services/types';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  required?: boolean;
}

/**
 * Campo de monto con selector ₡/$ integrado en la etiqueta. Réplica exacta del patrón de
 * `MovementModal` para reusarlo en Deudas, Recordatorios y Patrimonio.
 */
export function CurrencyAmount({ label, value, onChange, currency, onCurrencyChange, required }: Props) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text-2">{label}</span>
        <div className="flex rounded-md bg-surface-2 p-0.5">
          {(['CRC', 'USD'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCurrencyChange(c)}
              className={`rounded px-2 py-0.5 text-[12px] font-bold transition-colors ${
                currency === c ? 'bg-accent text-accent-ink' : 'text-text-3 hover:text-text'
              }`}
            >
              {c === 'CRC' ? '₡ CRC' : '$ USD'}
            </button>
          ))}
        </div>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        required={required}
        className="w-full rounded-input border border-border-strong bg-surface px-[14px] py-[13px] text-[14.5px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent"
      />
    </div>
  );
}

/**
 * Pista de conversión con el TC del BCCR. Deudas/recordatorios/activos no son ingreso/gasto,
 * así que la referencia es siempre el TC de **venta**.
 */
export function CurrencyHint({ fx, amount, currency }: { fx: FxRate | null; amount: string; currency: Currency }) {
  const n = Number(amount);
  if (!fx || !(n > 0)) return null;
  return (
    <p className="fnum -mt-2 text-[12px] text-text-3">
      TC BCCR · venta ₡{fx.sell.toFixed(2)}
      <span className="font-semibold text-text-2">
        {' · ≈ '}
        {currency === 'CRC'
          ? '$' + (n / fx.sell).toFixed(2)
          : '₡' + Math.round(n * fx.sell).toLocaleString('es-CR')}
      </span>
    </p>
  );
}
