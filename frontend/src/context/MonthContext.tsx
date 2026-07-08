import { createContext, useContext, useState, type ReactNode } from 'react';
import { MONTHS } from '@/lib/format';

interface MonthCtx {
  monthIdx: number;
  year: number;
  label: string;
  prev: () => void;
  next: () => void;
}

const Ctx = createContext<MonthCtx | null>(null);

export function MonthProvider({ children }: { children: ReactNode }) {
  // Default: Julio 2026 (como el template)
  const [monthIdx, setMonthIdx] = useState(6);
  const [year, setYear] = useState(2026);

  const prev = () => {
    setMonthIdx((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };
  const next = () => {
    setMonthIdx((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const label = `${MONTHS[monthIdx]} ${year}`;
  return (
    <Ctx.Provider value={{ monthIdx, year, label, prev, next }}>{children}</Ctx.Provider>
  );
}

export function useMonth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMonth debe usarse dentro de MonthProvider');
  return ctx;
}
