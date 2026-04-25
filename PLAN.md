# Finanzor — Plan técnico

> App de finanzas personales con meses independientes, multiusuario familiar, mobile-first.
> Stack: **React + Vite + Supabase + Vercel**. Todo en capa gratuita.

---

## 1. Visión del MVP

El MVP es una app web responsive (mobile-first) donde Paula y sus familiares pueden:

1. Registrarse con email o Google.
2. Cada uno ve únicamente sus propios datos (aislamiento por RLS).
3. Registrar ingresos y gastos mes a mes, con categorías y fecha.
4. Configurar gastos fijos recurrentes que se materializan cada mes.
5. Definir un presupuesto previsto por categoría y ver presupuesto real vs previsto.
6. Crear metas de ahorro y aportar a ellas.
7. Ver el mes en formato calendario y navegar entre meses (‹ mes anterior / mes siguiente ›).
8. Ver un dashboard con totales, donut de categorías, tasa de ahorro y comparación con el mes anterior.

Queda **fuera del MVP** (pero se deja preparado): notificaciones push, exportar a CSV/PDF, múltiples monedas, cuentas bancarias separadas, importación de movimientos desde banco, y la versión Android nativa vía Capacitor.

---

## 2. Fases del proyecto

### Fase 0 — Setup (1 sesión)
- Crear repo en GitHub (`finanzor`).
- Inicializar proyecto Vite con React + JavaScript (o TypeScript si lo prefieres; ver §10).
- Configurar Tailwind CSS.
- Crear proyecto en Supabase (europe-west).
- Crear proyecto en Vercel y conectarlo al repo → primer deploy aunque sea en blanco.

### Fase 1 — Auth y estructura (1–2 sesiones)
- Supabase client configurado con variables de entorno.
- Pantalla de login / signup (email + Google opcional).
- Guard de rutas (si no hay sesión, redirige a login).
- Layout principal con navegación inferior móvil (5 pestañas).

### Fase 2 — Modelo de datos y CRUD básico (2–3 sesiones)
- Migraciones SQL con todas las tablas (ver §5).
- Row-Level Security policies activadas y probadas.
- Seeds de categorías por defecto al crear usuario (trigger SQL).
- CRUD de movimientos (ingresos/gastos): alta, lista, borrado, edición.

### Fase 3 — Features funcionales (3–4 sesiones)
- Selector de mes y filtrado por mes en todas las pantallas.
- Presupuestos por categoría (editar límites, barras de progreso, alertas 90%).
- Gastos fijos recurrentes y aplicación automática al mes actual.
- Metas de ahorro con aportaciones.

### Fase 4 — Dashboard y visualizaciones (1–2 sesiones)
- Donut de gastos por categoría (Recharts).
- Tarjetas de KPIs (ingresos, gastos, saldo, tasa de ahorro).
- Comparativa mes anterior.
- Calendario mensual con movimientos por día.
- Calculadora integrada.

### Fase 5 — Pulido mobile y PWA (1 sesión)
- Manifest + service worker → instalable en el móvil.
- Iconos, splash screen, colores de tema.
- Accesibilidad básica y ajustes responsive finales.

### Fase 6 — Android vía Capacitor (opcional, cuando el MVP esté sólido)
- Envolver la PWA con Capacitor.
- Generar APK, firmar, subir a Google Play Console (una vez).

---

## 3. Stack detallado

| Pieza | Tecnología | Notas |
|---|---|---|
| Frontend | React 18 + Vite | Build rápido, dev server en ms |
| Estilos | Tailwind CSS | Variables para modo oscuro |
| Enrutado | React Router v6 | Rutas protegidas por sesión |
| Data fetching | TanStack Query (React Query) | Cache + invalidación al mutar |
| Cliente BD | `@supabase/supabase-js` | Integra auth, BD y realtime |
| Gráficas | Recharts | Donut, line, bars |
| Fechas | `date-fns` | Ligero, locale español |
| Formularios | React Hook Form + Zod | Validación declarativa |
| Icons | lucide-react | Consistente con el look minimalista |
| BD | Supabase PostgreSQL | 500MB gratis |
| Auth | Supabase Auth | Email + Google |
| Hosting | Vercel | Deploy automático en push |
| CI opcional | GitHub Actions | Lint + typecheck en PR |

---

## 4. Estructura de carpetas

