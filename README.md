# Finanzor

PWA de finanzas personales mes a mes, pensada para móvil: anota ingresos y gastos, compara con presupuestos por categoría, automatiza los gastos fijos y sigue tus metas de ahorro.

> **Probar sin registrarse**: en la pantalla de inicio de sesión, el botón **"Ver demo sin registrarme"** crea una cuenta temporal con datos de ejemplo.

## Funcionalidades

- Movimientos de ingreso y gasto con **fecha real** (`occurred_on`), método de pago (tarjeta / efectivo) y categorías propias.
- **Presupuesto por categoría y mes**, con barras de progreso y copia automática del mes anterior.
- **Gastos e ingresos fijos** (mensuales o semanales) que se materializan solos.
- **Metas de ahorro** con aportaciones enlazadas a sus movimientos.
- Dashboard con KPIs, donut por categoría, comparativa mensual y carrusel de gráficas; vista de calendario.
- **Importador de CSV bancario** (detecta la cabecera real y varios formatos de fecha).
- Exportación de datos y **borrado real de la cuenta** (Edge Function).
- PWA instalable, tema claro/oscuro, interfaz en español e inglés (i18next).

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 18 + Vite 5 + Tailwind CSS 3 |
| Estado servidor | TanStack React Query 5 |
| Formularios | React Hook Form + Zod |
| Datos y auth | Supabase (Postgres, Auth con email / Google / anónima, RLS, Edge Functions) |
| Gráficas | Recharts |
| i18n | i18next + react-i18next |
| Push | OneSignal (opcional) |
| Hosting | Vercel + GitHub Actions (lint y build en cada PR) |

Lenguaje: JavaScript, decisión razonada en [ADR-0002](docs/adr/0002-javascript-en-vez-de-typescript.md).

## Decisiones técnicas destacadas

- **Seguridad en la base de datos, no solo en el cliente**: RLS en todas las tablas y un trigger que impide borrar las categorías por defecto aunque se llame directamente a la API ([0010](supabase/migrations/0010_protect_default_categories.sql)).
- **La `service_role` nunca llega al navegador**: el borrado de cuenta vive en una Edge Function que valida el JWT del usuario ([`supabase/functions/delete-account`](supabase/functions/delete-account/index.ts)).
- **Modo demo con datos aislados**: sesión anónima de Supabase + RPC `seed_demo_data()` que solo acepta cuentas anónimas ([0013](supabase/migrations/0013_demo_mode_and_fixes.sql)).
- **Filtrar siempre por `occurred_on`, nunca por `created_at`**: un gasto apuntado hoy con fecha de ayer cuenta en el mes de ayer ([ADR-0003](docs/adr/0003-filtrar-por-occurred-on.md)).
- **Categorías por defecto no borrables, personalizadas archivables** para no perder histórico ([ADR-0006](docs/adr/0006-archivar-categorias-en-vez-de-borrar.md)).
- 10 ADRs con el contexto y las consecuencias de cada decisión en [`docs/adr/`](docs/adr/).

## Puesta en marcha

Requisitos: Node 20+ y un proyecto de [Supabase](https://supabase.com).

```bash
npm install
cp .env.local.example .env.local   # rellena las variables (ver tabla)
npm run dev                        # http://localhost:5173
```

### Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sí | Clave pública `anon` (la seguridad la da RLS) |
| `VITE_WEB3FORMS_KEY` | No | Envío del feedback por email (Web3Forms) |
| `VITE_ONESIGNAL_APP_ID` | No | Recordatorios push |

### Base de datos

Aplica las migraciones de [`supabase/migrations`](supabase/migrations) en orden (`supabase db push` con el CLI, o pegándolas en el SQL Editor). Despliega la función de borrado de cuenta:

```bash
supabase functions deploy delete-account
```

Para el **modo demo** activa *Authentication → Sign In / Providers → Allow anonymous sign-ins*; detalles y limpieza programada en [`supabase/README.md`](supabase/README.md). Para login con Google configura el proveedor en *Authentication → Providers*.

### Despliegue

Importa el repo en Vercel, añade las variables de entorno y despliega. [`vercel.json`](vercel.json) ya incluye el rewrite de la SPA y cabeceras de seguridad básicas.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | ESLint (0 warnings permitidos) |

## Estructura

```
src/
├─ pages/        # una por ruta (Dashboard, Movements, Budget, Savings, Login…)
├─ components/   # por dominio: transactions, budget, savings, dashboard, import…
├─ hooks/        # acceso a datos con React Query (useTransactions, useBudgets…)
├─ lib/          # cliente Supabase, formateadores, parser CSV, demo
├─ i18n/         # traducciones es / en por namespace
└─ context/      # tema
supabase/
├─ migrations/   # esquema versionado, RLS, triggers y RPCs
└─ functions/    # Edge Functions (delete-account)
docs/            # ARCHITECTURE, STYLE_GUIDE, PLAN y ADRs
```

## Documentación

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): capas, flujo de datos y contratos entre módulos.
- [`docs/adr/`](docs/adr/): decisiones de arquitectura.
- [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md): convenciones de código y comentarios.
- [`docs/PLAN.md`](docs/PLAN.md): roadmap original y modelo de datos.
- [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md): publicación como TWA en Google Play.

## Limitaciones conocidas

- Aún no hay tests automatizados; CI ejecuta lint y build. Los siguientes candidatos son `csvParser`, `formatters` y `categoryRules`.
- Los gastos fijos se materializan desde el cliente al abrir la app (no hay un job en servidor).
- Sin Content-Security-Policy todavía (hay que permitir OneSignal y Supabase).
