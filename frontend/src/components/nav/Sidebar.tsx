import { NavLink } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { Logo } from '../Logo';
import { Icon } from '../Icon';
import { navItems } from './navConfig';
import { useAuth } from '@/context/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Overlay móvil */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-[rgba(20,15,8,.4)] backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-[250px] flex-col border-r border-border bg-surface px-4 py-5 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-2">
          <Logo />
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-input px-[13px] py-[11px] text-[14.5px] transition-colors ${
                  isActive
                    ? 'bg-accent font-bold text-accent-ink shadow-sm'
                    : 'font-semibold text-text-2 hover:bg-surface-2'
                }`
              }
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-border pt-4">
          <NavLink
            to="/app/cuenta"
            onClick={onClose}
            className="flex w-full items-center gap-3 rounded-input p-2 hover:bg-surface-2"
          >
            <div
              className="grid h-[38px] w-[38px] place-items-center rounded-full font-bold text-white"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))' }}
            >
              {user?.initials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[13.5px] font-bold">{user?.fullName}</div>
              <div className="truncate text-[12px] text-text-3">{user?.accountName}</div>
            </div>
            <ChevronRight size={16} className="text-text-3" />
          </NavLink>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-input px-2 py-2 text-[13.5px] font-semibold text-text-2 hover:bg-surface-2"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
