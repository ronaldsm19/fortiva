import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="grid h-9 w-9 place-items-center rounded-input border border-border bg-surface text-text-2 transition-colors hover:text-text"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
