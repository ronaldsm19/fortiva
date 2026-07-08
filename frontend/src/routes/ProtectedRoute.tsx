import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/** Protege /app: si no hay sesión, redirige a /login. */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-text-3">
        <span className="text-[14px]">Cargando…</span>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
