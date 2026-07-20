import { http } from './http';
import type { Currency } from '@/lib/format';

const mode = import.meta.env.VITE_API_MODE ?? 'mock';
const CURRENCY_KEY = 'fortiva.currency';

export interface Member {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'member';
  personKey: 'ana' | 'luis' | null;
}

export interface Persons {
  p1Name: string; // persona principal (admin)
  p2Name: string | null; // pareja (o null si aún no la invitan)
  hasPartner: boolean;
}

export interface InviteResult {
  member: { id: string; fullName: string; email: string };
  tempPassword: string;
  emailed: boolean;
  emailError?: string;
}

/** Datos del hogar (nombres reales de las personas) e invitación de pareja. */
export const accountApi = {
  async persons(): Promise<Persons> {
    if (mode !== 'api') return { p1Name: 'Ana', p2Name: 'Luis', hasPartner: true };
    const members = await http<Member[]>('/account/members');
    const p1 = members.find((m) => m.personKey === 'ana') ?? members.find((m) => m.role === 'admin');
    const p2 = members.find((m) => m.personKey === 'luis');
    return {
      p1Name: p1?.fullName ?? 'Persona 1',
      p2Name: p2?.fullName ?? null,
      hasPartner: !!p2,
    };
  },

  invitePartner(input: { fullName: string; email: string }): Promise<InviteResult> {
    return http('/account/members', { method: 'POST', body: JSON.stringify(input) });
  },

  /** Moneda preferida guardada (por defecto colones). En api viene de la cuenta; en mock, de localStorage. */
  async getCurrency(): Promise<Currency> {
    if (mode !== 'api') return (localStorage.getItem(CURRENCY_KEY) as Currency) || 'CRC';
    const acc = await http<{ currencyPref: Currency }>('/account');
    return acc.currencyPref ?? 'CRC';
  },

  /** Persiste la moneda preferida de la cuenta. */
  async setCurrency(currency: Currency): Promise<void> {
    if (mode !== 'api') {
      localStorage.setItem(CURRENCY_KEY, currency);
      return;
    }
    await http('/account/currency', { method: 'PATCH', body: JSON.stringify({ currency }) });
  },
};
