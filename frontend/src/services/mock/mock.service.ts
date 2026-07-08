import type { FortivaService } from '../service.interface';
import type { Asset, Category, CoupleConfig, Debt, Movement, Reminder } from '../types';
import * as mock from '@/data/mock';

/** Latencia simulada para que el swap a red se sienta idéntico. */
const delay = <T>(v: T, ms = 120): Promise<T> =>
  new Promise((r) => setTimeout(() => r(v), ms));

const uid = () => Math.random().toString(36).slice(2, 9);

// Estado en memoria (mutable) para simular CRUD durante la sesión.
let movements = [...mock.movements];
let system = [...mock.systemCategories];
let custom = [...mock.customCategories];
let debts = [...mock.debts];
let assets = [...mock.assets];
let reminders = [...mock.reminders];
let couple: CoupleConfig = { ...mock.coupleDefault };

const ownerFilterKey: Record<string, Movement['owner']> = {
  ana: 'Ana', luis: 'Luis', pareja: 'Pareja',
};

/** En modo salario, p1 se deriva de la proporción de salarios (igual que el backend). */
const withSalarySplit = (c: CoupleConfig): CoupleConfig => {
  if (c.splitMode !== 'salary') return c;
  const total = c.salaryP1 + c.salaryP2;
  return total > 0 ? { ...c, p1: Math.round((c.salaryP1 / total) * 100) } : c;
};

export const mockService: FortivaService = {
  getKpis: () => delay(mock.kpis),
  getDashboardSeries: () => delay(mock.dashboardSeries),

  listMovements: (owner = 'todos') =>
    delay(owner === 'todos' ? movements : movements.filter((m) => m.owner === ownerFilterKey[owner])),

  createMovement: (input) => {
    const m: Movement = { ...input, id: uid() };
    movements = [m, ...movements];
    return delay(m);
  },
  updateMovement: (id, input) => {
    movements = movements.map((m) => (m.id === id ? { ...m, ...input } : m));
    return delay(movements.find((m) => m.id === id) as Movement);
  },
  deleteMovement: (id) => {
    movements = movements.filter((m) => m.id !== id);
    return delay(undefined);
  },

  listCategories: () => delay({ system, custom }),

  createCategory: (input) => {
    const c: Category = { ...input, id: uid(), kind: 'custom' };
    custom = [...custom, c];
    return delay(c);
  },
  updateCategory: (id, input) => {
    const apply = (c: Category) => (c.id === id ? { ...c, ...input } : c);
    system = system.map(apply);
    custom = custom.map(apply);
    return delay([...system, ...custom].find((c) => c.id === id) as Category);
  },
  deleteCategory: (id) => {
    custom = custom.filter((c) => c.id !== id);
    return delay(undefined);
  },

  listDebts: (filter = 'todas') => {
    if (filter === 'todas') return delay(debts);
    if (filter === 'compartidas') return delay(debts.filter((d) => d.owner === 'Pareja'));
    return delay(debts.filter((d) => d.owner === ownerFilterKey[filter]));
  },

  createDebt: (input) => {
    const d: Debt = { ...input, id: uid(), paid: 0 };
    debts = [...debts, d];
    return delay(d);
  },
  updateDebt: (id, input) => {
    debts = debts.map((d) => (d.id === id ? { ...d, ...input } : d));
    return delay(debts.find((d) => d.id === id) as Debt);
  },
  deleteDebt: (id) => {
    debts = debts.filter((d) => d.id !== id);
    return delay(undefined);
  },

  registerPayment: (debtId, amount) => {
    debts = debts.map((d) =>
      d.id === debtId ? { ...d, paid: Math.min(d.total, d.paid + amount) } : d,
    );
    return delay(debts.find((d) => d.id === debtId) as Debt);
  },

  listAssets: (): Promise<Asset[]> => delay(assets),
  createAsset: (input) => {
    const a: Asset = { ...input, id: uid() };
    assets = [...assets, a];
    return delay(a);
  },
  updateAsset: (id, input) => {
    assets = assets.map((a) => (a.id === id ? { ...a, ...input } : a));
    return delay(assets.find((a) => a.id === id) as Asset);
  },
  deleteAsset: (id) => {
    assets = assets.filter((a) => a.id !== id);
    return delay(undefined);
  },

  listReminders: (): Promise<Reminder[]> => delay(reminders),
  createReminder: (input) => {
    const r: Reminder = { ...input, id: uid() };
    reminders = [...reminders, r];
    return delay(r);
  },
  updateReminder: (id, input) => {
    reminders = reminders.map((r) => (r.id === id ? { ...r, ...input } : r));
    return delay(reminders.find((r) => r.id === id) as Reminder);
  },
  deleteReminder: (id) => {
    reminders = reminders.filter((r) => r.id !== id);
    return delay(undefined);
  },

  toggleReminderEmail: (id, enabled) => {
    reminders = reminders.map((r) => (r.id === id ? { ...r, email: enabled } : r));
    return delay(reminders.find((r) => r.id === id) as Reminder);
  },

  getAnnualSeries: () => delay(mock.annualSeries),
  getTopCategories: () => delay(mock.topCategories),

  getCoupleConfig: () => delay(withSalarySplit(couple)),
  updateCoupleConfig: (cfg) => {
    couple = withSalarySplit({ ...couple, ...cfg });
    return delay(couple);
  },

  getPricing: () => delay(mock.pricingPlans),
};