```
finanzor/
├─ public/
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ manifest.webmanifest
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ routes.jsx
│  ├─ lib/
│  │  ├─ supabase.js          ← cliente Supabase
│  │  ├─ queryClient.js       ← TanStack Query config
│  │  └─ formatters.js        ← € y fechas
│  ├─ hooks/
│  │  ├─ useSession.js
│  │  ├─ useMonth.js          ← mes seleccionado (global)
│  │  ├─ useTransactions.js
│  │  ├─ useBudgets.js
│  │  ├─ useRecurring.js
│  │  └─ useGoals.js
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ AppShell.jsx       ← header + bottom nav
│  │  │  ├─ MonthSwitcher.jsx  ← ‹ abril 2026 ›
│  │  │  └─ BottomNav.jsx
│  │  ├─ ui/                    ← botones, inputs, cards
│  │  ├─ transactions/
│  │  │  ├─ TransactionForm.jsx
│  │  │  └─ TransactionList.jsx
│  │  ├─ budget/
│  │  │  └─ BudgetBar.jsx
│  │  ├─ calendar/
│  │  │  └─ MonthCalendar.jsx
│  │  ├─ dashboard/
│  │  │  ├─ KpiCard.jsx
│  │  │  └─ CategoryDonut.jsx
│  │  └─ calculator/
│  │     └─ Calculator.jsx
│  ├─ pages/
│  │  ├─ Login.jsx
│  │  ├─ Dashboard.jsx
│  │  ├─ Movements.jsx
│  │  ├─ Calendar.jsx
│  │  ├─ Budget.jsx
│  │  └─ Savings.jsx
│  └─ styles/
│     └─ index.css
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_init.sql
│  │  ├─ 0002_rls.sql
│  │  └─ 0003_seed_default_categories.sql
│  └─ README.md
├─ .env.local.example
├─ .gitignore
├─ package.json
├─ tailwind.config.js
├─ vite.config.js
└─ README.md
```

---

## 5. Modelo de datos

Todo lleva `user_id uuid references auth.users(id) on delete cascade` y está protegido con RLS.

### `categories`
Categorías del usuario. Se rellenan automáticamente con 9 por defecto al registrarse.

| columna | tipo | notas |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| user_id | uuid | FK a auth.users |
| name | text | "Vivienda", "Ahorro"… |
| icon | text | nombre lucide-react |
| color | text | hex para gráfica |
| is_default | bool | true para las 9 iniciales |
| created_at | timestamptz | |

### `transactions`
Ingresos y gastos.

| columna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| type | text | `'income' \| 'expense'` |
| amount | numeric(12,2) | positivo siempre |
| description | text | "Mercadona", "Sueldo" |
| category_id | uuid | FK a categories; nullable en ingresos |
| occurred_on | date | fecha del movimiento |
| recurring_id | uuid | FK a recurring_expenses si vino de uno |
| created_at | timestamptz | |

Índice en `(user_id, occurred_on desc)`.

### `recurring_expenses`
Gastos fijos que se materializan cada mes.

| columna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| name | text | |
| amount | numeric(12,2) | |
| category_id | uuid | |
| day_of_month | int | 1–28 para evitar edge-cases |
| is_active | bool | default true |
| created_at | timestamptz | |

### `budgets`
Presupuesto por categoría y mes (permite cambiarlo por mes si quieres).

| columna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| category_id | uuid | |
| month | date | primer día del mes (YYYY-MM-01) |
| amount | numeric(12,2) | |

Unique (`user_id`, `category_id`, `month`).

### `goals`
Metas de ahorro.

| columna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| name | text | |
| target_amount | numeric(12,2) | |
| target_date | date | nullable |
| is_archived | bool | |
| created_at | timestamptz | |

### `goal_contributions`
Aportaciones a cada meta.

| columna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| goal_id | uuid | FK a goals |
| amount | numeric(12,2) | |
| contributed_on | date | |

### `monthly_snapshots` (opcional fase 4)
Saldo inicial/final por mes — para la feature "usar saldo final del mes anterior como inicial".

---

## 6. Row-Level Security

La regla de oro: **cada fila tiene `user_id` y el usuario solo accede a filas donde `user_id = auth.uid()`**.

Plantilla que se repite para cada tabla:

```sql
alter table public.transactions enable row level security;

create policy "own rows select"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "own rows insert"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "own rows update"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own rows delete"
  on public.transactions for delete
  using (auth.uid() = user_id);
```

Test obligatorio después del setup: crear dos usuarios ficticios en Supabase, intentar leer desde el cliente A las filas del B — debe devolver vacío.

---

## 7. Rutas de la app

| Ruta | Pantalla | Protegida |
|---|---|---|
| `/login` | Login/Signup | No |
| `/` | Dashboard | Sí |
| `/movimientos` | Lista + filtros + alta | Sí |
| `/calendario` | Calendario mensual | Sí |
| `/presupuesto` | Presupuestos y gastos fijos | Sí |
| `/ahorro` | Metas y aportaciones | Sí |
| `/ajustes` | Categorías, logout, preferencias | Sí |

Navegación inferior fija en móvil con 5 iconos (Inicio / Movimientos / Calendario / Presupuesto / Ahorro). Ajustes se abre desde un avatar en la esquina superior.

---

## 8. Autenticación

