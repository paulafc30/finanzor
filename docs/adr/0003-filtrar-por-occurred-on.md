# ADR-0003 — Filtrar por `occurred_on`, no por `created_at`

**Estado:** Aceptado. **Regla dura del proyecto.**
**Fecha:** Inicio del proyecto.

## Contexto

Una app de finanzas mes a mes tiene que dejar claro **a qué mes pertenece**
cada movimiento. Hay dos candidatos:

| Campo | Significado |
|---|---|
| `created_at` | Cuándo se registró en la app. |
| `occurred_on` | Cuándo ocurrió el gasto/ingreso en la vida real. |

Caso real: el día 2 de febrero me acuerdo de que el 30 de enero pagué algo.
Lo apunto con fecha 30 de enero. **Tiene que contar en enero**, no en
febrero.

## Decisión

Todas las queries y agregaciones que dependan de un mes o año filtran por
`transactions.occurred_on`:

```sql
SELECT ...
FROM transactions
WHERE occurred_on >= :rangeStart
  AND occurred_on <  :rangeEnd
```

`rangeStart` y `rangeEnd` vienen del provider global `useMonth` (ver
`ARCHITECTURE.md`, sección 3).

`created_at` solo se usa como **desempate** dentro del mismo `occurred_on`
para ordenar movimientos en la lista (el más recientemente añadido arriba).

## Consecuencias

✅ Comportamiento natural para el usuario: la fecha que él pone es la que
   manda.
✅ Importar CSV con fechas pasadas funciona sin truco.
✅ Editar la fecha de un movimiento lo cambia de mes automáticamente, sin
   tener que tocar `created_at`.

❌ Es fácil olvidarse y filtrar por `created_at` por reflejo: hay que
   tenerlo presente al añadir nuevas queries (cualquier KPI nuevo,
   exportación CSV futura, etc.).

## Aplicación

- `src/hooks/useTransactions.js`, `useBudgets.js`,
  `useAccumulatedBalance.js`, `usePreviousMonthSummary.js`,
  `useSavingsFromExpenses.js`, `useGoalContributions.js`.
- Filtros locales en `MovementsFilters.applyFilter()` comparan
  `t.occurred_on` contra `dateFrom`/`dateTo`.

## Test mental antes de hacer merge

> Si registro hoy un movimiento con fecha del mes pasado, ¿cuenta en el mes
> pasado? Si la respuesta es "no" en alguna pantalla, hay un bug.
