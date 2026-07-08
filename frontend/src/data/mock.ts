/**
 * Datos semilla exactos del template Fortiva (Fase 1).
 * Fuente: Fortiva.dc.html (bloque `class Component`). Montos en USD (base).
 */
import type {
  Asset, Category, CoupleConfig, Debt, Kpi, Movement,
  MonthPoint, OwnerKey, PricingPlan, Reminder, TopCategory,
} from '@/services/types';

/** Identidad visual de cada persona (modo pareja). */
export const ownerMeta: Record<OwnerKey, { initial: string; grad: string; color: string }> = {
  Ana: { initial: 'A', grad: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', color: 'var(--accent)' },
  Luis: { initial: 'L', grad: 'linear-gradient(135deg,var(--pos),#1f6b50)', color: 'var(--pos)' },
  Pareja: { initial: 'AL', grad: 'linear-gradient(135deg,var(--accent),var(--pos))', color: 'var(--gold)' },
};

/** KPIs del dashboard (mes actual). */
export const dashboardBase = { ingresos: 5520, gastos: 3480, ahorro: 900 };

export const kpis: Kpi[] = [
  { label: 'Ingresos', value: 5520, icon: 'arrow-down-left', color: 'var(--pos)', bg: 'var(--pos-weak)', delta: '+8% vs mes previo', deltaColor: 'var(--pos)' },
  { label: 'Gastos', value: 3480, icon: 'arrow-up-right', color: 'var(--neg)', bg: 'var(--neg-weak)', delta: '-3% vs mes previo', deltaColor: 'var(--pos)' },
  { label: 'Disponible', value: 2040, icon: 'wallet', color: 'var(--accent)', bg: 'var(--accent-weak)', delta: '37% de ingresos', deltaColor: 'var(--text-3)' },
  { label: 'Ahorro', value: 900, icon: 'piggy-bank', color: 'var(--gold)', bg: 'color-mix(in srgb,var(--gold) 14%,transparent)', delta: 'Meta: $1,000', deltaColor: 'var(--text-3)' },
];

/** Serie 6 meses (dashboard). */
export const dashboardSeries: MonthPoint[] = [
  { m: 'Feb', i: 4800, g: 3600 },
  { m: 'Mar', i: 5100, g: 3300 },
  { m: 'Abr', i: 4950, g: 3800 },
  { m: 'May', i: 5300, g: 3200 },
  { m: 'Jun', i: 5200, g: 3550 },
  { m: 'Jul', i: 5520, g: 3480 },
];

export const movements: Movement[] = [
  { id: 'm1', date: '05 Jul', cat: 'Salario', type: 'income', amount: 5200, desc: 'Salario mensual', scope: 'Compartido', owner: 'Pareja', icon: 'briefcase' },
  { id: 'm2', date: '04 Jul', cat: 'Gastos fijos', type: 'expense', amount: 1200, desc: 'Alquiler', scope: 'Compartido', owner: 'Pareja', icon: 'home' },
  { id: 'm3', date: '03 Jul', cat: 'Gastos afuera', type: 'expense', amount: 68, desc: 'Cena restaurante', scope: 'Individual', owner: 'Ana', icon: 'utensils' },
  { id: 'm4', date: '02 Jul', cat: 'Inversión', type: 'expense', amount: 500, desc: 'Aporte S&P 500', scope: 'Compartido', owner: 'Pareja', icon: 'trending-up' },
  { id: 'm5', date: '02 Jul', cat: 'Gastos fijos', type: 'expense', amount: 45, desc: 'Internet Kölbi', scope: 'Compartido', owner: 'Pareja', icon: 'wifi' },
  { id: 'm6', date: '01 Jul', cat: 'Fondo de seguridad', type: 'expense', amount: 300, desc: 'Ahorro emergencia', scope: 'Compartido', owner: 'Pareja', icon: 'shield' },
  { id: 'm7', date: '01 Jul', cat: 'Gastos afuera', type: 'expense', amount: 52, desc: 'Súper extra', scope: 'Individual', owner: 'Luis', icon: 'shopping-cart' },
  { id: 'm8', date: '28 Jun', cat: 'Ingreso extra', type: 'income', amount: 320, desc: 'Freelance diseño', scope: 'Individual', owner: 'Ana', icon: 'sparkles' },
  { id: 'm9', date: '27 Jun', cat: 'Gastos afuera', type: 'expense', amount: 38, desc: 'Café con clientes', scope: 'Individual', owner: 'Luis', icon: 'coffee' },
];

export const systemCategories: Category[] = [
  { id: 'c1', name: 'Gastos fijos', icon: 'home', color: '#2456C9', kind: 'system', spent: 1245, budget: 1600 },
  { id: 'c2', name: 'Inversión', icon: 'trending-up', color: '#2E8B6B', kind: 'system', spent: 500, budget: 600 },
  { id: 'c3', name: 'Fondo de seguridad', icon: 'shield', color: '#A9822F', kind: 'system', spent: 300, budget: 300 },
  { id: 'c4', name: 'Gastos afuera', icon: 'utensils', color: '#C0503B', kind: 'system', spent: 420, budget: 400 },
];

export const customCategories: Category[] = [
  { id: 'c5', name: 'Educación', icon: 'graduation-cap', color: '#7C4DBF', kind: 'custom', spent: 180, budget: 250 },
  { id: 'c6', name: 'Salud', icon: 'heart-pulse', color: '#C0398A', kind: 'custom', spent: 95, budget: 200 },
  { id: 'c7', name: 'Mascota', icon: 'paw-print', color: '#3E8AA9', kind: 'custom', spent: 60, budget: 120 },
];

export const debts: Debt[] = [
  { id: 'd1', name: 'Tarjeta de crédito', issuer: 'BAC', paid: 1200, total: 3000, monthly: 250, rate: '24% anual', due: '20 Jul', owner: 'Pareja', icon: 'credit-card' },
  { id: 'd2', name: 'Préstamo de auto', issuer: 'Banco Nacional', paid: 6500, total: 12000, monthly: 320, rate: '9% anual', due: '05 Jul', owner: 'Ana', icon: 'car' },
  { id: 'd3', name: 'Financiamiento laptop', issuer: 'Gollo', paid: 900, total: 1500, monthly: 150, rate: '0% (promo)', due: '15 Jul', owner: 'Luis', icon: 'laptop' },
  { id: 'd4', name: 'Préstamo estudiantil', issuer: 'Conape', paid: 2400, total: 5000, monthly: 120, rate: '6% anual', due: '28 Jul', owner: 'Luis', icon: 'graduation-cap' },
];

export const assets: Asset[] = [
  { id: 'a1', name: 'Efectivo', amount: 1200, icon: 'banknote', color: '#A9822F', isAsset: true },
  { id: 'a2', name: 'Cuenta bancaria', amount: 8400, icon: 'building-2', color: '#2456C9', isAsset: true },
  { id: 'a3', name: 'Inversiones', amount: 15200, icon: 'trending-up', color: '#2E8B6B', isAsset: true },
  { id: 'a4', name: 'Ahorros', amount: 6300, icon: 'piggy-bank', color: '#7C4DBF', isAsset: true },
  { id: 'a5', name: 'Deuda total', amount: -9600, icon: 'trending-down', color: '#C0503B', isAsset: false },
];

/** Colores de los segmentos del donut (solo activos positivos). */
export const donutColors = ['#A9822F', '#2456C9', '#2E8B6B', '#7C4DBF'];

export const reminders: Reminder[] = [
  { id: 'r1', name: 'Electricidad', issuer: 'ICE', amount: 78, due: '08 Jul', status: 'pendiente', email: true, icon: 'zap' },
  { id: 'r2', name: 'Agua', issuer: 'AyA', amount: 24, due: '10 Jul', status: 'pendiente', email: true, icon: 'droplet' },
  { id: 'r3', name: 'Internet', issuer: 'Kölbi', amount: 45, due: '12 Jul', status: 'pagado', email: true, icon: 'wifi' },
  { id: 'r4', name: 'Tarjeta de crédito', issuer: 'BAC', amount: 210, due: '20 Jul', status: 'pendiente', email: false, icon: 'credit-card' },
];

/** Reporte anual — 12 meses. */
export const annualSeries: MonthPoint[] = [
  { m: 'Ene', i: 4600, g: 3900 }, { m: 'Feb', i: 4800, g: 3600 }, { m: 'Mar', i: 5100, g: 3300 },
  { m: 'Abr', i: 4950, g: 3800 }, { m: 'May', i: 5300, g: 3200 }, { m: 'Jun', i: 5200, g: 3550 },
  { m: 'Jul', i: 5520, g: 3480 }, { m: 'Ago', i: 5000, g: 3700 }, { m: 'Sep', i: 5250, g: 3400 },
  { m: 'Oct', i: 5400, g: 3600 }, { m: 'Nov', i: 5600, g: 3900 }, { m: 'Dic', i: 6200, g: 4400 },
];

export const topCategories: TopCategory[] = [
  { name: 'Gastos fijos', amount: 14520, pct: 38, color: '#2456C9' },
  { name: 'Inversión', amount: 6000, pct: 16, color: '#2E8B6B' },
  { name: 'Gastos afuera', amount: 5040, pct: 13, color: '#C0503B' },
  { name: 'Fondo de seguridad', amount: 3600, pct: 9, color: '#A9822F' },
  { name: 'Educación', amount: 2160, pct: 6, color: '#7C4DBF' },
];

export const coupleDefault: CoupleConfig = {
  coupleMode: true,
  splitMode: 'custom',
  p1: 60,
  sharedTotal: 2090,
  salaryP1: 3200,
  salaryP2: 2100,
};

export const pricingPlans: PricingPlan[] = [
  { name: 'Personal', price: '$0', desc: 'Para empezar a ordenar tus finanzas.', cta: 'Empezar gratis', featured: false, perks: ['Movimientos ilimitados', 'Categorías base', '1 usuario', 'Reporte mensual'] },
  { name: 'Hogar', price: '$6', desc: 'Para parejas y familias que deciden juntas.', cta: 'Prueba 7 días gratis', featured: true, perks: ['Todo lo de Personal', 'Modo pareja / familia', 'Recordatorios por correo', 'Deudas e inversiones', 'Reporte anual'] },
  { name: 'Patrimonio', price: '$12', desc: 'Para quienes gestionan inversiones activas.', cta: 'Prueba 7 días gratis', featured: false, perks: ['Todo lo de Hogar', 'Patrimonio avanzado', 'Múltiples cuentas', 'Exportar reportes', 'Soporte prioritario'] },
];

/** Usuario/hogar mock precargado (AuthContext Fase 1). */
export const mockUser = {
  fullName: 'Ana Rodríguez',
  accountName: 'Hogar Rodríguez',
  initials: 'AR',
  email: 'ana@fortiva.app',
};
