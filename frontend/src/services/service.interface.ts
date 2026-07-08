import type {
  Asset, Category, CoupleConfig, Debt, Kpi, Movement,
  MonthPoint, PricingPlan, Reminder, TopCategory,
} from './types';

export type MovementFilter = 'todos' | 'ana' | 'luis' | 'pareja';
export type DebtFilter = 'todas' | 'ana' | 'luis' | 'compartidas';

/**
 * Contrato único de la capa de datos. `mock` y `api` lo satisfacen → las páginas
 * nunca cambian. Los parámetros `month` (0–11) y `year` filtran por mes cuando el
 * backend lo soporta (mock los ignora).
 */
export interface FortivaService {
  // Dashboard
  getKpis(month?: number, year?: number): Promise<Kpi[]>;
  getDashboardSeries(month?: number, year?: number): Promise<MonthPoint[]>;

  // Movimientos
  listMovements(owner?: MovementFilter, month?: number, year?: number): Promise<Movement[]>;
  createMovement(input: Omit<Movement, 'id'>): Promise<Movement>;
  updateMovement(id: string, input: Partial<Omit<Movement, 'id'>>): Promise<Movement>;
  deleteMovement(id: string): Promise<void>;

  // Categorías
  listCategories(): Promise<{ system: Category[]; custom: Category[] }>;
  createCategory(input: Omit<Category, 'id' | 'kind'>): Promise<Category>;
  updateCategory(id: string, input: Partial<Omit<Category, 'id' | 'kind'>>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Deudas
  listDebts(filter?: DebtFilter): Promise<Debt[]>;
  createDebt(input: Omit<Debt, 'id' | 'paid'>): Promise<Debt>;
  updateDebt(id: string, input: Partial<Omit<Debt, 'id' | 'paid'>>): Promise<Debt>;
  deleteDebt(id: string): Promise<void>;
  registerPayment(debtId: string, amount: number): Promise<Debt>;

  // Patrimonio / Activos
  listAssets(): Promise<Asset[]>;
  createAsset(input: Omit<Asset, 'id'>): Promise<Asset>;
  updateAsset(id: string, input: Partial<Omit<Asset, 'id'>>): Promise<Asset>;
  deleteAsset(id: string): Promise<void>;

  // Recordatorios
  listReminders(): Promise<Reminder[]>;
  createReminder(input: Omit<Reminder, 'id'>): Promise<Reminder>;
  updateReminder(id: string, input: Partial<Omit<Reminder, 'id'>>): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
  toggleReminderEmail(id: string, enabled: boolean): Promise<Reminder>;

  // Reporte anual
  getAnnualSeries(year?: number): Promise<MonthPoint[]>;
  getTopCategories(year?: number): Promise<TopCategory[]>;

  // Pareja
  getCoupleConfig(): Promise<CoupleConfig>;
  updateCoupleConfig(cfg: Partial<CoupleConfig>): Promise<CoupleConfig>;

  // Landing
  getPricing(): Promise<PricingPlan[]>;
}
