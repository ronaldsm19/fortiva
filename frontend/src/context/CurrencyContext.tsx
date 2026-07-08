import { createContext, useContext, useState, type ReactNode } from 'react';
import { fmt, type Currency } from '@/lib/format';

interface CurrencyCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Formatea un monto USD según la moneda activa. */
  format: (usd: number) => string;
}

const Ctx = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const format = (usd: number) => fmt(usd, currency);
  return <Ctx.Provider value={{ currency, setCurrency, format }}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrency debe usarse dentro de CurrencyProvider');
  return ctx;
}
