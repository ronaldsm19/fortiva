# Handoff: Fortiva — SaaS de finanzas personales/familiares

## Overview
Fortiva es un SaaS premium de finanzas personales y familiares. Permite controlar gastos e
ingresos mensuales, categorías, deudas, inversiones/patrimonio, recordatorios de pago y un
**modo pareja/familia** para repartir gastos. Este paquete contiene el diseño completo:
landing pública, registro, login y 8 pantallas internas de la aplicación.

El tono buscado es **cálido, serio y financieramente fino**, con estética premium inspirada en
producto tipo Apple (mucho aire, tarjetas limpias, gradientes sutiles, microinteracciones), sin
copiarlo. Marca: **Fortiva**. Idioma de la interfaz: **español**. Doble moneda: **USD y colones (₡)**.

## About the Design Files
Los archivos `.dc.html` de este bundle son **referencias de diseño creadas en HTML** — prototipos
navegables que muestran el aspecto y comportamiento deseados, **no código de producción para copiar
tal cual**. La tarea es **recrear estos diseños en el stack objetivo** siguiendo sus patrones.

> ⚠️ Los `.dc.html` usan un runtime propietario del entorno donde se prototipó (`support.js`,
> `<x-dc>`, `renderVals()`, `<sc-for>`, `<sc-if>`). **No intentes portar ese runtime.** Ábrelos en el
> navegador solo como referencia visual/interactiva y reescribe la UI en React normal. Toda la lógica
> relevante (datos mock, cálculos, estados) está documentada abajo y es fácil de leer en el `.js` embebido.

## Stack objetivo (solicitado por el cliente)
Recrear en un proyecto nuevo con:
- **React + TypeScript**
- **Vite**
- **Tailwind CSS** (mapear los design tokens de abajo a `tailwind.config` / variables CSS)
- **Framer Motion** para animaciones (equivalen a los keyframes descritos)
- **React Router** para navegación entre páginas
- **Recharts** para los gráficos (en el prototipo están hechos con divs/SVG; reemplazar por Recharts)
- **Lucide React** para iconos (el prototipo ya usa nombres de iconos Lucide — ver cada pantalla)

Sin backend, sin autenticación real, sin API: **todo con datos mock**. Estructura sugerida:
```
/src
  /components   Button, Card, Badge, Input, Select, Modal, Sidebar, Topbar,
                KpiCard, ChartCard, EmptyState, TransactionList, CategoryCard, PricingCard,
                CurrencyToggle, ThemeToggle, MonthSelector, OwnerAvatar
  /pages/public   Landing, Register, Login
  /pages/app      Dashboard, Movimientos, Categorias, Pareja, Deudas,
                  Inversiones, Recordatorios, Reporte
  /layouts        PublicLayout, AppLayout (sidebar + topbar + mobile nav)
  /data           mock.ts (todos los datos mock)
  /routes         router.tsx
  /styles         globals.css (tokens + fuentes + keyframes)
```

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciados e interacciones son finales.
Recrear pixel-perfect usando los tokens exactos de abajo.

---

## Design Tokens

### Fuentes
- **UI / cuerpo / números:** `Manrope` (Google Fonts), pesos 400/500/600/700/800.
  Números con `font-variant-numeric: tabular-nums` (clase `.fnum`).
- **Titulares display / acentos elegantes:** `Instrument Serif` (400 + itálica). Usada en
  H1 del hero, títulos de sección de la landing y títulos de los paneles de marca del auth.

### Colores — tema claro (default)
| Token | Hex | Uso |
|---|---|---|
| bg | `#FAF7F2` | fondo de página (blanco cálido) |
| bg-2 | `#F2ECE3` | secciones alternas |
| surface | `#FFFFFF` | tarjetas |
| surface-2 | `#FBF8F3` | inputs, barras de progreso vacías, filas hover |
| text | `#211E1A` | texto principal |
| text-2 | `#6B6459` | texto secundario |
| text-3 | `#9A9184` | texto terciario / labels |
| border | `#EAE3D8` | bordes/hairlines |
| border-strong | `#DDD4C6` | bordes de inputs |
| accent | `#2456C9` | azul confiable (primario) |
| accent-weak | `#EAF0FF` | fondos suaves de acento |
| accent-strong | `#183F9C` | hover del primario |
| pos | `#2E8B6B` | ingresos / positivo (verde) |
| pos-weak | `#E4F3EC` | fondo verde suave |
| neg | `#C0503B` | gastos / deuda (rojo cálido) |
| neg-weak | `#F8E9E3` | fondo rojo suave |
| gold | `#A9822F` | acento fino (ahorro, compartido) |

