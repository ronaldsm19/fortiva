import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  text?: string;
}

export function EmptyState({ icon: Icon, title, text }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-text-3">
        <Icon size={22} />
      </div>
      <p className="text-[15px] font-bold text-text">{title}</p>
      {text && <p className="max-w-xs text-[13.5px] text-text-3">{text}</p>}
    </div>
  );
}
