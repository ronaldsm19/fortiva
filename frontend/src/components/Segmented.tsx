interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}

/** Control segmentado (Ingreso/Gasto, Compartido/Individual, 50-50/Custom…). */
export function Segmented({ options, value, onChange }: Props) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-input px-3 py-2.5 text-[13.5px] font-bold transition-colors ${
              active
                ? 'border-[1.5px] border-accent bg-accent-weak text-accent'
                : 'border border-border-strong bg-surface text-text-2 hover:text-text'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
