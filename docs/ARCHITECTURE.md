# Arquitectura de Finanzor

Este documento describe **cómo está organizado el código**, **cómo viajan los
datos** y **qué módulo es responsable de qué**. Si vas a tocar el repo, leerlo
ahorra horas.

> Si buscas el porqué de una decisión concreta, ve a [`adr/`](adr/).
> Aquí cuento la mecánica, no el motivo.

## 1. Vista de pájaro

```
┌──────────────┐   queries / mutations    ┌──────────────────┐
│   Supabase   │ <──────────────────────> │  React Query     │
│  Postgres +  │                          │  (cache + sync)  │
│    Auth +    │                          └────────┬─────────┘
│     RLS      │                                   │ data/isLoading
└──────────────┘                                   ▼
                                          ┌──────────────────┐
                                          │  Hooks de dominio │
                                          │  useTransactions │
                                          │  useBudgets      │
                                          │  useCategories   │
                                          │  useGoals ...    │
                                          └────────┬─────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │   Componentes /  │
                                          │      pages       │
                                          └──────────────────┘
```

- **Supabase** es la única fuente de verdad. No hay backend propio.
- **React Query** vive en `src/lib/queryClient.js` y centraliza cache,
  reintentos y `staleTime`.
- Cada **hook de dominio** (`useTransactions`, `useBudgets`…) encapsula sus
  queries + mutaciones y sabe qué `queryKey` invalidar tras cambiar algo.
- Los **componentes** sólo consumen hooks. No tocan Supabase directamente.

## 2. Capas

### `src/lib/`

Utilidades sin estado de React:

- **`supabase.js`** — singleton del cliente Supabase, lee `VITE_SUPABASE_URL`
  y `VITE_SUPABASE_ANON_KEY`.
- **`queryClient.js`** — instancia única de `QueryClient`. Se monta en
  `main.jsx`.
- **`formatters.js`** — `formatEuro`, `formatDate`, `formatMonthLabel`,
  `formatYearLabel`, `firstDayOf{Month,NextMonth,Year,NextYear}`. Centralizar
  formato evita drift entre componentes.
- **`categoryRules.js`** — reglas para mapear movimientos importados
  (`Import.jsx`) a categorías por palabras clave.
- **`csvParser.js`** — wrapper sobre PapaParse para detectar columnas y
  normalizar filas.
- **`authErrors.js`** — traduce errores de Supabase Auth a mensajes en español
  útiles en `Login.jsx`.
- **`onesignal.js`** — init y helpers de Web Push (componente desactivado
  hasta tener `VITE_ONESIGNAL_APP_ID`).

### `src/hooks/`

Una unidad por dominio. La firma habitual es:

```js
// query
const { data, isLoading, error } = useFoo()

// mutation
const m = useUpdateFoo()
await m.mutateAsync({ id, ...patch })
```

Hooks clave:

| Hook | Qué expone |
|---|---|
| `useSession` | usuario actual + estado de auth. Suscribe a `onAuthStateChange`. |
| `useMonth` | mes / año seleccionado, modo Mes/Año, `rangeStart`/`rangeEnd`, navegación. **Es el contexto global de filtrado**. |
| `useCategories({ includeArchived })` + `useCreateCategory` + `useUpdateCategory` + `useArchiveCategory` + `useUnarchiveCategory` (+ `useDeleteCategory` no usado desde UI). |
| `useTransactions` + `useCreateTransaction` + `useUpdateTransaction` + `useDeleteTransaction`. Lista filtrada por `rangeStart`/`rangeEnd`. |
| `useBudgets` + `useBudgetSummary` + `useUpsertBudget` + `useCopyBudgetsFromPreviousMonth`. |
| `useRecurringExpenses` + `useMaterializeRecurring`. |
| `useGoals` + `useGoalContributions`. |
| `useAccumulatedBalance`, `usePreviousMonthSummary`, `useSavingsFromExpenses` — derivados para el Dashboard. |
| `useBulkImportTransactions` — para CSV. |
| `useNotifications` — wrapper de OneSignal (componente oculto). |
| `useOnboarding` — flag persistido para mostrar el tour la primera vez. |
| `useAuthCacheSync` — limpia React Query y `localStorage` al cambiar de usuario. |
| `useSubmitFeedback` — formulario `/feedback`. |

### `src/components/`

Por dominio:

- **`layout/`** — `AppShell` (header + `<Outlet/>` + `BottomNav`),
  `MonthSwitcher` (label + flechas + toggle Mes/Año), `MonthYearPicker`
  (selector tipo calendario que se abre desde el label y desde Calendar).
- **`ui/`** — `Button`, `Modal` (bottom-sheet móvil + modal centrado
  desktop), `Fab` (botón flotante de añadir), `CalculatorPad` (mini
  calculadora estilo iOS para el campo Importe).
- **`transactions/`** — `TransactionForm` (zod + react-hook-form),
  `TransactionList` (agrupada por día), `MovementsFilters` (buscador +
  panel desplegable con tipo / fechas / importe / categorías).
