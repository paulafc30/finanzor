# Finanzor

App de finanzas personales mes a mes, pensada para una unidad familiar pequeña.
La uso yo misma cada día y quiero llevarla en algún momento a Play Store.

> **No es una app multi-tenant ni una banca abierta**: cada usuario ve sólo sus
> propios datos (Supabase RLS), pero pensada para que en casa la podamos usar
> varias personas con cuentas distintas y categorías propias.

## ¿Qué hace?

- Anotar movimientos (ingresos y gastos) con fecha real, no fecha de registro.
- Comparar gastos vs presupuesto por categoría, mes a mes.
- Gastos fijos recurrentes que se materializan automáticamente.
- Metas de ahorro con aportaciones y categoría especial "Ahorro".
- Vista por mes o por año, calendario diario, buscador y filtros.
- PWA instalable, modo oscuro, en español.

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| UI | **React 18 + Vite 5** | Curva de aprendizaje ya superada, dev server rápido. |
| Estilos | **Tailwind CSS 3** | Mobile-first sin escribir CSS aparte. |
| Estado servidor | **TanStack React Query 5** | Cache + invalidaciones declarativas. |
| Formularios | **React Hook Form + Zod** | Validación tipada, poco re-render. |
| Datos / Auth | **Supabase** (Postgres + Auth + RLS) | Tier gratis suficiente, RLS por usuario. |
| Routing | **React Router 6** | Rutas simples sin SSR. |
| Gráficas | **Recharts** | Suficiente para donut y barras del Dashboard. |
| Hosting | **Vercel** | Auto-deploy desde GitHub. |
| Push (futuro) | OneSignal | Pendiente de configurar (ver `docs/adr/0009-notificaciones-onesignal.md`). |

Lenguaje: **JavaScript** (no TypeScript). Decisión consciente, ver
[ADR-0002](docs/adr/0002-javascript-en-vez-de-typescript.md).

## Quick Start

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.local.example .env.local
# rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con los de tu proyecto Supabase

# 3. Arrancar en local
npm run dev
# abre http://localhost:5173
```

Antes del primer arranque hay que aplicar el esquema en Supabase — ver más abajo.

## Setup de Supabase (primera vez)

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com) (región europea
   recomendada para latencia desde España).
2. En **Project Settings → API**, copia `Project URL` y `anon public key` a tu
   `.env.local`.
3. Ve a **SQL Editor** y ejecuta en orden:
   ```
   supabase/migrations/0001_init.sql
   supabase/migrations/0002_rls.sql
   supabase/migrations/0003_seed_default_categories.sql
   supabase/migrations/0004_feedback.sql
   supabase/migrations/0005_categories_archive.sql
   ```
4. Para login con Google: **Authentication → Providers → Google**, crea
   credenciales OAuth en Google Cloud y pega `client_id` + `client_secret`.

## Deploy en Vercel

1. Sube el repo a GitHub (si no está).
2. En Vercel, **Add New → Project** → importa el repo.
3. En **Environment Variables**, añade `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Cada `git push` a `main` redespliega solo.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server con HMR en `http://localhost:5173`. |
| `npm run build` | Build de producción a `dist/`. |
| `npm run preview` | Sirve el build de `dist/` localmente para probarlo. |
| `npm run lint` | ESLint sobre `.js` y `.jsx`. |

## Estructura del repo

```
.
├─ index.html               # entrada Vite + meta PWA
├─ public/                  # favicon, iconos PNG, manifest, OneSignal worker
├─ src/
│  ├─ main.jsx              # bootstrap React + QueryClient
│  ├─ App.jsx               # rutas + providers (MonthProvider, Onboarding)
│  ├─ lib/                  # cliente Supabase, formateadores, helpers
│  ├─ hooks/                # useSession, useMonth, useCategories, useTransactions, ...
│  ├─ components/
│  │  ├─ auth/              # RequireAuth
│  │  ├─ layout/            # AppShell, BottomNav, MonthSwitcher, MonthYearPicker
│  │  ├─ ui/                # Button, Modal, Fab, CalculatorPad
│  │  ├─ transactions/      # TransactionForm, TransactionList, MovementsFilters
│  │  ├─ budget/            # BudgetBar, BudgetRow
│  │  ├─ calendar/          # MonthCalendar, DayDetailModal
│  │  ├─ categories/        # CategoryForm
│  │  ├─ dashboard/         # KpiCard, CategoryDonut, MonthBudgetBar, RecentTransactions
│  │  ├─ savings/           # GoalForm, GoalCard, ContributionForm, GoalDetailModal
│  │  ├─ recurring/         # RecurringForm, RecurringList
│  │  ├─ import/            # FileUploader, ColumnMapper, ImportPreviewTable
│  │  ├─ onboarding/        # Onboarding
│  │  └─ settings/          # NotificationsToggle (oculto hasta configurar OneSignal)
│  ├─ pages/                # Login, Dashboard, Movements, Calendar, Budget, Savings,
│  │                        # Categories, Settings, Import, Feedback
│  └─ styles/index.css
├─ supabase/migrations/     # esquema SQL versionado (aplicar en orden en SQL Editor)
├─ docs/                    # arquitectura, ADRs, guía de estilo (este directorio)
├─ .cursorrules             # reglas para asistentes IA (Cursor / Windsurf / Copilot)
├─ PLAN.md                  # roadmap original + modelo de datos
└─ package.json
```

## Reglas críticas del modelo

Estas dos reglas son las que más fallan si uno no las conoce. Si vas a tocar el
código, **léelas antes**:

1. **Filtrar siempre por `transactions.occurred_on`, nunca por `created_at`.**
   Un gasto que apunto hoy con fecha de ayer cuenta en el mes de ayer. Todas
   las queries de mes/año/calendario/categorías están construidas así. Ver
   [ADR-0003](docs/adr/0003-filtrar-por-occurred-on.md).
2. **Las categorías por defecto (`is_default = true`) no se borran ni se
   archivan.** Garantiza que el usuario siempre tiene mínimo 9 categorías
   disponibles. Sí se pueden renombrar y recolorear. Las custom se archivan
   (no se eliminan) para no perder el histórico. Ver
   [ADR-0006](docs/adr/0006-archivar-categorias-en-vez-de-borrar.md).

## Documentación extendida

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capas, flujo de datos,
  contratos entre módulos.
- [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md) — cómo se documenta el código en
  este repo (JSDoc, el "porqué", convenciones).
- [`docs/adr/`](docs/adr/) — Architecture Decision Records: las decisiones
  técnicas importantes con su contexto y consecuencias.
- [`PLAN.md`](PLAN.md) — roadmap original con fases y checklist del MVP.

## Estado del proyecto

Personal y vivo. Sin tests automatizados todavía. Sin CI más allá de Vercel.
No hay objetivos de producción más estrictos que "que mi familia pueda usarlo
sin que pete".
