# PLAN DE IMPLEMENTACIÓN — Fortiva

> SaaS premium de finanzas personales y familiares. Este documento convierte el
> template visual generado por Claude Design (`Fortiva.dc.html`, `AuthShell.dc.html`)
> en una aplicación SaaS real, multi-tenant, con backend propio y base de datos.

**Idioma UI:** Español · **Doble moneda:** USD / ₡ (CRC) · **Base monetaria interna:** USD.

---

## 1. Arquitectura general

```
┌──────────────────────────────────────────────────────────────────────┐
│                            NAVEGADOR                                    │
│  React 18 + TS + Vite + Tailwind + Framer Motion + Recharts + Router   │
│                                                                        │
│   pages/public (Landing, Login, Register)                              │
│   pages/app    (Dashboard, Movimientos, Categorías, Pareja, Deudas,    │
│                 Patrimonio, Recordatorios, Reporte)                     │
│                        │                                               │
│         services/  ←── capa de acceso a datos (mock ↔ API real)        │
│                        │  (VITE_API_MODE = mock | api)                  │
└────────────────────────┼───────────────────────────────────────────────┘
                         │  HTTPS / JSON  (Bearer access token)
┌────────────────────────┼───────────────────────────────────────────────┐
│                    BACKEND REST API                                     │
│  Node.js + TypeScript + Express + Zod                                   │
│                                                                        │
│  routes → controllers → services/use-cases → repositories → Prisma     │
│  middlewares: auth (JWT), tenant, errorHandler, validate, rateLimit    │
│  Swagger/OpenAPI en /docs                                               │
└────────────────────────┼───────────────────────────────────────────────┘
                         │  Prisma Client (provider: mongodb)
┌────────────────────────┼───────────────────────────────────────────────┐
│                 MongoDB — Atlas (replica set)                           │
│  Doc-per-tenant (account_id en cada documento)                          │
│  Auth propia (JWT) — NO se usa auth de terceros                         │
└──────────────────────────────────────────────────────────────────────┘
```

### Decisiones clave
- **Base de datos MongoDB** vía Prisma (`provider = "mongodb"`). Se usa como base gestionada
  (Atlas). No se usa auth de terceros: la autenticación es propia con JWT (access + refresh).
- **Auth propia con JWT** en el backend. Esto da control total sobre el modelo multi-tenant y el trial.
- **Multi-tenant por campo `account_id`** en cada documento (misma base, colecciones compartidas).
  Cada request autenticado resuelve el `account_id` del usuario y **todos** los repositorios
  filtran por él. Simple de operar y permite el modo pareja (varios usuarios → misma `account`).
- **Todos los montos se guardan en centavos USD (`int`)** para evitar errores de floating
  point. El formateo a USD/CRC ocurre en el frontend (tasa configurable).
- **Capa de servicios en el frontend** con dos implementaciones intercambiables (mock / API)
  detrás de la misma interfaz TypeScript. Fase 1 usa mock; Fase 3 conmuta a API sin tocar
  las páginas.
- **Express** sobre Fastify: ecosistema más maduro, integración trivial con Swagger y menos
  fricción para el equipo. (Fastify quedaría como optimización futura si el throughput lo pide.)

---

## 2. Estructura de carpetas — Frontend (`/frontend`)

