import type { FortivaService } from '../service.interface';
import type { Asset, Category, CoupleConfig, Debt, Movement, Reminder } from '../types';
import * as mock from '@/data/mock';

/** Latencia simulada para que el swap a red se sienta idéntico. */
const delay = <T>(v: T, ms = 120): Promise<T> =>
  new Promise((r) => setTimeout(() => r(v), ms));

const uid = () => Math.random().toString(36).slice(2, 9);

/** TC mock (colones por USD) — compra ingresos, venta gastos. */
const MOCK_FX = { buy: 451.6, sell: 457.47 };

/**
 * Deriva USD/colones de un monto ingresado en `currency` con el TC de **venta** (deudas,
 * recordatorios y activos no son ingreso/gasto). Réplica de `amountsFromCurrency` del backend.
 * Soporta montos negativos (pasivos).
 */
const fxSplit = (amount: number, currency: 'USD' | 'CRC', sell = MOCK_FX.sell) =>
  currency === 'CRC'
    ? { usd: amount / sell, crc: Math.round(amount) }
    : { usd: amount, crc: Math.round(amount * sell) };

/** Campos de TC congelado que se guardan al crear (mock). */
const frozenFx = () => ({ fxBuy: MOCK_FX.buy, fxSell: MOCK_FX.sell, fxDate: new Date().toISOString() });

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
    const cur = input.currency ?? 'USD';
    const rate = input.type === 'income' ? MOCK_FX.buy : MOCK_FX.sell;
    const amountUsd = cur === 'CRC' ? input.amount / rate : input.amount;
    const amountCrc = cur === 'CRC' ? Math.round(input.amount) : Math.round(input.amount * rate);
    const m: Movement = {
      ...input, id: uid(), currency: cur, amount: amountUsd, amountCrc,
      fxBuy: MOCK_FX.buy, fxSell: MOCK_FX.sell, fxDate: new Date().toISOString(),
    };
    movements = [m, ...movements];
    return delay(m);
  },
  updateMovement: (id, input) => {
    movements = movements.map((m) => {
      if (m.id !== id) return m;
      const merged: Movement = { ...m, ...input };
      // recomputa USD/colones si cambió monto, moneda o tipo (igual que el backend)
      if (input.amount !== undefined || input.currency !== undefined || input.type !== undefined) {
        const cur = merged.currency ?? 'USD';
        const rate = merged.type === 'income' ? MOCK_FX.buy : MOCK_FX.sell;
        const raw = input.amount ?? (cur === 'CRC' ? (m.amountCrc ?? 0) : m.amount);
        merged.amount = cur === 'CRC' ? raw / rate : raw;
        merged.amountCrc = cur === 'CRC' ? Math.round(raw) : Math.round(raw * rate);
      }
      return merged;
    });
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
    const cur = input.currency ?? 'USD';
    const total = fxSplit(input.total, cur);
    const monthly = fxSplit(input.monthly, cur);
    const d: Debt = {
      ...input, id: uid(), paid: 0, currency: cur,
      total: total.usd, totalCrc: total.crc,
      monthly: monthly.usd, monthlyCrc: monthly.crc,
      ...frozenFx(),
    };
    debts = [...debts, d];
    return delay(d);
  },
  updateDebt: (id, input) => {
    debts = debts.map((d) => {
      if (d.id !== id) return d;
      const merged: Debt = { ...d, ...input };
      // recomputa USD/colones si cambió total, cuota o moneda (igual que el backend)
      if (input.total !== undefined || input.monthly !== undefined || input.currency !== undefined) {
        const cur = merged.currency ?? 'USD';
        const sell = merged.fxSell ?? MOCK_FX.sell;
        const rawTotal = input.total ?? (cur === 'CRC' ? (d.totalCrc ?? 0) : d.total);
        const rawMonthly = input.monthly ?? (cur === 'CRC' ? (d.monthlyCrc ?? 0) : d.monthly);
        const total = fxSplit(rawTotal, cur, sell);
        const monthly = fxSplit(rawMonthly, cur, sell);
        merged.total = total.usd; merged.totalCrc = total.crc;
        merged.monthly = monthly.usd; merged.monthlyCrc = monthly.crc;
      }
      return merged;
    });
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
    const cur = input.currency ?? 'USD';
    const { usd, crc } = fxSplit(input.amount, cur); // input.amount puede ser negativo (pasivo)
    const a: Asset = { ...input, id: uid(), currency: cur, amount: usd, amountCrc: crc, ...frozenFx() };
    assets = [...assets, a];
    return delay(a);
  },
  updateAsset: (id, input) => {
    assets = assets.map((a) => {
      if (a.id !== id) return a;
      const merged: Asset = { ...a, ...input };
      if (input.amount !== undefined || input.currency !== undefined) {
        const cur = merged.currency ?? 'USD';
        const sell = merged.fxSell ?? MOCK_FX.sell;
        const raw = input.amount ?? (cur === 'CRC' ? (a.amountCrc ?? 0) : a.amount);
        const { usd, crc } = fxSplit(raw, cur, sell);
        merged.amount = usd; merged.amountCrc = crc;
      }
      return merged;
    });
    return delay(assets.find((a) => a.id === id) as Asset);
  },
  deleteAsset: (id) => {
    assets = assets.filter((a) => a.id !== id);
    return delay(undefined);
  },

  listReminders: (): Promise<Reminder[]> => delay(reminders),
  createReminder: (input) => {
    const cur = input.currency ?? 'USD';
    const { usd, crc } = fxSplit(input.amount, cur);
    const r: Reminder = { ...input, id: uid(), currency: cur, amount: usd, amountCrc: crc, ...frozenFx() };
    reminders = [...reminders, r];
    return delay(r);
  },
  updateReminder: (id, input) => {
    reminders = reminders.map((r) => {
      if (r.id !== id) return r;
      const merged: Reminder = { ...r, ...input };
      if (input.amount !== undefined || input.currency !== undefined) {
        const cur = merged.currency ?? 'USD';
        const sell = merged.fxSell ?? MOCK_FX.sell;
        const raw = input.amount ?? (cur === 'CRC' ? (r.amountCrc ?? 0) : r.amount);
        const { usd, crc } = fxSplit(raw, cur, sell);
        merged.amount = usd; merged.amountCrc = crc;
      }
      return merged;
    });
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

  getFxRate: () =>
    delay({ buy: MOCK_FX.buy, sell: MOCK_FX.sell, date: new Date().toISOString(), source: 'mock' }),
};
