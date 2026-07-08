# Modelo de datos — MongoDB

Fortiva usa **MongoDB** vía Prisma (`provider = "mongodb"`). No hay DDL SQL ni
migraciones: el esquema vive en [`prisma/schema.prisma`](../prisma/schema.prisma) y se
aplica con `prisma db push`, que crea las colecciones y los índices.

- **IDs:** `ObjectId` (`_id`), expuestos como string en la API.
- **Montos:** enteros en **centavos USD** (`amount_cents`, `total_cents`, …).
- **Multi-tenant:** todo documento (excepto `accounts` y `refresh_tokens`) lleva
  `account_id`; los repositorios **siempre** filtran por él.
- **Fechas:** `ISODate`. Los campos que en Postgres eran `date` (p. ej. `occurred_on`,
  `due_date`, `paid_on`) se guardan como `DateTime` (fecha a medianoche UTC).

## Colecciones

| Colección | Rol | Campos clave |
|---|---|---|
| `accounts` | Tenant = hogar | `name`, `plan`, `couple_mode`, `split_mode`, `split_p1_pct`, `currency_pref`, `trial_ends_at`, `status` |
| `users` | Miembros del hogar | `account_id`, `email` (único), `password_hash`, `full_name`, `role`, `person_key`, `last_login_at` |
| `refresh_tokens` | Sesiones | `user_id`, `token_hash`, `expires_at`, `revoked_at` |
| `invitations` | Invitar pareja | `account_id`, `email`, `token` (único), `role`, `expires_at` |
| `categories` | Categorías | `account_id`, `name`, `icon`, `color`, `kind`, `budget_cents` — único `(account_id, name)` |
| `movements` | Ingresos/gastos | `account_id`, `category_id`, `user_id`, `type`, `amount_cents`, `occurred_on`, `scope`, `owner_key` |
| `debts` | Deudas | `account_id`, `name`, `issuer`, `owner_key`, `total_cents`, `paid_cents`, `monthly_cents`, `due_date` |
| `debt_payments` | Pagos de deuda | `debt_id`, `account_id`, `amount_cents`, `paid_on`, `method` |
| `reminders` | Recordatorios | `account_id`, `name`, `issuer`, `amount_cents`, `due_date`, `status`, `email_enabled` |
| `assets` | Patrimonio | `account_id`, `name`, `amount_cents`, `icon`, `color`, `is_asset` |

## Índices (creados por `prisma db push`)

- `users.email` único · `users.account_id`
- `refresh_tokens.user_id` · `refresh_tokens.token_hash`
- `categories (account_id, name)` único · `categories.account_id`
- `movements (account_id, occurred_on)`
- `debts.account_id` · `debt_payments.debt_id` · `debt_payments.account_id`
- `reminders.account_id` · `assets.account_id` · `invitations.token` único

## Notas MongoDB + Prisma

- **Replica set requerido:** las escrituras anidadas (registro crea `account` + `users` +
  `categories`) y cualquier transacción exigen que MongoDB corra como replica set.
  **Atlas ya lo es**; en local, arranca Mongo con `--replSet` e inicia el set.
- **Referential actions** (`onDelete: Cascade`/`SetNull`) las **emula Prisma** en el cliente
  (MongoDB no tiene FKs nativas).
- **Aislamiento multi-tenant:** garantizado en la capa de repositorios. MongoDB no tiene RLS;
  la barrera es la aplicación (mantener `where account_id` en toda consulta).
