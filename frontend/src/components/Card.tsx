import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** padding interno (default 22px) */
  pad?: string;
}

export function Card({ children, className = '', pad = 'p-[22px]', ...rest }: Props) {
  return (
    <div
      className={`bg-surface border border-border rounded-card shadow-sm ${pad} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
