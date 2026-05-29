# ADR-0004 — Presupuestos por mes copiados, no plantilla única

**Estado:** Aceptado.
**Fecha:** Inicio del proyecto.

## Contexto

Cada mes el usuario quiere fijar un tope de gasto por categoría
("Alimentación 400 €", "Ocio 100 €"…). Hay dos modelos posibles:

1. **Plantilla única**: una sola fila por (usuario, categoría) que se aplica
   a todos los meses por igual.
2. **Filas por mes**: una fila por (usuario, categoría, mes), independientes.

La plantilla única es más compacta pero no permite:

- Ver presupuestos pasados sin perder histórico al cambiar uno actual.
- Que diciembre tenga 600 € en "Ocio" porque viene Navidad y febrero 80 €
  porque está apretado.
- Decir "este mes lo dejo en 0" sin perder el valor habitual del resto del
  año.

## Decisión

**Una fila por (`user_id`, `category_id`, `month`)** en la tabla
`budgets`, con `month` = primer día del mes (`YYYY-MM-01`).

Cuando el usuario entra a un mes nuevo y no tiene presupuesto definido,
`Budget.jsx` invoca `useCopyBudgetsFromPreviousMonth()` **una sola vez**.
La operación es idempotente y registra en `localStorage` que ya se intentó,
para respetar la decisión del usuario si decide vaciarlos a propósito.

`amount = 0` se interpreta como "sin presupuesto en esta categoría este mes"
y la mutación `useUpsertBudget` con `amount === 0` borra la fila para no
acumular ruido.

## Consecuencias

✅ Histórico mensual real y modificable.
✅ Variaciones estacionales naturales.
✅ Un cambio en el mes actual no contamina meses anteriores.

❌ Más filas en la BBDD (12 × categorías por usuario y año). Aceptable a
   nuestra escala.
❌ La copia automática puede confundir si el usuario vaciaba a propósito;
   por eso lleva tracker en `localStorage` y aviso visible (`justCopied`).

## Referencia en código

- `src/hooks/useBudgets.js` — `useBudgets`, `useBudgetSummary`,
  `useUpsertBudget`, `useCopyBudgetsFromPreviousMonth`.
- `src/pages/Budget.jsx` — orquesta la copia automática.
- `supabase/migrations/0001_init.sql` — tabla `budgets` con índice único
  `(user_id, category_id, month)`.