- **`budget/`**, **`calendar/`**, **`categories/`**, **`dashboard/`**,
  **`savings/`**, **`recurring/`**, **`import/`**, **`onboarding/`**,
  **`settings/`** — específicos de su área.

### `src/pages/`

Una página por ruta. No contienen lógica de datos pesada: orquestan
modales, leen hooks y pintan componentes.

## 3. Flujo de filtrado mensual y anual

`MonthProvider` (en `src/hooks/useMonth.jsx`) es el contexto que define **qué
rango se está mirando** en cada momento.

```js
const { month, viewMode, isYearView, rangeStart, rangeEnd, prev, next,
        goToToday, goToMonth, goToYear, setViewMode } = useMonth()
```

Reglas:

- `viewMode === 'month'` → `rangeStart` = primer día del mes,
  `rangeEnd` = primer día del mes siguiente.
- `viewMode === 'year'` → `rangeStart` = 1-ene del año,
  `rangeEnd` = 1-ene del año siguiente.
- **Todas** las queries que dependen del mes/año filtran por
  `occurred_on >= rangeStart && occurred_on < rangeEnd`. Nunca por
  `created_at`. Esto es **regla dura** (ver
  [ADR-0003](adr/0003-filtrar-por-occurred-on.md)).
- Al alternar Mes ↔ Año, el provider recuerda el último mes visto antes de
  pasar a Año (`useRef`) para restaurarlo al volver, en vez de plantarte en
  enero. Si nunca hubo un "mes previo", vuelve al mes actual real.

Páginas afectadas por `viewMode`:

| Página | Comportamiento en modo Año |
|---|---|
| Dashboard | Funciona, oculta `MonthBudgetBar` y `delta vs mes anterior`. |
| Movements | Lista el año entero. |
| Categories | No depende de mes/año. |
| Savings | Métricas mensuales (`useSavingsFromExpenses`) usan el rango actual. |
| Budget | Bloquea con mensaje "los presupuestos son mensuales" + botón a Mes. |
| Calendar | Bloquea con mensaje "el calendario es mensual" + botón a Mes. |

## 4. Categorías: activas vs archivadas

Tabla `categories` con `is_default` y `is_archived`. Reglas (ver
[ADR-0005](adr/0005-categorias-default-no-se-borran.md) y
[ADR-0006](adr/0006-archivar-categorias-en-vez-de-borrar.md)):

- **Default (`is_default = true`)**: se crean con un trigger al registrarse
  el usuario. No se pueden archivar ni eliminar. Sí renombrar y recolorear.
- **Custom**: pueden archivarse (`is_archived = true`) o restaurarse. La UI
  no expone borrado definitivo.
- `useCategories()` devuelve **solo activas** por defecto.
- `useCategories({ includeArchived: true })` para gestión (`/categorias`) y
  para el filtro de Movements (poder filtrar por una categoría temporal ya
  cerrada).
- En el filtro de Movements las archivadas se renderizan con icono Archive y
  opacidad reducida.

## 5. Presupuestos

Los presupuestos están **por mes** (tabla `budgets` con `(user_id, category_id,
month)`). Cada vez que entras a un mes nuevo y no tiene presupuesto definido,
`Budget.jsx` invoca `useCopyBudgetsFromPreviousMonth()` una sola vez
(idempotente por `localStorage`). Ver
[ADR-0004](adr/0004-presupuestos-por-mes-copiados.md).

## 6. Gastos recurrentes

`useRecurringExpenses` define plantillas. `useMaterializeRecurring()` se
ejecuta al entrar a un mes y crea los `transactions` que falten para ese mes
de forma idempotente (cada recurrente sabe en qué meses ya se ha generado).

## 7. Autenticación y RLS

- Login en `/login` con email/password o Google OAuth (Supabase Auth).
- Toda tabla con datos de usuario tiene una policy RLS `auth.uid() = user_id`.
  El cliente JS sólo ve las filas del usuario logueado, sin colar `WHERE`.
- `RequireAuth` redirige a `/login` si no hay sesión.
- `useAuthCacheSync` borra React Query cache y flags de `localStorage` cuando
  cambia el `user.id`, para evitar que un usuario vea cache del otro tras
  hacer logout/login.

## 8. PWA

Configurada con `vite-plugin-pwa` y `public/manifest.webmanifest`. Iconos en
`public/`. `theme_color` y `background_color` siguen el color del logo.

## 9. Decisiones explícitas pendientes / fuera de scope

- **Sin tests automatizados** (proyecto personal de momento).
- **Sin TypeScript** ([ADR-0002](adr/0002-javascript-en-vez-de-typescript.md)).
- **OneSignal oculto** hasta tener `VITE_ONESIGNAL_APP_ID` configurado en
  `.env.local` y Vercel. El componente y los hooks siguen en el repo.
- **Sin exportación/borrado de cuenta** (TODO en `Settings.jsx`).