```
frontend/
├─ index.html
├─ .env.example
├─ vite.config.ts
├─ tailwind.config.ts
├─ postcss.config.js
├─ tsconfig.json
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ components/            # UI reutilizable (design system)
   │   ├─ Button.tsx  Card.tsx  Badge.tsx  Input.tsx  Select.tsx
   │   ├─ Switch.tsx  Modal.tsx  ProgressBar.tsx  EmptyState.tsx
   │   ├─ KpiCard.tsx  ChartCard.tsx  CategoryCard.tsx  PricingCard.tsx
   │   ├─ TransactionRow.tsx  OwnerAvatar.tsx
   │   ├─ CurrencyToggle.tsx  ThemeToggle.tsx  MonthSelector.tsx
   │   └─ nav/  Sidebar.tsx  Topbar.tsx  MobileNav.tsx
   ├─ layouts/
   │   ├─ PublicLayout.tsx   AppLayout.tsx
   ├─ pages/
   │   ├─ public/  Landing.tsx  Register.tsx  Login.tsx
   │   └─ app/     Dashboard.tsx  Movimientos.tsx  Categorias.tsx
   │               Pareja.tsx  Deudas.tsx  Patrimonio.tsx
   │               Recordatorios.tsx  Reporte.tsx
   ├─ modals/       MovementModal.tsx  DebtModal.tsx  PaymentModal.tsx
   ├─ routes/       router.tsx
   ├─ context/      ThemeContext.tsx  CurrencyContext.tsx  MonthContext.tsx  AuthContext.tsx
   ├─ services/     # ← capa de datos intercambiable
   │   ├─ http.ts               # cliente fetch con auth/refresh (Fase 3)
   │   ├─ types.ts              # DTOs compartidos con el backend
   │   ├─ index.ts              # selector mock|api según VITE_API_MODE
   │   ├─ mock/                 # implementación mock (Fase 1)
   │   │   ├─ movements.mock.ts  categories.mock.ts  debts.mock.ts ...
   │   └─ api/                  # implementación real (Fase 3)
   │       ├─ movements.api.ts   categories.api.ts  debts.api.ts ...
   ├─ data/         mock.ts      # datos semilla exactos del template
   ├─ lib/          format.ts    # fmt(usd, currency), fechas, helpers
   └─ styles/       globals.css  # tokens (CSS vars), fuentes, keyframes
```

---

## 3. Estructura de carpetas — Backend (`/backend`)

```
backend/
├─ .env.example
├─ package.json  tsconfig.json
├─ prisma/
│   ├─ schema.prisma           # provider = mongodb (se aplica con `db push`)
│   └─ seed.ts                 # categorías base + usuario demo
├─ docs/
│   └─ data-model.md           # referencia de colecciones e índices MongoDB
└─ src/
   ├─ server.ts                # bootstrap Express
   ├─ app.ts                   # middlewares + montaje de routers + Swagger
   ├─ config/
   │   ├─ env.ts               # validación de env con Zod
   │   ├─ prisma.ts            # PrismaClient singleton
   │   └─ swagger.ts           # OpenAPI spec
   ├─ modules/                 # un folder por dominio
   │   ├─ auth/
   │   │   ├─ auth.routes.ts  auth.controller.ts  auth.service.ts
   │   │   ├─ auth.repository.ts  auth.schemas.ts
   │   ├─ accounts/            # tenant familiar (cuenta) + miembros
   │   ├─ users/               # perfil, me
   │   ├─ categories/
   │   ├─ movements/
   │   ├─ debts/
   │   ├─ reminders/
   │   ├─ networth/            # patrimonio / activos
   │   ├─ couple/              # config modo pareja / split
   │   └─ reports/             # reporte anual (agregaciones)
   ├─ domain/                  # tipos/entidades y reglas puras
   ├─ middlewares/
   │   ├─ auth.middleware.ts   # verifica access token → req.user
   │   ├─ tenant.middleware.ts # resuelve req.accountId
   │   ├─ validate.ts          # valida body/query/params con Zod
   │   ├─ error.middleware.ts  # AppError → respuesta JSON uniforme
   │   └─ rateLimit.ts
   ├─ lib/
   │   ├─ jwt.ts  hash.ts  AppError.ts  trial.ts
   └─ types/                   # augmentación de Express Request
```

**Arquitectura por capas (flujo de un request):**
`route` (define path + middlewares + valida) → `controller` (traduce HTTP ↔ dominio) →
`service/use-case` (regla de negocio, transacciones) → `repository` (Prisma, filtra por
`accountId`) → DB. Los `schemas` (Zod) validan entrada; los `domain models` son los tipos puros.

---

## 4. Modelo de datos (MongoDB)

Colecciones multi-tenant por `account_id`. Montos en **centavos USD (`int`)**. IDs `ObjectId`.
Cada "tabla" de abajo es una **colección**; los `(pk)`/`(fk)` describen la relación lógica
(MongoDB no tiene FKs nativas — las emula Prisma). Se aplica con `prisma db push`.

