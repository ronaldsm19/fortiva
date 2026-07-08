interface Props {
  size?: number;
  showWord?: boolean;
}

/** Logo "F" en cuadro con gradiente + wordmark "Fortiva". */
export function Logo({ size = 32, showWord = true }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="grid place-items-center font-extrabold text-white"
        style={{
          width: size,
          height: size,
          borderRadius: 9,
          background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))',
          fontSize: size * 0.5,
        }}
      >
        F
      </div>
      {showWord && (
        <span className="text-[20px] font-extrabold tracking-[-0.02em]">Fortiva</span>
      )}
    </div>
  );
}
