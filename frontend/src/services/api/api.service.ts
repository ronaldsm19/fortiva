import type { FortivaService } from '../service.interface';
import type { CoupleConfig, Debt, Kpi, Movement, MonthPoint, Reminder, TopCategory } from '../types';
import { http } from '../http';

/** Implementación real contra el backend REST. */

interface Summary {
  ingresos: number;
  gastos: number;
  disponible: number;
  ahorro: number;
}

function buildKpis(s: Summary, series: MonthPoint[]): Kpi[] {
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const delta = (cur: number, old: number) => {
    if (!old) return 'vs mes previo';
    const p = Math.round(((cur - old) / old) * 100);
    return `${p >= 0 ? '+' : ''}${p}% vs mes previo`;
  };
  const dispPct = s.ingresos ? Math.round((s.disponible / s.ingresos) * 100) : 0;
  return [
    { label: 'Ingresos', value: s.ingresos, icon: 'arrow-down-left', color: 'var(--pos)', bg: 'var(--pos-weak)', delta: last && prev ? delta(last.i, prev.i) : 'vs mes previo', deltaColor: 'var(--pos)' },
    { label: 'Gastos', value: s.gastos, icon: 'arrow-up-right', color: 'var(--neg)', bg: 'var(--neg-weak)', delta: last && prev ? delta(last.g, prev.g) : 'vs mes previo', deltaColor: 'var(--pos)' },
    { label: 'Disponible', value: s.disponible, icon: 'wallet', color: 'var(--accent)', bg: 'var(--accent-weak)', delta: `${dispPct}% de ingresos`, deltaColor: 'var(--text-3)' },
    { label: 'Ahorro', value: s.ahorro, icon: 'piggy-bank', color: 'var(--gold)', bg: 'color-mix(in srgb,var(--gold) 14%,transparent)', delta: 'Meta: $1,000', deltaColor: 'var(--text-3)' },
  ];
}

interface BackendCouple {
  coupleMode: boolean;
  splitMode: 'fifty' | 'custom' | 'salary';
  splitP1Pct: number;
  salaryP1: number;
  salaryP2: number;
  sharedTotal: number;
}
const toFrontCouple = (c: BackendCouple): CoupleConfig => ({
  coupleMode: c.coupleMode,
  splitMode: c.splitMode === 'fifty' ? '50' : c.splitMode,
  p1: c.splitP1Pct,
  sharedTotal: c.sharedTotal,
  salaryP1: c.salaryP1,
  salaryP2: c.salaryP2,
});

// month (0–11) / year → query params
const mq = (month?: number, year?: number) =>
  month != null && year != null ? `&month=${month}&year=${year}` : '';

// Movement (frontend) → payload backend
function movementPayload(input: Partial<Omit<Movement, 'id'>>) {
  const p: Record<string, unknown> = {};
  if (input.type !== undefined) p.type = input.type;
  if (input.amount !== undefined) p.amount = input.amount;
  if (input.desc !== undefined) p.description = input.desc;
  if (input.scope !== undefined) p.scope = input.scope === 'Compartido' ? 'shared' : 'individual';
  if (input.owner !== undefined) p.ownerKey = input.owner.toLowerCase();
  if (input.cat !== undefined) p.categoryName = input.cat;
  if (input.icon !== undefined) p.icon = input.icon;
  // `date` puede venir como ISO (input date) → occurredOn
  if (input.date && /^\d{4}-\d{2}-\d{2}/.test(input.date)) p.occurredOn = input.date;
  return p;
}

function reminderPayload(input: Partial<Omit<Reminder, 'id'>>) {
  const p: Record<string, unknown> = {};
  if (input.name !== undefined) p.name = input.name;
  if (input.issuer !== undefined) p.issuer = input.issuer;
  if (input.amount !== undefined) p.amount = input.amount;
  if (input.due !== undefined) p.dueDate = input.due; // ISO desde input date
  if (input.email !== undefined) p.emailEnabled = input.email;
  if (input.status !== undefined) p.status = input.status === 'pagado' ? 'paid' : 'pending';
  if (input.icon !== undefined) p.icon = input.icon;
  return p;
}

