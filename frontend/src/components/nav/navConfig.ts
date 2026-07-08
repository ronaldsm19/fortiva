/** Items del sidebar de la app, en orden. `to` es la ruta de React Router. */
export interface NavItem {
  id: string;
  label: string;
  icon: string; // nombre lucide
  to: string;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Panel', icon: 'layout-dashboard', to: '/app/dashboard' },
  { id: 'movimientos', label: 'Movimientos', icon: 'arrow-left-right', to: '/app/movimientos' },
  { id: 'categorias', label: 'Categorías', icon: 'shapes', to: '/app/categorias' },
  { id: 'pareja', label: 'Pareja / Familia', icon: 'heart-handshake', to: '/app/pareja' },
  { id: 'deudas', label: 'Deudas', icon: 'trending-down', to: '/app/deudas' },
  { id: 'inversiones', label: 'Patrimonio', icon: 'landmark', to: '/app/patrimonio' },
  { id: 'recordatorios', label: 'Recordatorios', icon: 'bell', to: '/app/recordatorios' },
  { id: 'reporte', label: 'Reporte anual', icon: 'bar-chart-3', to: '/app/reporte' },
];

export const pageTitles: Record<string, string> = {
  dashboard: 'Panel mensual',
  movimientos: 'Movimientos',
  categorias: 'Categorías',
  pareja: 'Pareja / Familia',
  deudas: 'Deudas',
  patrimonio: 'Patrimonio',
  recordatorios: 'Recordatorios',
  reporte: 'Reporte anual',
  cuenta: 'Cuenta',
};