```
accounts            # el "hogar" = tenant
  id (ObjectId, _id)
  name              # "Hogar Rodríguez"
  plan              # 'personal' | 'hogar' | 'patrimonio'
  couple_mode       # bool
  split_mode        # '50' | 'custom'
  split_p1_pct      # int 0..100 (% de la persona 1)
  currency_pref     # 'USD' | 'CRC'
  trial_ends_at     # timestamptz null hasta primer login
  status            # 'trialing' | 'active' | 'past_due' | 'canceled'
  created_at, updated_at

users
  id (uuid, pk)
  account_id (fk → accounts) 
  email (unique)
  password_hash
  full_name
  national_id       # cédula
  phone
  role              # 'admin' | 'member'   (admin = creador)
  person_key        # 'ana' | 'luis' | null  → identidad en modo pareja (P1/P2)
  must_change_pw    # bool (primer ingreso)
  last_login_at     # se usa para arrancar el trial
  created_at, updated_at

refresh_tokens
  id (uuid, pk)
  user_id (fk → users)
  token_hash        # hash del refresh token
  expires_at
  revoked_at
  created_at

invitations         # invitar pareja por correo
  id (uuid, pk)
  account_id (fk)
  email
  token (unique)
  role
  accepted_at
  expires_at
  created_at

categories
  id (uuid, pk)
  account_id (fk)   # null-safe: sistema se copia por cuenta en el seed de la cuenta
  name
  icon              # nombre lucide
  color             # hex
  kind              # 'system' | 'custom'
  budget_cents      # presupuesto mensual (int, opcional)
  created_at, updated_at
  UNIQUE(account_id, name)

movements
  id (uuid, pk)
  account_id (fk)
  category_id (fk → categories, null)
  user_id (fk → users, null)   # quién lo registró
  type              # 'income' | 'expense'
  amount_cents      # int USD
  description
  occurred_on       # date
  scope             # 'shared' | 'individual'
  owner_key         # 'ana' | 'luis' | 'pareja'
  icon
  created_at, updated_at
  INDEX(account_id, occurred_on)

debts
  id (uuid, pk)
  account_id (fk)
  name
  issuer            # entidad
  owner_key         # 'ana' | 'luis' | 'pareja'
  total_cents       # int
  paid_cents        # int (acumulado por payments)
  monthly_cents     # cuota mensual
  rate              # texto "24% anual"
  due_date          # date
  icon
  created_at, updated_at

debt_payments
  id (uuid, pk)
  debt_id (fk → debts)
  account_id (fk)
  amount_cents
  paid_on           # date
  method            # 'transfer' | 'debit' | 'cash' | 'sinpe'
  created_at

reminders
  id (uuid, pk)
  account_id (fk)
  name
  issuer
  amount_cents
  due_date          # date
  status            # 'pending' | 'paid'
  email_enabled     # bool (recordatorio por correo)
  icon
  created_at, updated_at

assets              # patrimonio / dónde tengo mi dinero
  id (uuid, pk)
  account_id (fk)
  name
  amount_cents      # positivo = activo; el pasivo (deuda) se deriva de debts
  icon
  color
  is_asset          # bool
  created_at, updated_at
```

Relaciones: `accounts 1—N users, categories, movements, debts, reminders, assets`;
`debts 1—N debt_payments`; `users 1—N refresh_tokens`. **Toda** query lleva `WHERE account_id = $tenant`.

---

## 5. Endpoints REST por módulo

Prefijo `/api/v1`. Auth vía `Authorization: Bearer <access>`. Respuesta uniforme `{ data }` / `{ error }`.

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Crea cuenta (tenant) + usuario admin. Devuelve tokens. Envía invitación si aplica. |
| POST | `/auth/login` | Login. En el **primer login** setea `trial_ends_at = now()+7d`. Devuelve tokens. |
| POST | `/auth/refresh` | Rota refresh token → nuevo access+refresh. |
| POST | `/auth/logout` | Revoca refresh token. |
| GET  | `/me` | Perfil del usuario + cuenta + estado de trial. |