function debtPayload(input: Partial<Omit<Debt, 'id' | 'paid'>>) {
  const p: Record<string, unknown> = {};
  if (input.name !== undefined) p.name = input.name;
  if (input.issuer !== undefined) p.issuer = input.issuer;
  if (input.total !== undefined) p.total = input.total;
  if (input.monthly !== undefined) p.monthly = input.monthly;
  if (input.rate !== undefined) p.rate = input.rate;
  if (input.owner !== undefined) p.owner = input.owner;
  if (input.icon !== undefined) p.icon = input.icon;
  return p;
}

export const apiService: FortivaService = {
  async getKpis(month, year) {
    const [summary, series] = await Promise.all([
      http<Summary>(`/movements/summary?_${mq(month, year)}`),
      http<MonthPoint[]>(`/movements/summary?series=6m${mq(month, year)}`),
    ]);
    return buildKpis(summary, series);
  },
  getDashboardSeries: (month, year) => http(`/movements/summary?series=6m${mq(month, year)}`),

  listMovements: (owner = 'todos', month, year) => http(`/movements?owner=${owner}${mq(month, year)}`),
  createMovement: (input) => http('/movements', { method: 'POST', body: JSON.stringify(movementPayload(input)) }),
  updateMovement: (id, input) => http(`/movements/${id}`, { method: 'PATCH', body: JSON.stringify(movementPayload(input)) }),
  deleteMovement: (id) => http(`/movements/${id}`, { method: 'DELETE' }),

  listCategories: () => http('/categories'),
  createCategory: (input) =>
    http('/categories', { method: 'POST', body: JSON.stringify({ name: input.name, icon: input.icon, color: input.color, budget: input.budget }) }),
  updateCategory: (id, input) =>
    http(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ name: input.name, icon: input.icon, color: input.color, budget: input.budget }) }),
  deleteCategory: (id) => http(`/categories/${id}`, { method: 'DELETE' }),

  listDebts: (filter = 'todas') => http(`/debts?owner=${filter}`),
  createDebt: (input) => http('/debts', { method: 'POST', body: JSON.stringify(debtPayload(input)) }),
  updateDebt: (id, input) => http(`/debts/${id}`, { method: 'PATCH', body: JSON.stringify(debtPayload(input)) }),
  deleteDebt: (id) => http(`/debts/${id}`, { method: 'DELETE' }),
  registerPayment: (debtId, amount) => http(`/debts/${debtId}/payments`, { method: 'POST', body: JSON.stringify({ amount }) }),

  listAssets: () => http('/networth'),
  createAsset: (input) =>
    http('/assets', { method: 'POST', body: JSON.stringify({ name: input.name, amount: input.amount, icon: input.icon, color: input.color, isAsset: input.isAsset }) }),
  updateAsset: (id, input) => http(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteAsset: (id) => http(`/assets/${id}`, { method: 'DELETE' }),

  listReminders: () => http('/reminders'),
  createReminder: (input) => http('/reminders', { method: 'POST', body: JSON.stringify(reminderPayload(input)) }),
  updateReminder: (id, input) => http(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(reminderPayload(input)) }),
  deleteReminder: (id) => http(`/reminders/${id}`, { method: 'DELETE' }),
  toggleReminderEmail: (id, enabled) => http(`/reminders/${id}/email`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),

  getAnnualSeries: (year) => http<{ series: MonthPoint[] }>(`/reports/annual?${year ? `year=${year}` : ''}`).then((r) => r.series),
  getTopCategories: (year) => http<{ topCategories: TopCategory[] }>(`/reports/annual?${year ? `year=${year}` : ''}`).then((r) => r.topCategories),

  async getCoupleConfig() {
    return toFrontCouple(await http<BackendCouple>('/account/couple'));
  },
  async updateCoupleConfig(cfg: Partial<CoupleConfig>) {
    const body: Record<string, unknown> = {};
    if (cfg.coupleMode !== undefined) body.coupleMode = cfg.coupleMode;
    if (cfg.splitMode !== undefined) body.splitMode = cfg.splitMode === '50' ? 'fifty' : cfg.splitMode;
    if (cfg.p1 !== undefined) body.splitP1Pct = cfg.p1;
    return toFrontCouple(await http<BackendCouple>('/account/couple', { method: 'PATCH', body: JSON.stringify(body) }));
  },

  getPricing: () => import('@/data/mock').then((m) => m.pricingPlans),
};
