# Desplegar Fortiva en Vercel (modo Services — un solo dominio)

Fortiva se despliega como **un único proyecto de Vercel** con **dos servicios**
(feature [Vercel Services](https://vercel.com/docs/services)):

- **`frontend`** (Vite) → sitio estático servido en `/`.
- **`backend`** (Express) → una Vercel Function que atiende `/api/*`.

El ruteo público vive en `vercel.json`: `/api/*` va al servicio `backend`, todo lo
demás al `frontend`. Como comparten dominio, el frontend llama a la API con ruta
**relativa** (`/api/v1`) y **no hace falta CORS**.

```
Navegador ──► https://tu-app.vercel.app
                 ├── /            → servicio frontend (SPA React/Vite)
                 └── /api/*       → servicio backend (Express + Prisma + MongoDB)
Vercel Cron ──► /api/v1/jobs/reminders   (diario 08:00 UTC → servicio backend)
```

> ⚠️ **Services requiere el permiso "Services" en tu cuenta** (en la pantalla de import
> aparece 🔒 *Permissions Required*). Si tu plan **Hobby** no lo habilita, mira
> [«Plan B» abajo](#plan-b--si-services-no-está-disponible).

---

## Cómo funciona el backend en este modo

El preset `express` de Vercel convierte la app en **una sola función**. El entrypoint
debe **exportar** la app. Por eso el servicio `backend` usa:

- **`entrypoint: index.js`** → [`backend/index.js`](backend/index.js), que hace
  `module.exports = createApp()` cargando el **build compilado** (`dist`).
- **`buildCommand: npm run prisma:generate && npm run build`** → genera el cliente de
  Prisma y compila TypeScript a `dist/` (con `tsc-alias`, que resuelve los alias `@/`).
- **`node-cron` no corre** en serverless: lo reemplaza **Vercel Cron**, que llama a
  `/api/v1/jobs/reminders` (protegido por `CRON_SECRET`).

---

## 1. Requisitos previos

1. **MongoDB Atlas** (gratis) — Prisma exige *replica set*, y Atlas ya lo es.
   - Crea un cluster M0, un usuario de BD y **permite acceso desde `0.0.0.0/0`**
     (las funciones de Vercel usan IPs dinámicas).
   - En *Connect → Drivers* copia la SRV string y agrégale `/fortiva`:
     `mongodb+srv://USER:PASS@CLUSTER.mongodb.net/fortiva?retryWrites=true&w=majority`
2. Repo en **GitHub** (ya lo tienes: `ronaldsm19/fortiva`), con estos cambios en `main`.
3. (Opcional) Credenciales **SMTP** para los correos de recordatorio.

---

## 2. Preparar la base de datos (una sola vez, desde tu máquina)

El esquema NO se aplica en cada deploy. Aplícalo una vez apuntando a Atlas:

```bash
cd backend
# Pon DATABASE_URL de Atlas en tu .env local, luego:
npm install
npm run prisma:generate
npm run prisma:push      # crea colecciones e índices en Atlas
npm run seed             # (opcional) datos demo: ana@fortiva.app / demo1234
```

---

## 3. Crear el proyecto en Vercel

1. **Add New → Project** e importa `ronaldsm19/fortiva`.
2. **Root Directory: la raíz del repo** (`./`). No lo cambies a `frontend`/`backend`:
   `vercel.json` ya define ambos servicios.
3. Vercel detectará el `vercel.json` con `services` (frontend Vite + backend Express)
   y mostrará el preset **Services**. No necesitas tocar los comandos de build.

---

## 4. Variables de entorno (Project → Settings → Environment Variables)

Configúralas para **Production** (y Preview si quieres previews funcionales). En Services
las variables son **compartidas** por ambos servicios; cada uno usa las que necesita.

### Backend (las lee la función en runtime)

| Variable | Ejemplo / valor | Notas |
|---|---|---|
| `DATABASE_URL` | `mongodb+srv://…/fortiva?retryWrites=true&w=majority` | **Obligatoria.** |
| `JWT_ACCESS_SECRET` | *(cadena larga aleatoria ≥16)* | **Obligatoria.** |
| `JWT_REFRESH_SECRET` | *(otra distinta ≥16)* | **Obligatoria.** |
| `NODE_ENV` | `production` | |
| `CORS_ORIGIN` | `https://tu-app.vercel.app` | Mismo dominio; inofensivo. |
| `APP_URL` | `https://tu-app.vercel.app` | Enlaces de los correos. |
| `TRIAL_DAYS` | `7` | Opcional. |
| `CRON_SECRET` | *(cadena aleatoria)* | **Recomendada.** Vercel la envía sola al cron y así protege el endpoint. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | | Opcionales. Sin ellas no se envían correos (no falla). |
| `FX_FALLBACK` | `505` | Opcional. TC (₡/USD) de respaldo si el BCCR no responde. |
| `BCCR_WS_EMAIL` / `BCCR_WS_TOKEN` | *(correo + token del BCCR)* | Opcionales. Habilitan el **TC histórico** de movimientos con fecha pasada. Sin ellas, esos movimientos usan el TC del día. Ver [«Token del BCCR» abajo](#token-del-bccr-tc-histórico). |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | `https://xxxx.upstash.io` + token | **Recomendada en Vercel.** Store compartido del rate limit por REST (sin conexión persistente). Ver nota abajo. |
| `REDIS_URL` | `rediss://…` / `redis://…` | Alternativa a Upstash REST: Redis clásico por TCP (ioredis). |

> **Rate limit global (issue #2).** El rate limit (`/api` a 300/15 min y `/api/v1/auth/login`
> + `/register` a 10/15 min) usa por defecto un store **en memoria por instancia**. Como
> Vercel escala a varias instancias, sin un store compartido el límite **no es global**.
> Define **una** de las dos opciones para que el contador sea global entre instancias:
> Upstash REST (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, lo natural en Vercel)
> **o** `REDIS_URL`. Si no defines ninguna, la API arranca igual (con un `console.warn`) pero
> el límite es solo por instancia — aceptable en local, no en producción.

### Frontend (se inyectan en el **build** de Vite)

| Variable | Valor | Notas |
|---|---|---|
| `VITE_API_MODE` | `api` | Consume el backend real. |
| `VITE_API_URL` | `/api/v1` | Ruta **relativa** → mismo dominio, sin CORS. |
| `VITE_CRC_RATE` | `525` | Opcional. |

> Genera secretos con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### Token del BCCR (TC histórico)

Un movimiento con **fecha pasada** debe guardarse con el TC de **esa** fecha, no con el de
hoy. La ventanilla del BCCR solo publica el TC actual, así que para fechas pasadas Fortiva
consulta el **web service oficial de indicadores económicos** del BCCR (indicadores
**317 = compra** y **318 = venta** del dólar), que sí devuelve series históricas.

Ese web service requiere un **correo + token gratuitos**. Para obtenerlos:

1. Entra a **<https://www.bccr.fi.cr/indicadores-economicos/servicio-web>** (Indicadores
   Económicos → *Servicio Web*).
2. Completa el formulario de **suscripción** con tu **correo electrónico**.
3. El BCCR te envía por correo un **token** de acceso asociado a ese correo.
4. Configura ambas variables en Vercel (Production/Preview):
   - `BCCR_WS_EMAIL` = el correo que registraste.
   - `BCCR_WS_TOKEN` = el token que te enviaron.

**Son opcionales.** Si no las defines (o el web service falla), los movimientos con fecha
pasada caen al **TC del día** sin bloquear el guardado; los movimientos de hoy no usan este
servicio (siguen tomando el snapshot del día de la ventanilla de ARI).

---

## 5. Desplegar y verificar

Pulsa **Deploy**. Vercel construye cada servicio por separado (install → build) y expone
el ruteo del `vercel.json`.

- **Salud del API:** `https://tu-app.vercel.app/api/health` → `{"status":"ok"}`
- **App:** abre `https://tu-app.vercel.app` y entra con `ana@fortiva.app` / `demo1234`
  (si corriste el seed) o registra una cuenta nueva.
- **Cron:** pruébalo a mano:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" \
    https://tu-app.vercel.app/api/v1/jobs/reminders
  # → {"ok":true,"checked":N,"sent":M}
  ```

---

## Notas y límites

- **Cron en UTC.** `0 8 * * *` = 8:00 UTC = **2:00 a.m. en Costa Rica**. Para las 8:00
  de CR (UTC−6) usa `"schedule": "0 14 * * *"` en `vercel.json`.
- **Si Vercel rechaza `crons` junto a `services`**, quita el bloque `"crons"` del
  `vercel.json` y programa un cron externo (p. ej. [cron-job.org](https://cron-job.org)
  o un GitHub Action) que haga el mismo `curl` de arriba con el `CRON_SECRET`. El
  endpoint funciona igual.
- **Cold starts:** la primera petición tras inactividad tarda algo más (Fluid compute
  mitiga esto). Prisma reutiliza conexión vía singleton global.
- **Prisma:** `schema.prisma` incluye `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
  para el runtime de Vercel. Si en el deploy ves *"Query engine not found"*, confirma
  que el `buildCommand` del backend corre `prisma:generate` (ya está configurado).
- **Swagger** queda en `/api/docs`.

---

## Plan B — si «Services» no está disponible

Si tu cuenta no habilita Services, hay dos alternativas equivalentes (un solo dominio):

1. **Función única serverless** (el enfoque clásico): una carpeta `api/` en la raíz que
   envuelve Express, con `vercel.json` basado en `functions` + `rewrites`. (Es la
   configuración que teníamos antes de cambiar a Services; puedo restaurarla.)
2. **Dos proyectos de Vercel** (frontend + backend por separado) y apuntar
   `VITE_API_URL` del frontend a la URL del backend. Más simple, pero dos subdominios.

Avísame y te dejo cualquiera de las dos.
