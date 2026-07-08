import { Pencil, Trash2 } from 'lucide-react';
import { Card } from './Card';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { useCurrency } from '@/context/CurrencyContext';
import { pct, tint } from '@/lib/format';
import type { Category } from '@/services/types';

interface Props {
  category: Category;
  onEdit?: (c: Category) => void;
  onDelete?: (c: Category) => void;
}

export function CategoryCard({ category, onEdit, onDelete }: Props) {
  const { format } = useCurrency();
  const percent = pct(category.spent, category.budget);
  const over = category.spent > category.budget;
  const isSystem = category.kind === 'system';

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-[12px]"
            style={{ background: tint(category.color), color: category.color }}
          >
            <Icon name={category.icon} size={20} />
          </div>
          <div>
            <div className="text-[15px] font-bold">{category.name}</div>
            {isSystem ? (
              <span className="text-[12px] text-text-3">Sistema</span>
            ) : (
              <span className="text-[12px] font-semibold text-accent">Personalizada</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit?.(category)}
            className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-surface-2 hover:text-text"
            aria-label="Editar categoría"
          >
            <Pencil size={15} />
          </button>
          {!isSystem && (
            <button
              onClick={() => onDelete?.(category)}
              className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-neg-weak hover:text-neg"
              aria-label="Eliminar categoría"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {isSystem && (
        <Badge className="mb-3" color="var(--text-3)" bg="var(--surface-2)">
          No se pueden eliminar
        </Badge>
      )}

      <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-text-2">
        <span className="fnum">
          {format(category.spent)} de {format(category.budget)}
        </span>
        <span className="fnum font-bold" style={{ color: over ? 'var(--neg)' : 'var(--text)' }}>
          {percent}%
        </span>
      </div>
      <ProgressBar value={percent} color={over ? 'var(--neg)' : category.color} />
    </Card>
  );
}
