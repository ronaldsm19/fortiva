import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fmt, type Currency } from '@/lib/format';
import { service } from '@/services';
import { accountApi } from '@/services/account';

interface CurrencyCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** TC venta actual (colones por USD), del BCCR. */
  rate: number;
  /** Formatea un monto USD según la moneda activa y el TC actual. */
  format: (usd: number) => string;
}

const Ctx = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('CRC'); // por defecto colones
  const [rate, setRate] = useState(525); // fallback hasta cargar el TC real
  useEffect(() => {
    let alive = true;
    accountApi.getCurrency().then((c) => alive && setCurrencyState(c)).catch(() => {});
    service.getFxRate().then((fx) => alive && setRate(fx.sell)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  // Cambia la moneda activa y la persiste (cuenta en modo api, localStorage en mock).
  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    accountApi.setCurrency(c).catch(() => {});
  };
  const format = (usd: number) => fmt(usd, currency, rate);
  return <Ctx.Provider value={{ currency, setCurrency, rate, format }}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrency debe usarse dentro de CurrencyProvider');
  return ctx;
}
