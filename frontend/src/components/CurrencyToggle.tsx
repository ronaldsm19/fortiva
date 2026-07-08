import { useCurrency } from '@/context/CurrencyContext';

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  const opt = (value: 'USD' | 'CRC', label: string) => {
    const active = currency === value;
    return (
      <button
        onClick={() => setCurrency(value)}
        className={`rounded-[8px] px-3 py-1.5 text-[13px] font-bold transition-colors ${
          active ? 'bg-accent text-accent-ink' : 'text-text-2 hover:text-text'
        }`}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="flex items-center gap-1 rounded-input border border-border bg-surface p-1">
      {opt('USD', 'USD')}
      {opt('CRC', '₡ CRC')}
    </div>
  );
}
