import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MESES_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // semana inicia en lunes

interface Props {
  label?: string;
  /** valor en ISO 'YYYY-MM-DD' (o '' si vacío) — mismo formato que un <input type="date"> */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** lado por el que se ancla el popover (usar 'right' si el campo está en la columna derecha) */
  align?: 'left' | 'right';
}

/** Parsea 'YYYY-MM-DD' a Date local (sin corrimiento por zona horaria). */
function parseISO(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function toISO(d: Date): string {
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mo}-${da}`;
}

function fmtDisplay(v: string): string {
  const d = parseISO(v);
  return d ? `${d.getDate()} ${MESES_ABBR[d.getMonth()]} ${d.getFullYear()}` : '';
}

const sameDay = (a: Date, y: number, m: number, d: number) =>
  a.getFullYear() === y && a.getMonth() === m && a.getDate() === d;

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  disabled,
  align = 'left',
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const [view, setView] = useState<Date>(() => selected ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  // Si el valor cambia desde afuera (p. ej. al editar), muestra ese mes.
  useEffect(() => {
    const d = parseISO(value);
    if (d) setView(d);
  }, [value]);

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const y = view.getFullYear();
  const mo = view.getMonth();
  const lead = (new Date(y, mo, 1).getDay() + 6) % 7; // huecos antes del día 1 (lunes-first)
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const today = new Date();
  const cells: (number | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pick = (d: number) => {
    onChange(toISO(new Date(y, mo, d)));
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      {label && <span className="mb-1.5 block text-[13px] font-semibold text-text-2">{label}</span>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-input border bg-surface px-[14px] py-[13px] text-left text-[14.5px] outline-none transition-colors ${
          open ? 'border-accent' : 'border-border-strong'
        } ${disabled ? 'opacity-50' : 'hover:border-accent'}`}
      >
        <Calendar size={16} className="shrink-0 text-text-3" />
        <span className={value ? 'text-text' : 'text-text-3'}>
          {value ? fmtDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          className={`absolute top-full z-20 mt-2 w-[300px] rounded-card border border-border bg-surface p-3 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(y, mo - 1, 1))}
              className="grid h-8 w-8 place-items-center rounded-full text-text-2 hover:bg-surface-2"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[14px] font-bold capitalize">
              {MESES[mo]} {y}
            </span>
            <button
              type="button"
              onClick={() => setView(new Date(y, mo + 1, 1))}
              className="grid h-8 w-8 place-items-center rounded-full text-text-2 hover:bg-surface-2"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DIAS.map((d, i) => (
              <div key={i} className="grid h-8 place-items-center text-[11px] font-semibold text-text-3">
                {d}
              </div>
            ))}
            {cells.map((d, i) =>
              d === null ? (
                <div key={`e${i}`} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(d)}
                  className={`fnum grid h-9 place-items-center rounded-[9px] text-[13px] font-semibold transition-colors ${
                    selected && sameDay(selected, y, mo, d)
                      ? 'bg-accent text-accent-ink'
                      : sameDay(today, y, mo, d)
                        ? 'bg-accent-weak text-accent'
                        : 'text-text hover:bg-surface-2'
                  }`}
                >
                  {d}
                </button>
              ),
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                onChange(toISO(new Date()));
                setOpen(false);
              }}
              className="text-[12.5px] font-semibold text-accent hover:underline"
            >
              Hoy
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="text-[12.5px] font-semibold text-text-3 hover:text-neg"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