1. `supabase.auth.signInWithPassword({ email, password })` para login clásico.
2. `supabase.auth.signInWithOAuth({ provider: 'google' })` para Google.
3. Hook `useSession()` escucha `supabase.auth.onAuthStateChange` y expone `{ user, loading }`.
4. Un componente `<RequireAuth>` envuelve las rutas protegidas: mientras `loading` muestra un spinner, si no hay `user` hace `<Navigate to="/login" />`.
5. Al primer registro, un **trigger SQL** inserta las 9 categorías por defecto en `categories` para ese `user_id`.

---

## 9. Estado y data fetching

Se evita Redux intencionadamente. Patrón:

- **Estado de servidor** (todo lo que viene de Supabase) → TanStack Query. Cada hook (`useTransactions`, `useBudgets`…) es una `useQuery` con clave `['transactions', userId, month]`.
- **Estado de UI** (mes seleccionado, modales abiertos) → Context ligero o `useState`.
- **Mutaciones** → `useMutation` con `onSuccess: invalidate(['transactions', …])`.

Esto hace que cambiar de mes o añadir un movimiento refresque solo lo necesario sin recargar la app.

---

## 10. Decisiones técnicas pendientes

Estas las dejo marcadas para que decidas antes de empezar:

1. **¿JavaScript o TypeScript?** Recomiendo TS por el autocompletado y porque Supabase genera tipos automáticamente. Si prefieres empezar en JS por velocidad, se puede migrar después.
2. **¿Google login o solo email?** Email siempre, Google es un plus (añade unos 10 min de config en Supabase + Google Cloud).
3. **¿Un presupuesto por categoría fijo o distinto cada mes?** El diseño propuesto (tabla `budgets` con columna `month`) soporta los dos casos. Decidimos en la UI si siempre creamos el presupuesto del mes nuevo copiando el anterior.
4. **¿Idioma de la UI?** Asumo español 100%. Confirmar por si más adelante quieres multi-idioma (afecta a la organización de strings).

---

## 11. Variables de entorno

Fichero `.env.local` (que NO se sube al repo):

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Fichero `.env.local.example` (sí se sube al repo, sin valores) para que futuros devs/familiares sepan qué variables hay.

En Vercel se configuran las mismas variables en el dashboard del proyecto.

---

## 12. Setup paso a paso (lo que tendrás que ejecutar tú)

### Antes de código
1. Crear cuenta en Supabase si no la tienes → `supabase.com`.
2. Crear cuenta en Vercel → `vercel.com`.
3. Crear repo vacío en GitHub llamado `finanzor`.

### Fase 0
4. Clonar el repo vacío en `C:\Users\paula\Downloads\workspace\Finanzor`.
5. Yo te genero los archivos iniciales (Vite + React + Tailwind).
6. `npm install` y `npm run dev` → verificar que carga en `localhost:5173`.
7. `git add . && git commit && git push`.
8. Importar el repo en Vercel → primer deploy.

### Fase 1
9. En Supabase, crear un nuevo proyecto.
10. Copiar `SUPABASE_URL` y `anon key` a `.env.local`.
11. En el SQL Editor de Supabase, ejecutar los scripts de `supabase/migrations/` que te generaré.
12. Construir pantalla de login y probar flujo completo.

### Fase 2 en adelante
Ya te voy dando los componentes. Cada fase termina en un push a GitHub → deploy automático en Vercel.

---

## 13. Checklist de "MVP terminado"

- [ ] Dos usuarios pueden registrarse y ven solo sus datos.
- [ ] Añado un ingreso y un gasto y aparecen en la lista.
- [ ] Cambio de mes y la lista se filtra correctamente.
- [ ] Defino un presupuesto y la barra se pinta roja al superar el 90%.
- [ ] Creo un gasto fijo "Alquiler día 1" y aparece en el mes nuevo.
- [ ] Creo una meta "Vacaciones 500€" y aporto 50€ dos veces → muestra 100/500.
- [ ] El dashboard muestra totales, donut y tasa de ahorro correctos.
- [ ] La app es instalable en el móvil (PWA) y funciona offline lectura.
- [ ] Paula + 1 familiar la usan en producción una semana sin bugs bloqueantes.

---

## 14. Estimación de esfuerzo

A ritmo de sesiones de 1–2 horas contigo dirigiendo y yo escribiendo código:

- Fase 0: 1 sesión
- Fase 1: 1–2 sesiones
- Fase 2: 2–3 sesiones
- Fase 3: 3–4 sesiones
- Fase 4: 1–2 sesiones
- Fase 5: 1 sesión

Total aproximado: **9–13 sesiones** para un MVP deployable que uses tú y tu familia. Más adelante añadimos Play Store.

---

## 15. Siguiente paso

Cuando valides este plan, lo siguiente es Fase 0: yo te genero la estructura inicial del proyecto (Vite + React + Tailwind + Supabase client + las 5 rutas con placeholders) y te doy los comandos para crear el repo y el primer push. ¿Lo hacemos así?
