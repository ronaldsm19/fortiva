/**
 * DTOs compartidos entre frontend y backend (fuente de verdad del contrato).
 * En Fase 3 el backend expone exactamente estos shapes; las páginas no cambian.
 * NOTA: aquí los montos van en USD (number) por simplicidad del template.
 * El backend los entregará como *_cents (int) y el mapper convertirá /100.
 */

export type OwnerKey = 'Ana' | 'Luis' | 'Pareja';
export type MovementType = 'income' | 'expense';
export type Scope = 'Compartido' | 'Individual';

export interface Movement {
  id: string;
  date: string; // "05 Jul"
  cat: string;
  type: MovementType;
  amount: number; // USD
  desc: string;
  scope: Scope;
  owner: OwnerKey;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: 'system' | 'custom';
  spent: number;
  budget: number;
}

export interface Debt {
  id: string;
  name: string;
  issuer: string;
  paid: number;
  total: number;
  monthly: number;
  rate: string;
  due: string;
  owner: OwnerKey;
  icon: string;
}

export interface Reminder {
  id: string;
  name: string;
  issuer: string;
  amount: number;
  due: string;
  status: 'pendiente' | 'pagado';
  email: boolean;
  icon: string;
}

export interface Asset {
  id: string;
  name: string;
  amount: number; // negativo = pasivo
  icon: string;
  color: string;
  isAsset: boolean;
}

export interface MonthPoint {
  m: string;
  i: number; // income
  g: number; // gasto
}

export interface TopCategory {
  name: string;
  amount: number;
  pct: number;
  color: string;
}

export interface Kpi {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
  delta: string;
  deltaColor: string;
}

export interface CoupleConfig {
  coupleMode: boolean;
  splitMode: '50' | 'custom' | 'salary';
  p1: number; // % de Ana
  sharedTotal: number;
  salaryP1: number; // salario de Ana (mes actual); solo relevante en modo 'salary'
  salaryP2: number; // salario de Luis (mes actual); solo relevante en modo 'salary'
}

export interface PricingPlan {
  name: string;
  price: string;
  desc: string;
  cta: string;
  featured: boolean;
  perks: string[];
}
