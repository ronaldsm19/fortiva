import { Menu } from 'lucide-react';
import { MonthSelector } from '../MonthSelector';
import { ThemeToggle } from '../ThemeToggle';
import { useAuth } from '@/context/AuthContext';

interface Props {
  title: string;
  onOpenMenu: () => void;
}

export function Topbar({ title, onOpenMenu }: Props) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-[14px]">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 lg:px-7">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="grid h-9 w-9 place-items-center rounded-input text-text-2 hover:bg-surface-2 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-[21px] font-extrabold tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <MonthSelector />
          <ThemeToggle />
          <div
            className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))' }}
          >
            {user?.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
