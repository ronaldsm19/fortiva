import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService, type RegisterPayload, type SessionUser } from '@/services/auth';

export type AuthUser = SessionUser;

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay sesión (token o modo mock), carga el perfil.
  useEffect(() => {
    if (authService.hasSession()) {
      authService
        .me()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setUser(await authService.login(email, password));
  };
  const register = async (payload: RegisterPayload) => {
    setUser(await authService.register(payload));
  };
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };
  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authService.changePassword(currentPassword, newPassword);
    setUser((u) => (u ? { ...u, mustChangePw: false } : u));
  };

  return (
    <Ctx.Provider
      value={{ user, isAuthenticated: !!user, loading, login, register, logout, changePassword }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