### Accounts / Couple (tenant)
| GET | `/account` | Datos de la cuenta (plan, trial, couple config). |
| PATCH | `/account` | Editar nombre, `currency_pref`, plan. |
| GET/PATCH | `/account/couple` | `coupleMode`, `splitMode` (`fifty`/`custom`/`salary`), `splitP1Pct`. En `salary` el `splitP1Pct` se deriva de los ingresos del mes por persona; devuelve `salaryP1`/`salaryP2`. |
| GET | `/account/members` | Miembros del hogar. |
| POST | `/account/invitations` | Invitar pareja por correo. |
| POST | `/invitations/accept` | Aceptar invitación (crea/asocia usuario). |

### Categories
| GET | `/categories` | Lista (sistema + custom). |
| POST | `/categories` | Crear custom. |
| PATCH | `/categories/:id` | Editar (nombre/color/icon/budget). |
| DELETE | `/categories/:id` | Solo custom. |

### Movements
| GET | `/movements?month=&year=&owner=` | Lista filtrada por mes/persona. |
| POST | `/movements` | Crear. |
| PATCH | `/movements/:id` · DELETE `/movements/:id` | Editar / borrar. |
| GET | `/movements/summary?month=&year=` | KPIs (ingresos, gastos, disponible, ahorro) + serie 6 meses. |

### Debts
| GET | `/debts?owner=` | Lista + resumen (total pendiente, obligación por persona). |
| POST | `/debts` · PATCH `/debts/:id` · DELETE `/debts/:id` | CRUD. |
| POST | `/debts/:id/payments` | Registrar pago (incrementa `paid_cents`). |

### Reminders
| GET `/reminders` · POST · PATCH `/:id` · DELETE `/:id` |
| PATCH | `/reminders/:id/email` | Toggle recordatorio por email. |

### Net worth / Assets
| GET | `/networth` | Patrimonio neto + distribución (donut) + lista de activos. |
| POST/PATCH/DELETE `/assets` | CRUD de activos. |

### Reports
| GET | `/reports/annual?year=` | KPIs anuales, 12 barras, top categorías. |

### Integraciones futuras (fase posterior — placeholder)
| GET | `/integrations` · POST `/integrations/:provider/connect` | Conectar proveedores de recibos/gastos fijos (ICE, AyA, bancos) vía APIs externas. **No se implementa aún**, solo se reserva el namespace y el contrato. |

---

## 6. Fases / Sprints de implementación

| Fase | Objetivo | Entregable | Estado |
|---|---|---|---|
| **Fase 1** | Recrear template visual en React con **mock** | Frontend navegable, 11 pantallas + 3 modales, capa de servicios lista, `.env.example` | ✅ este entregable |
| **Fase 2** | Backend REST base | Node+TS+Express+Prisma(MongoDB)+Zod+JWT+Swagger, esquema Prisma + `db push`, `auth/register·login·refresh`, `me`, tenant, trial 7d, seed de categorías, README | ✅ este entregable |
| **Fase 3** | Conectar frontend ↔ API | Implementar `services/api/*`, conmutar `VITE_API_MODE=api`, AuthContext real (login/refresh), reemplazar mocks pantalla por pantalla | ⏳ |
| **Fase 4** | Módulos de negocio completos | CRUD real de movements, categories, debts, reminders, assets, couple, reports en backend + wiring frontend | ⏳ |
| **Fase 5** | Facturación & planes | Stripe/Lemon, gating por plan, fin de trial, upgrade | ⏳ |
| **Fase 6** | Recordatorios por email | Job programado + proveedor de correo (Resend/SES) | ⏳ |
| **Fase 7** | Integraciones externas | Conectores de recibos/gastos fijos (APIs de servicios/bancos) | ⏳ |

### Detalle Fase 1 (implementada aquí)
- Proyecto Vite React+TS. Tokens del README → `globals.css` (CSS vars claro/oscuro) + `tailwind.config`.
- Todos los componentes reutilizables + layouts + 11 páginas + 3 modales.
- Datos mock exactos del template en `src/data/mock.ts`.
- Contextos: Theme (persistido), Currency, Month, Auth (mock).
- Capa `services/` con interfaz e implementación **mock**; `services/api/` esbozado pero inactivo.
- `.env.example` con `VITE_API_MODE=mock` y `VITE_API_URL`.

