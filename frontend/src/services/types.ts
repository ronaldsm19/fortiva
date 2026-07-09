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
  amount: number; // USD (canónico). En el payload de creación = monto en `currency`.
  amountCrc?: number; // valor en colones (congelado al crear)
  currency?: 'USD' | 'CRC'; // moneda en la que se ingresó
  fxBuy?: number | null; // TC compra congelado
  fxSell?: number | null; // TC venta congelado
  fxDate?: string | null; // fecha/hora del TC (ISO)
  desc: string;
  scope: Scope;
  owner: OwnerKey;
  icon: string;
}

/** Tipo de cambio actual (colones por USD) — BCCR / ARI Casa de Cambio. */
export interface FxRate {
  buy: number; // compra
  sell: number; // venta
  date: string; // ISO
  source?: string;
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
  paid: number; // USD
  total: number; // USD (canónico). En el payload de creación = total en `currency`.
  monthly: number; // USD (canónico). En el payload de creación = cuota en `currency`.
  totalCrc?: number; // total en colones (congelado al crear)
  monthlyCrc?: number; // cuota en colones (congelada al crear)
  currency?: 'USD' | 'CRC'; // moneda en la que se ingresó
  fxBuy?: number | null; // TC compra congelado
  fxSell?: number | null; // TC venta congelado (se usa para deudas)
  fxDate?: string | null; // fecha/hora del TC (ISO)
  rate: string;
  due: string;
  owner: OwnerKey;
  icon: string;
}

export interface Reminder {
  id: string;
  name: string;
  issuer: string;
  amount: number; // USD (canónico). En el payload de creación = monto en `currency`.
  amountCrc?: number; // valor en colones (congelado al crear)
  currency?: 'USD' | 'CRC'; // moneda en la que se ingresó
  fxBuy?: number | null; // TC compra congelado
  fxSell?: number | null; // TC venta congelado (se usa para recordatorios)
  fxDate?: string | null; // fecha/hora del TC (ISO)
  due: string;
  status: 'pendiente' | 'pagado';
  email: boolean;
  icon: string;
}

export interface Asset {
  id: string;
  name: string;
  amount: number; // USD (canónico); negativo = pasivo. En creación = monto en `currency`.
  amountCrc?: number; // valor en colones (congelado al crear)
  currency?: 'USD' | 'CRC'; // moneda en la que se ingresó
  fxBuy?: number | null; // TC compra congelado
  fxSell?: number | null; // TC venta congelado (se usa para activos)
  fxDate?: string | null; // fecha/hora del TC (ISO)
  icon: string;
  color: string;
  isAsset: boolean;
}

export interface MonthPoint {
  m: string;
  i: number; // income (USD)
  g: number; // gasto (USD)
  iCrc?: number; // income en colones (TC histórico por movimiento)
  gCrc?: number; // gasto en colones (TC histórico por movimiento)
}

export interface TopCategory {
  name: string;
  amount: number; // USD
  amountCrc?: number; // colones (TC histórico por movimiento)
  pct: number;
  color: string;
}

export interface Kpi {
  label: string;
  value: number; // USD
  valueCrc?: number; // colones (TC histórico por movimiento)
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
