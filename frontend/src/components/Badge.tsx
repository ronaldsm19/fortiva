import type { ReactNode, CSSProperties } from 'react';

interface Props {
  children: ReactNode;
  color?: string;
  bg?: string;
  className?: string;
  style?: CSSProperties;
}

export function Badge({ children, color, bg, className = '', style }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${className}`}
      style={{ color, background: bg, ...style }}
    >
      {children}
    </span>
  );
}
