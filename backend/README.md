# Fortiva — Backend (Fase 2)

REST API de Fortiva: Node.js + TypeScript + Express + Prisma + **MongoDB** + JWT.
Arquitectura por capas (routes → controllers → services → repositories → domain).

## Qué incluye la Fase 2
- Auth con JWT (access + refresh con rotación): `register`, `login`, `refresh`, `logout`, `me`.
- **Multi-tenant** por `account_id` (cuenta = hogar). Middlewares `requireAuth` + `resolveTenant`.
- **Trial de 7 días** que arranca en el **primer login**.
- **Categorías base** creadas automáticamente al registrar una cuenta + seed demo.
- Validación con **Zod**, errores JSON uniformes, **Swagger** en `/docs`.
- Módulos de negocio (movements, categories, debts, reminders, networth, reports) quedan
  **reservados** (endpoints protegidos que responden `501` hasta la Fase 4).

## Stack
Express · Prisma ORM · Zod · jsonwebtoken · bcryptjs · helmet · cors · express-rate-limit · swagger-ui-express.

## Requisitos
- Node 18+
- **MongoDB como replica set.** La opción más simple es **MongoDB Atlas** (ya es replica set).
  Para Mongo local, arráncalo como replica set (ver más abajo). Prisma exige replica set para
  las escrituras anidadas (registro) y transacciones. No se usa autenticación de terceros: es propia.

## Configuración

```bash
cd backend
cp .env.example .env
npm install
```

Edita `.env` con tu cadena de conexión de MongoDB.
En **Atlas**: *Connect → Drivers*, copia la SRV string y agrégale el nombre de BD `/fortiva`.

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Cadena de MongoDB (`mongodb+srv://…/fortiva`). Debe apuntar a un replica set. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secretos largos y aleatorios. |
| `TRIAL_DAYS` | Días de prueba (default 7). |
| `CORS_ORIGIN` | Origen del frontend (`http://localhost:5173`). |

### MongoDB local como replica set (opcional)
Si no usas Atlas:
```bash
mongod --dbpath ./data --replSet rs0
# en otra terminal, una sola vez:
mongosh --eval "rs.initiate()"
```
Y usa `DATABASE_URL="mongodb://localhost:27017/fortiva?replicaSet=rs0"`.

## Base de datos

MongoDB **no usa migraciones SQL**: el esquema (`prisma/schema.prisma`) se aplica con `db push`,
que crea colecciones e índices.

```bash
npm run prisma:generate     # genera Prisma Client
npm run prisma:push         # aplica el esquema a MongoDB (colecciones + índices)
npm run seed                # datos demo (Hogar Rodríguez)
```

- Referencia de colecciones e índices: [`docs/data-model.md`](docs/data-model.md).
- El seed es **idempotente**: si el usuario demo ya existe, no hace nada.

**Usuario demo:** `ana@fortiva.app` / `demo1234` (y `luis@fortiva.app` / `demo1234`).
El trial arrancará al hacer el primer `login`.

## Correr

```bash
npm run dev        # tsx watch → http://localhost:4000
# o producción:
npm run build && npm start
```

- Healthcheck: `GET /health`
- Swagger UI: `http://localhost:4000/docs`

## Probar el flujo (Swagger o curl)

```bash
# 1) Registro (crea cuenta + admin, devuelve tokens)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"nuevo@correo.com","password":"secreto123","fullName":"Ana R.","accountName":"Hogar R."}'

# 2) Login (arranca el trial de 7 días en el primer ingreso)
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@fortiva.app","password":"demo1234"}'

# 3) Perfil + estado de trial (usa el accessToken devuelto)
curl http://localhost:4000/api/v1/me -H 'Authorization: Bearer <accessToken>'

# 4) Refresh (rota el refresh token)
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H 'Content-Type: application/json' -d '{"refreshToken":"<refreshToken>"}'
```

En `/me` verás `account.trialDaysLeft` (≈7 tras el primer login).

## Estructura

```
backend/
├─ prisma/
│  ├─ schema.prisma      # modelo de datos MongoDB (multi-tenant, centavos)
│  └─ seed.ts            # datos demo
├─ docs/data-model.md    # referencia de colecciones e índices
└─ src/
   ├─ server.ts  app.ts  # bootstrap + montaje
   ├─ config/            # env (Zod), prisma, swagger
   ├─ middlewares/       # auth, tenant, validate, error, (rateLimit en app)
   ├─ lib/               # jwt, hash, AppError, trial, asyncHandler
   ├─ domain/            # baseCategories (reglas/datos puros)
   └─ modules/
      ├─ auth/           # register, login, refresh, logout, me
      ├─ accounts/       # cuenta (tenant) + couple config
      └─ placeholders.routes.ts   # namespaces reservados Fase 4/7 (501)
```

## Seguridad / notas
- Refresh tokens se guardan **hasheados** (SHA-256) y se **rotan** en cada refresh; `logout` los revoca.
- Contraseñas con **bcrypt**.
- Aislamiento multi-tenant en la capa de repositorios (siempre `where account_id`). MongoDB no
  tiene RLS: la barrera es la aplicación (ver `docs/data-model.md`).
- Prisma + MongoDB requiere **replica set** (Atlas por defecto) para escrituras anidadas y
  transacciones. El esquema se aplica con `prisma db push` (sin migraciones SQL).
