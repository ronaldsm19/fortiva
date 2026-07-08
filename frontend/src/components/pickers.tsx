import { Select } from './Select';
import { Icon } from './Icon';

export const ICON_OPTIONS = [
  'home', 'trending-up', 'shield', 'utensils', 'graduation-cap', 'heart-pulse',
  'paw-print', 'car', 'shopping-cart', 'gift', 'coffee', 'wifi', 'zap', 'droplet',
  'briefcase', 'sparkles', 'banknote', 'building-2', 'piggy-bank', 'credit-card',
  'laptop', 'bell', 'plane', 'dumbbell', 'baby', 'stethoscope',
];

export const COLOR_OPTIONS = [
  '#2456C9', '#2E8B6B', '#A9822F', '#C0503B', '#7C4DBF', '#C0398A',
  '#3E8AA9', '#E0806B', '#1F6B50', '#B45309',
];

export function IconSelect({
  label = 'Icono',
  value,
  onChange,
  disabled,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-text-2">
        {label} <Icon name={value} size={16} />
      </span>
      <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {ICON_OPTIONS.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function ColorSwatches({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-text-2">Color</span>
      <div className="flex flex-wrap gap-2">
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c)}
            aria-label={`Color ${c}`}
            className={`h-8 w-8 rounded-full transition-transform ${
              value === c ? 'ring-2 ring-offset-2 ring-offset-surface' : ''
            } ${disabled ? 'opacity-40' : 'hover:scale-110'}`}
            style={{ background: c, boxShadow: value === c ? `0 0 0 2px ${c}` : undefined }}
          />
        ))}
      </div>
    </div>
  );
}