### Detalle Fase 2 (implementada aquí)
- Backend Express por capas. Prisma schema (MongoDB) + `db push` + seed + `docs/data-model.md`.
- `auth/register`, `auth/login` (arranca trial), `auth/refresh`, `auth/logout`, `me`.
- Middlewares auth + tenant + validación Zod + manejo de errores.
- Swagger en `/docs`. README con pasos para correr con MongoDB (Atlas / replica set).
- Módulos de negocio quedan **esqueletados** (routers registrados, servicios stub) para Fase 4.

---

## 7. Conexión del template visual con datos reales

1. **Contrato compartido:** `frontend/src/services/types.ts` define los DTOs. El backend
   expone exactamente esos shapes → cero traducción en las páginas.
2. **Interfaz de servicios:** cada dominio expone funciones (`listMovements`, `createDebt`…).
   Hoy resuelven desde `mock/`; en Fase 3 se implementa `api/` con `http.ts` y se conmuta por
   `VITE_API_MODE`. **Las páginas no cambian.**
3. **Formato monetario:** el backend entrega `amount_cents` (USD). El front convierte con
   `fmt(usd, currency)` según el toggle. La tasa CRC pasa de constante mock a valor de config.
4. **Auth:** `AuthContext` mock (usuario Ana precargado) → en Fase 3 llama `/auth/login`,
   guarda tokens, y `http.ts` añade `Bearer` + auto-refresh en 401.
5. **Estado de UI** (mes, moneda, tema, filtros, modales) permanece en el cliente; solo los
   **datos** migran a la API.

## 8. Qué sigue con mock temporalmente

- **Fase 1 completa:** todos los datos (movimientos, categorías, deudas, patrimonio,
  recordatorios, reporte, pareja, KPIs, gráficos) son mock en el front.
- **Tras Fase 2:** solo `auth` + `me` + `account`/`trial` tienen backend real; el resto sigue
  mock hasta Fase 4.
- **Mock permanente hasta fase específica:** tasa de cambio CRC (Fase 5/config), datos de
  integraciones externas de recibos (Fase 7), analítica de "vs mes previo" (requiere histórico real).

## 9. Riesgos técnicos y decisiones recomendadas

| Riesgo | Impacto | Mitigación / decisión |
|---|---|---|
| **Multi-tenant leak** (olvidar `account_id` en una query) | Crítico (fuga de datos entre hogares) | Todos los repos reciben `accountId` como 1er argumento; helper `tenantScope()`; tests. MongoDB no tiene RLS: la barrera es la app (mantener `where account_id` en toda consulta). |
| **Floating point en dinero** | Corrupción de montos | Guardar **centavos `int`**; formatear solo en UI. |
| **Trial: cuándo arranca** | Confusión de negocio | Arranca en el **primer login** (`trial_ends_at` null→now+7d), no en el registro. Decidido. |
| **JWT refresh / logout** | Sesiones colgadas o robo de token | Refresh tokens hasheados en DB, rotación en cada refresh, revocación en logout. |
| **MongoDB requiere replica set** (Prisma) | Fallan escrituras anidadas/transacciones en Mongo standalone | Usar **Atlas** (ya es replica set) o Mongo local con `--replSet`. Documentado en `.env.example` y README. `setLoginAndTrial` se hizo secuencial para no depender de transacción. |
| **Modo pareja / person_key** | Modelo rígido para >2 personas | Empezar con `person_key` ana/luis para paridad visual; el modelo `users.role` ya soporta N miembros; el split a N personas se generaliza en Fase 4. |
| **Doble moneda / tasa** | Montos incorrectos si la tasa cambia | Base USD siempre; tasa CRC configurable por cuenta a futuro; nunca guardar CRC. |
| **Deriva mock↔API** | DTOs divergen y rompe Fase 3 | `types.ts` es la fuente de verdad; generar tipos del backend (o compartir paquete) en Fase 3. |
| **Integraciones externas de recibos** | Alcance incierto, APIs de terceros inestables | Aislar tras `modules/integrations` con contrato propio; feature-flag; no bloquear el core. |

---

**Siguiente paso tras aprobar este plan:** Fase 1 (frontend con mock) y Fase 2 (backend base),
ambas incluidas en este mismo entregable.
