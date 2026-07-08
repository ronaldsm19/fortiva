import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/** Alerta de "cambia tu contraseña" para cuentas provisionadas (mustChangePw). */
export function FirstLoginBanner() {
  const { user } = useAuth();
  if (!user?.mustChangePw) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-input border border-accent/30 bg-accent-weak px-4 py-3">
      <KeyRound size={18} className="shrink-0 text-accent" />
      <span className="flex-1 text-[13.5px] font-semibold text-text-2">
        Tu contraseña es temporal. Por seguridad, créate una nueva en tu primer ingreso.
      </span>
      <Link to="/app/cuenta" className="whitespace-nowrap text-[13.5px] font-bold text-accent">
        Cambiar contraseña →
      </Link>
    </div>
  );
}
