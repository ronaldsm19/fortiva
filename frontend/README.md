# Fortiva — Frontend (Fase 1)

Recreación en React del template visual de Fortiva. **Datos mock**, sin backend real.
Listo para conmutar a la API en Fase 3 sin tocar las páginas.

## Stack
React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · React Router · Recharts · Lucide.

## Correr

```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

`npm run build` compila con `tsc` y genera `dist/`.

## Estructura

```
src/
  components/   Design system (Button, Card, KpiCard, Modal, nav/…)
  layouts/      PublicLayout, AppLayout (sidebar + topbar + drawer móvil)
  pages/
    public/     Landing, Register, Login
    app/        Dashboard, Movimientos, Categorias, Pareja, Deudas,
                Patrimonio, Recordatorios, Reporte
  modals/       MovementModal, DebtModal, PaymentModal
  context/      Theme, Currency, Month, Auth (mock)
  services/     Capa de datos intercambiable (mock ↔ api) — ver abajo
  data/         mock.ts (datos exactos del template)
  lib/          format.ts (fmt USD/CRC)
  styles/       globals.css (tokens claro/oscuro + keyframes)
  routes/       router.tsx
```

## Capa de servicios (clave para Fase 3)

Todas las páginas importan `import { service } from '@/services'`. El selector
(`src/services/index.ts`) elige la implementación según `VITE_API_MODE`:

- `mock` → `services/mock/mock.service.ts` (Fase 1, datos locales con CRUD en memoria).
- `api` → `services/api/api.service.ts` (Fase 3, consume el backend REST con `services/http.ts`).

Ambas cumplen la interfaz `FortivaService` (`services/service.interface.ts`) y los DTOs de
`services/types.ts`. **Cambiar de mock a API real no requiere tocar componentes.**

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_MODE` | `mock` (Fase 1) o `api` (Fase 3+) |
| `VITE_API_URL` | URL base del backend REST |
| `VITE_CRC_RATE` | Tasa mock USD→CRC (525) |

## Notas de diseño
- Tokens del README mapeados a variables CSS (`globals.css`) y a `tailwind.config.ts`.
- Toggle de tema cambia `data-theme` en `<html>` y persiste en `localStorage`.
- Toggle de moneda formatea sobre montos base en USD.
- Gráficos con Recharts (barras agrupadas ingreso/gasto, donut de patrimonio).
- Fuentes Manrope + Instrument Serif desde Google Fonts (`index.html`).