### Colores — tema oscuro (toggle)
| Token | Hex |
|---|---|
| bg | `#131210` |
| bg-2 | `#1A1815` |
| surface | `#1E1B17` |
| surface-2 | `#242019` |
| text | `#F4F0E8` |
| text-2 | `#A9A093` |
| text-3 | `#726B5F` |
| border | `#2D2921` |
| border-strong | `#3A342B` |
| accent | `#5B8CFF` |
| accent-weak | `#1C2740` |
| accent-strong | `#89A9FF` |
| pos | `#57C79A` |
| pos-weak | `#122720` |
| neg | `#E0806B` |
| neg-weak | `#2C1A14` |
| gold | `#D6B36A` |

Implementar como variables CSS en `:root` y `[data-theme="dark"]`; el toggle cambia el atributo
`data-theme` en el contenedor raíz. Persistir preferencia en `localStorage`.

### Colores de categorías
- Sistema: Gastos fijos `#2456C9`, Inversión `#2E8B6B`, Fondo de seguridad `#A9822F`, Gastos afuera `#C0503B`.
- Personalizadas: Educación `#7C4DBF`, Salud `#C0398A`, Mascota `#3E8AA9`.
- Los fondos de los íconos usan ese color al ~15% (`color-mix(in srgb, <color> 15%, transparent)`).

### Identidad de personas (modo pareja)
- **Ana** → gradiente azul `linear-gradient(135deg, accent, accent-strong)`, color accent, inicial "A".
- **Luis** → gradiente verde `linear-gradient(135deg, pos, #1f6b50)`, color pos, inicial "L".
- **Pareja/Compartido** → gradiente `linear-gradient(135deg, accent, pos)`, color gold, iniciales "AL".

### Radios, sombras, espaciado
- Radios: tarjetas 16–22px · inputs/botones 11–13px · chips 10px · badges/píldoras/avatars 100px/50%.
- Sombras:
  - `shadow-sm`: `0 1px 2px rgba(40,33,24,.05)`
  - `shadow`: `0 1px 2px rgba(40,33,24,.04), 0 10px 26px rgba(40,33,24,.06)`
  - `shadow-lg`: `0 4px 14px rgba(40,33,24,.06), 0 30px 70px rgba(40,33,24,.12)`
  - (En oscuro, sombras con `rgba(0,0,0,.3–.6)`.)
- Gaps de grids 14–16px · padding de tarjetas 18–26px · max-width contenido app 1240px · landing 1180px.

### Animaciones (keyframes → Framer Motion)
- `fadeUp`: opacity 0→1, translateY 16px→0, `.7s cubic-bezier(.22,.61,.36,1)`. Entrada de secciones/páginas. En landing con delays escalonados 0/.06/.12/.18/.24s.
- `scaleIn`: opacity 0→1, scale .96→1, `.28s` mismo easing. Aparición de modales.
- `fadeIn`: opacity 0→1, `.2–.4s`. Overlays.
- `growBar`: `scaleY(0)→1` origen inferior, `.7s`. Barras de los gráficos (con delay .06–.08s en la segunda barra).
- `floaty`: translateY 0→-10px→0, `7s ease-in-out infinite`. Tarjeta flotante del hero.
- Hover microinteracciones: `transform: translateY(-2 a -4px)` + sombra mayor en botones/tarjetas; transición `.15s`.

---

## Layouts

### PublicLayout (landing/auth)
Header sticky con blur (`backdrop-filter: blur(14px)`, fondo `bg` al 78%), borde inferior `border`.
Logo = cuadro 32px radio 9px con gradiente `135deg accent→accent-strong`, letra "F" blanca 800 + wordmark "Fortiva" 800/20px letter-spacing -.02em.

