import type { ReactNode } from 'react';
import { Card } from './Card';

interface Props {
  title: string;
  action?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
}

export function ChartCard({ title, action, legend, children }: Props) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[16px] font-extrabold tracking-tight">{title}</h3>
        {action}
      </div>
      {legend && <div className="mb-3 flex items-center gap-4">{legend}</div>}
      {children}
    </Card>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-2">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
