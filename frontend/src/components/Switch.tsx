interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  'aria-label'?: string;
}

/** Toggle/switch reutilizable (modo pareja, recordatorio por email). */
export function Switch({ checked, onChange, ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200"
      style={{ background: checked ? 'var(--accent)' : 'var(--border-strong)' }}
      {...rest}
    >
      <span
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-[left] duration-200"
        style={{ left: checked ? '23px' : '3px' }}
      />
    </button>
  );
}
