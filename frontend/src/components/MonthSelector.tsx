import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonth } from '@/context/MonthContext';

export function MonthSelector() {
  const { label, prev, next } = useMonth();
  return (
    <div className="flex items-center gap-1 rounded-input border border-border bg-surface p-1">
      <button
        onClick={prev}
        aria-label="Mes anterior"
        className="grid h-7 w-7 place-items-center rounded-[8px] text-text-2 hover:bg-surface-2"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="fnum min-w-[104px] text-center text-[13.5px] font-bold">{label}</span>
      <button
        onClick={next}
        aria-label="Mes siguiente"
        className="grid h-7 w-7 place-items-center rounded-[8px] text-text-2 hover:bg-surface-2"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