### AppLayout
- **Sidebar fija** izquierda, ancho **250px**, `surface`, borde derecho. Padding 20/16px. Contiene:
  logo arriba, nav (8 items), y abajo una tarjeta de usuario (avatar 38px "AR" con gradiente, nombre
  "Ana Rodríguez" / "Hogar Rodríguez", chevron) + "Cerrar sesión".
  - Item de nav: flex, gap 12px, padding 11/13px, radio 11px, icono Lucide 18px + label 14.5px.
    Activo → fondo `accent`, texto `accent-ink` (#fff/dark #0B1220), peso 700, `shadow-sm`.
    Inactivo → transparente, texto `text-2`, peso 600.
- **Topbar** sticky con blur: a la izquierda hamburguesa (solo móvil) + título de página (21px/800).
  A la derecha: **selector de mes** (‹ Julio 2026 ›), **toggle de moneda** (USD / ₡ CRC), **toggle de tema** (sol/luna), **avatar** "AR".
- **Contenido**: `max-width 1240px`, centrado, padding 28px, cada página entra con `fadeUp`.
- **Responsive**:
  - ≤960px: sidebar se oculta con `translateX(-100%)` y entra como drawer (`data-open`) con overlay
    oscuro (`rgba(20,15,8,.4)` + blur); aparece la hamburguesa; `margin-left` del main → 0; grids de
    2–4 columnas → 2 o 1.
  - ≤720px: toggle de moneda se oculta; tablas colapsan a 2–3 columnas (descripción + de quién + monto);
    grids → 1 columna.

### Selector de mes/año
Grupo con dos flechas (chevron-left/right) y etiqueta central `"<Mes> <Año>"` (tabular-nums, 104px min-width).
Estado: `monthIdx` (0–11), `year`. Prev/next hacen wrap de año. Es puramente visual sobre los mocks.

### Toggle de moneda (clave)
Estado `currency: 'USD' | 'CRC'`. **Todos los montos se guardan en USD** como base. Formateo:
```ts
function fmt(usd: number, currency: 'USD'|'CRC') {
  const n = Math.abs(usd);
  if (currency === 'CRC') return '₡' + Math.round(n * 525).toLocaleString('es-CR');
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
```
(Tasa mock 1 USD = 525 CRC. En producción, reemplazar por tasa real/config.)

---

## Pantallas públicas

### 1) Landing (`/`)
Secciones en orden:
1. **Hero** (grid 1.05fr / .95fr): badge "Finanzas de hogar, en calma" (píldora con punto verde) ·
   H1 en dos estilos — "El dinero de tu *familia*, por fin bajo control." con "familia" en Instrument
   Serif itálica color accent · párrafo · CTAs: **"Empezar prueba gratis"** (primario, con flecha) y
   **"Ver demo"** (secundario, entra directo a la app) · microcopy "7 días gratis · Sin tarjeta · Cancela
   cuando quieras". A la derecha, **tarjeta de app flotante** (animación `floaty`) con mini-KPIs
   (Disponible $1,720, Ahorro $900) y mini-gráfico de barras. Fondo con dos radiales sutiles (accent-weak, pos-weak).
2. **Trust strip**: iconos + texto — Datos cifrados · USD y colones · Modo pareja · Recordatorios por correo.
3. **Problema** (3 tarjetas, acento `neg`): "Gastos dispersos" (layers), "Pagos olvidados" (alarm-clock-off), "Cero visibilidad" (eye-off).
4. **Solución** (4 tarjetas, acento `accent`): "Control mensual" (calendar-check), "Reportes anuales" (bar-chart-3), "Recordatorios" (bell-ring), "Modo pareja" (users).
5. **Cómo funciona** (3 pasos numerados en círculos): Crea tu hogar · Registra el mes · Decide con datos.
6. **Features** (fondo `bg-2`, 6 tarjetas con icono a la izquierda): Movimientos (wallet), Categorías (shapes), Deudas (trending-down), Patrimonio (landmark), Recordatorios (bell), Modo pareja (heart-handshake).
7. **Pricing** (3 planes; el del medio "Hogar" destacado con borde accent + badge "Recomendado"):
   - **Personal** $0/mes — Movimientos ilimitados, Categorías base, 1 usuario, Reporte mensual. CTA "Empezar gratis".
   - **Hogar** $6/mes ⭐ — Todo lo de Personal, Modo pareja/familia, Recordatorios por correo, Deudas e inversiones, Reporte anual. CTA "Prueba 7 días gratis".
   - **Patrimonio** $12/mes — Todo lo de Hogar, Patrimonio avanzado, Múltiples cuentas, Exportar reportes, Soporte prioritario. CTA "Prueba 7 días gratis".
8. **CTA final**: bloque con gradiente `135deg accent→accent-strong`, radio 28px, texto blanco, botón blanco "Empezar prueba gratis de 7 días".
9. **Footer**: logo + "© 2026 Fortiva · Hecho con cuidado para tu hogar".

### 2) Registro (`/register`)
Layout dos columnas (1.1fr / 1fr). Izquierda = panel de marca con gradiente accent, título en Instrument
Serif, 3 bullets ("Invita a tu pareja por correo", "Datos cifrados", "7 días gratis, sin tarjeta").
Derecha = formulario premium, campos:
- **Nombre completo** · **Cédula** + **Teléfono** (en una fila de 2) · **Correo electrónico** ·
  **Nombre de la cuenta familiar** ("Hogar Rodríguez").
- **Checkbox de términos** (con enlaces a términos y privacidad).
- **Aviso destacado** (fondo pos-weak, icono mail-check): *"Te enviaremos una invitación por correo
  para que tu pareja se una al hogar."*
- Botón **"Crear cuenta y enviar invitación"**. Link a login abajo.

### 3) Login (`/login`)
Mismo layout. Panel de marca con copy de bienvenida. Formulario:
- **Correo** · **Contraseña** (con link "¿Olvidaste tu contraseña?" arriba a la derecha del label).
- **Aviso destacado** (fondo accent-weak, icono key-round): *"¿Primer ingreso? Te pediremos crear una
  nueva contraseña por seguridad."* (estado de primer ingreso / cambio de clave).
- Botón **"Entrar"**. Link a registro abajo.

Inputs (compartidos): padding 13/14px, radio 11px, borde `border-strong`, fondo `surface`, foco → borde `accent`.

---

## Pantallas privadas (app)

Navegación (orden del sidebar): Panel · Movimientos · Categorías · Pareja/Familia · Deudas ·
Patrimonio · Recordatorios · Reporte anual.

### 1) Dashboard / Panel mensual
- Saludo + botón **"Agregar movimiento"** (abre modal de movimiento).
- **4 KpiCards** (grid 4 col): Ingresos $5,520 (arrow-down-left, verde, "+8% vs mes previo"),
  Gastos $3,480 (arrow-up-right, rojo, "-3% vs mes previo"), Disponible $2,040 (wallet, accent, "37% de ingresos"),
  Ahorro $900 (piggy-bank, gold, "Meta: $1,000"). Cada card: label + icono en cuadro de color, valor 29px/800, delta.
- **Grid 1.35fr / 1fr**: ChartCard **"Ingresos vs gastos" (últimos 6 meses)** = barras agrupadas
  (ingreso verde `pos`, gasto azul `accent`) + leyenda; y **"Últimos movimientos"** = lista con icono,
  descripción, categoría·fecha, monto (verde con "+" si ingreso). Enlace "Ver todos" navega a Movimientos.

### 2) Movimientos
- **Filtro por persona** (tabs funcionales): **Todos / Ana / Luis / Pareja**. Activo = fondo accent.
- Si se filtra por persona, banner **"Resumen de <persona>"** con avatar + Ingresos/Gastos del mes de esa persona.
- Botón **"Agregar"** (modal de movimiento).
- **Tabla** de columnas: Descripción (icono + texto) · Categoría · Fecha · **De quién** (avatar de la
  persona + badge de alcance Compartido/Individual) · Monto (alineado derecha, verde si ingreso).
- Cada movimiento mock tiene: `date, cat, type('income'|'expense'), amount(USD), desc, scope('Compartido'|'Individual'), owner('Ana'|'Luis'|'Pareja'), icon`.
  - Filtro Ana → `owner==='Ana'`, Luis → `owner==='Luis'`, Pareja → `owner==='Pareja'` (compartidos), Todos → todo.

### 3) Categorías
- **Categorías del sistema** (grid 2 col) con badge "No se pueden eliminar": Gastos fijos, Inversión,
  Fondo de seguridad, Gastos afuera. Cada card: icono en color de categoría, nombre + "Sistema", botón
  editar (lápiz), y barra de progreso "gastado de presupuesto" + porcentaje.
- **Categorías personalizadas** (grid 3 col) con botón **"Nueva categoría"** (borde punteado): Educación,
  Salud, Mascota. Igual estructura, etiqueta "Personalizada" en color accent.
- Diferenciación sistema vs custom = etiqueta + (custom permite crear/eliminar). CRUD es visual/mock.

### 4) Modo pareja / Familia
- Card de encabezado con **toggle "Modo pareja / familia"** (switch). Estado `coupleMode`.
- Si activo: dos tarjetas de miembro (Ana — Pareja 1 · Administrador; Luis — Pareja 2 · Miembro).
- **"¿Cómo reparten los gastos compartidos?"**: tres botones segmentados — **50/50 en partes iguales**,
  **Porcentaje personalizado** y **Según ingresos (proporcional)** (`splitMode: '50'|'custom'|'salary'`).
- **Slider** 0–100 (paso 5) que fija el % de Ana (`p1`); el de Luis es `100 - p1`. Mover el slider pasa
  a modo custom.
- En modo **`salary`** el `p1` no se edita a mano: el backend lo deriva sumando los ingresos del mes de
  cada persona (`type=income`, `ownerKey=ana|luis`) con la fórmula `salarioAna / (salarioAna + salarioLuis)`.
  Muestra el salario de cada uno; si aún no hay ingresos por persona, avisa que los registren.
- **Vista previa**: total de gastos compartidos del mes ($2,090 mock), barra bicolor (accent = Ana, pos = Luis)
  proporcional, y dos cajas "Ana aporta <monto>" / "Luis aporta <monto>" = `sharedTotal * pct/100`.

### 5) Deudas
- Fila de resumen (grid 1.3fr/1fr/1fr):
  - **Deuda pendiente total** (card roja): suma de saldos restantes ($10,500 mock).
  - **Paga Ana / mes** y **Paga Luis / mes**: obligación mensual de cada persona =
    suma de sus deudas personales + **la mitad de las cuotas de las deudas compartidas** (nota "incl. mitad compartida").
- **Filtros**: Todas / Ana / Luis / Compartidas (`debtFilter`).
- Botón **"Nueva deuda"** → abre **modal** (ver Modales).
- **Cards de deuda** (una por deuda): icono + nombre + **badge de dueño** ("Compartida" en gold, o
  "Personal · Ana"/"Personal · Luis"), subtítulo `entidad · tasa · vence <fecha>`, **Cuota mensual**,
  **Restante**, botón **"Registrar pago"** → abre **modal**. Barra de progreso pagado/total + porcentaje
  (gradiente verde).
- Cada deuda mock: `name, issuer, paid(USD), total(USD), monthly(USD), rate, due, owner('Ana'|'Luis'|'Pareja'), icon`.
  Deudas mock: Tarjeta de crédito (BAC, Compartida, cuota 250), Préstamo de auto (Banco Nacional, Ana, 320),
  Financiamiento laptop (Gollo, Luis, 150), Préstamo estudiantil (Conape, Luis, 120).

### 6) Patrimonio / Inversiones
- Grid 1fr/1fr: **Card "Patrimonio neto"** (gradiente accent, texto blanco, valor 40px, "+4.2% este mes")
  = suma de activos menos deuda; y **card de distribución** con **donut** (conic-gradient) "Dónde tengo mi
  dinero" + leyenda con % por activo.
- **Cards** (grid 3 col): Efectivo $1,200 (gold), Cuenta bancaria $8,400 (accent), Inversiones $15,200 (pos),
  Ahorros $6,300 (morado), Deuda total −$9,600 (rojo, valor negativo). El donut usa solo los activos positivos.
  Colores de segmentos: `#A9822F, #2456C9, #2E8B6B, #7C4DBF`.
- **Recharts**: usar `PieChart`/`Cell` para el donut (innerRadius) y mantener la leyenda con porcentajes.

### 7) Recordatorios
- Botón **"Nuevo recordatorio"**. Lista de pagos próximos: cada uno con icono, nombre + `entidad · vence <fecha>`,
  **monto**, **badge de estado** (Pendiente = rojo / Pagado = verde) y un **toggle "recordatorio por email"**
  (icono mail + switch por item).
- Mocks: Electricidad (ICE, 08 Jul, pendiente), Agua (AyA, 10 Jul, pendiente), Internet (Kölbi, 12 Jul,
  pagado), Tarjeta de crédito (BAC, 20 Jul, pendiente). `email: boolean` por recordatorio.

### 8) Reporte anual
- **4 KPIs**: Ingresos 2026, Gastos 2026, Ahorro acumulado, Tasa de ahorro (= (ingresos−gastos)/ingresos).
- **ChartCard "Ingresos vs gastos · 2026"**: 12 barras agrupadas (mensuales) verde/azul + leyenda.
- **"Categorías más usadas"**: lista de barras horizontales con monto y % (Gastos fijos 38%, Inversión 16%,
  Gastos afuera 13%, Fondo de seguridad 9%, Educación 6%).
- Reemplazar barras por `BarChart` de Recharts.

---

## Modales
Overlay `rgba(20,15,8,.45)` + blur 3px, centrado, contenido `surface` radio 20px, `shadow-lg`,
entrada `scaleIn`. Cerrar al hacer clic fuera o en la X. Estado único `modal: null | 'movement' | 'debt' | 'payment'`.

### Modal "Agregar movimiento"
Toggle Ingreso/Gasto · Descripción · Monto + Fecha (fila) · Categoría (select) ·
**Alcance** (segmentado Compartido/Individual) · botón "Guardar movimiento".

### Modal "Nueva deuda"
Nombre + Entidad (fila) · **¿De quién es la deuda?** (segmentado Ana / Luis / Compartida, estado `ndOwner`) ·
**Plazo (meses)** (`ndMonths`, default 12) + **Pago mensual** (`ndMonthly`, default 150) (fila) ·
**Recuadro de total calculado EN VIVO** (icono calculator): "Total de la deuda = ndMonths × ndMonthly"
(`$1,800` con defaults, actualiza al teclear) · botón "Crear deuda".

### Modal "Registrar pago"
Encabezado con la deuda seleccionada (nombre, entidad · restante) · **Monto del pago** (prellenado con la
cuota mensual sugerida, `payAmount`) + microcopy "Cuota mensual sugerida: <monto>" · Fecha + Método (select:
Transferencia / Tarjeta de débito / Efectivo / Sinpe Móvil) · botón verde **"Confirmar pago"**.

---

## State management (resumen)
Estado global sugerido (Context o store simple), todo con mocks:
- `route` / rutas de React Router · `appPage` activa.
- `theme: 'light'|'dark'` (persistir en localStorage) · `currency: 'USD'|'CRC'`.
- `monthIdx`, `year` (selector de mes).
- `mobileNav: boolean` (drawer).
- Movimientos: `mvFilter: 'todos'|'ana'|'luis'|'pareja'`.
- Deudas: `debtFilter: 'todas'|'ana'|'luis'|'compartidas'`.
- Pareja: `coupleMode`, `splitMode` (`'50'|'custom'|'salary'`), `p1` (% de Ana), `salaryP1`/`salaryP2`.
- Modal: `modal`, y campos del form activo (`ndMonths`, `ndMonthly`, `ndOwner`, `payDebt`, `payAmount`).

## Componentes reutilizables a extraer
`Button` (variantes primary/secondary/ghost), `Card`, `Badge/Pill`, `Input`, `Select`, `Toggle/Switch`,
`Modal`, `Sidebar`, `Topbar`, `KpiCard`, `ChartCard`, `EmptyState`, `TransactionList`/`TransactionRow`,
`CategoryCard`, `PricingCard`, `OwnerAvatar`, `ProgressBar`, `CurrencyToggle`, `ThemeToggle`, `MonthSelector`.

## Assets
- **Iconos:** todos son de **Lucide** (`lucide-react`). Los nombres exactos usados aparecen en cada pantalla
  arriba (p. ej. `layout-dashboard, arrow-left-right, shapes, heart-handshake, trending-down, landmark, bell,
  bar-chart-3, wallet, piggy-bank, credit-card, car, laptop, graduation-cap, zap, droplet, wifi, home,
  utensils, shopping-cart, briefcase, sparkles, coffee, building-2, calculator, mail, mail-check, key-round,
  shield, shield-check, users, plus, x, chevron-left/right, filter, pencil, arrow-right, arrow-left, sun, moon,
  log-out, banknote, bell-ring, gift, lock, heart-pulse, paw-print`).
- **Sin imágenes ni logos externos.** El logo "F" es un cuadro con gradiente + letra. No hay assets binarios que copiar.
- **Fuentes:** Manrope + Instrument Serif desde Google Fonts.

## Files (referencia en este bundle)
- `Fortiva.dc.html` — prototipo principal: landing + shell de la app + las 8 pantallas + los 3 modales.
  La lógica (datos mock, `fmt()`, cálculos de split/deudas/patrimonio) está en el bloque
  `class Component` embebido — leerla como pseudocódigo de referencia.
- `AuthShell.dc.html` — pantallas de Registro y Login (prop `mode: 'register'|'login'`).

Ignorar cualquier archivo `support.js` del entorno original: es runtime del prototipo, no del stack objetivo.
