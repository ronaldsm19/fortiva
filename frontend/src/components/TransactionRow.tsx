import { Pencil, Trash2 } from 'lucide-react';
import { Icon } from './Icon';
import { OwnerAvatar } from './OwnerAvatar';
import { Badge } from './Badge';
import { money } from '@/lib/format';
import type { Movement } from '@/services/types';

interface Props {
  m: Movement;
  /** muestra la columna "de quién" (tabla de Movimientos) */
  showOwner?: boolean;
  onEdit?: (m: Movement) => void;
  onDelete?: (m: Movement) => void;
}

export function TransactionRow({ m, showOwner = false, onEdit, onDelete }: Props) {
  const income = m.type === 'income';
  const cur = m.currency ?? 'USD';
  const displayAmount = cur === 'CRC' ? (m.amountCrc ?? 0) : m.amount;
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px]"
        style={{
          background: income ? 'var(--pos-weak)' : 'var(--accent-weak)',
          color: income ? 'var(--pos)' : 'var(--accent)',
        }}
      >
        <Icon name={m.icon} size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold">{m.desc}</div>
        <div className="text-[12.5px] text-text-3">
          {m.cat && m.cat !== '—' ? `${m.cat} · ` : ''}{m.date}
        </div>
      </div>

      {showOwner && (
        <div className="hidden items-center gap-2 sm:flex">
          <OwnerAvatar owner={m.owner} size={26} />
          <Badge
            color={m.scope === 'Compartido' ? 'var(--accent)' : 'var(--text-3)'}
            bg={m.scope === 'Compartido' ? 'var(--accent-weak)' : 'var(--surface-2)'}
          >
            {m.scope}
          </Badge>
        </div>
      )}

      <div
        className="fnum w-24 shrink-0 text-right text-[14.5px] font-extrabold"
        style={{ color: income ? 'var(--pos)' : 'var(--text)' }}
      >
        {income ? '+ ' : '− '}
        {money(displayAmount, cur)}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <button onClick={() => onEdit(m)} className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-surface-2 hover:text-text" aria-label="Editar">
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(m)} className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-neg-weak hover:text-neg" aria-label="Eliminar">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
