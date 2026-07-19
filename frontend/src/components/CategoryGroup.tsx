import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Icon } from './Icon';
import { TransactionRow } from './TransactionRow';
import { money, tint } from '@/lib/format';
import type { Movement } from '@/services/types';

interface Props {
  name: string;
  color: string;
  icon: string;
  total: number; // en colones
  movements: Movement[];
  onEdit?: (m: Movement) => void;
  onDelete?: (m: Movement) => void;
}

/** Card colapsable de una categoría: encabezado con color + total; se expande para ver
 * sus movimientos con el mismo componente TransactionRow. Vacía = no se expande. */
export function CategoryGroup({ name, color, icon, total, movements, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const empty = movements.length === 0;

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface" style={{ borderLeft: `3px solid ${color}` }}>
      <button
        type="button"
        onClick={() => !empty && setOpen((o) => !o)}
        disabled={empty}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors enabled:hover:bg-surface-2 disabled:cursor-default"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: tint(color, 16), color }}>
          <Icon name={icon} size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold">{name}</div>
          <div className="text-[12px] text-text-3">
            {movements.length} {movements.length === 1 ? 'movimiento' : 'movimientos'}
          </div>
        </div>
        <div className="fnum text-[15.5px] font-extrabold" style={{ color: empty ? 'var(--text-3)' : 'var(--text)' }}>
          {money(total, 'CRC')}
        </div>
        {!empty && (
          <ChevronDown size={16} className={`shrink-0 text-text-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && !empty && (
        <div className="border-t border-border px-4">
          {movements.map((m) => (
            <TransactionRow key={m.id} m={m} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
