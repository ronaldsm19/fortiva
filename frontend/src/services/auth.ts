import { http, setTokens, clearTokens, getRefreshToken, getAccessToken } from './http';
import { mockUser } from '@/data/mock';

const mode = import.meta.env.VITE_API_MODE ?? 'mock';

export interface SessionUser {
  fullName: string;
  accountName: string;
  initials: string;
  email: string;
  trialDaysLeft?: number | null;
  /** Slot de la persona (ana=principal, luis=pareja) para atribuir movimientos. */
  personKey?: 'ana' | 'luis' | null;
  /** true si debe cambiar la contraseña en el primer ingreso (cuenta provisionada). */
  mustChangePw?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  accountName: string;
  nationalId?: string;
  phone?: string;
}

interface MeResponse {
  email: string;
  fullName: string;
  personKey?: 'ana' | 'luis' | null;
  mustChangePw?: boolean;
  account: { name: string; trialDaysLeft: number | null };
}
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: MeResponse;
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

function toSession(me: MeResponse): SessionUser {
  return {
    fullName: me.fullName,
    accountName: me.account.name,
    email: me.email,
    initials: initials(me.fullName),
    trialDaysLeft: me.account.trialDaysLeft,
    personKey: me.personKey ?? 'ana',
    mustChangePw: me.mustChangePw ?? false,
  };
}

const mockSession: SessionUser = {
  fullName: mockUser.fullName,
  accountName: mockUser.accountName,
  email: mockUser.email,
  initials: mockUser.initials,
  personKey: 'ana',
};

/**
 * Servicio de autenticación. En modo `mock` (Fase 1) devuelve un usuario local;
 * en modo `api` (Fase 3) habla con el backend real y gestiona los tokens JWT.
 */
export const authService = {
  isApi: mode === 'api',

  /** ¿Hay sesión activa? En mock siempre; en api, si hay access token. */
  hasSession(): boolean {
    return mode !== 'api' ? true : !!getAccessToken();
  },

  async login(email: string, password: string): Promise<SessionUser> {
    if (mode !== 'api') return mockSession;
    const r = await http<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(r.accessToken, r.refreshToken);
    return toSession(r.user);
  },

  async register(payload: RegisterPayload): Promise<SessionUser> {
    if (mode !== 'api') return mockSession;
    const r = await http<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setTokens(r.accessToken, r.refreshToken);
    return toSession(r.user);
  },

  async me(): Promise<SessionUser> {
    if (mode !== 'api') return mockSession;
    const me = await http<MeResponse>('/me');
    return toSession(me);
  },

  async logout(): Promise<void> {
    if (mode === 'api') {
      const rt = getRefreshToken();
      if (rt) {
        await http('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: rt }) }).catch(
          () => undefined,
        );
      }
      clearTokens();
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (mode !== 'api') return; // en mock no hay contraseña real
    await http('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async forgotPassword(email: string): Promise<void> {
    if (mode !== 'api') return;
    await http('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (mode !== 'api') return;
    await http('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
  },
};
