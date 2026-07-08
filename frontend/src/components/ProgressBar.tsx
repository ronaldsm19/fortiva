interface Props {
  value: number; // 0..100
  color?: string;
  /** gradiente verde para deudas pagadas */
  gradient?: boolean;
}

export function ProgressBar({ value, color = 'var(--accent)', gradient = false }: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const bg = gradient
    ? 'linear-gradient(90deg, var(--pos), #1f6b50)'
    : color;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${clamped}%`, background: bg }}
      />
    </div>
  );
}
