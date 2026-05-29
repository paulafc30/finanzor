# ADR-0006 — Archivar categorías custom en vez de borrar

**Estado:** Aceptado.
**Fecha:** Mayo 2026.

## Contexto

Caso de uso real: creo una categoría "Viaje Madrid" para apuntar gastos
durante dos meses, luego termina el viaje y ya no la necesito.

Si la **borro**:

- Los movimientos antiguos pasan a `category_id = NULL` (regla
  `ON DELETE SET NULL` del esquema).
- En el histórico aparecen como "Sin categoría", pierdo el contexto
  ("¿esto qué era?").
- El donut de gastos por categoría del mes pasado deja de mostrar el
  bloque "Viaje Madrid".

Si la **mantengo**:

- El selector del formulario nuevo se ensucia con categorías que ya no uso.
- El donut del mes actual muestra categorías con 0 €.

## Decisión

Las categorías custom se **archivan** (`is_archived = true`), no se
borran:

- Salen del listado de selectores nuevos (formulario, presupuestos,
  importación).
- **Siguen visibles** en el filtro de Movimientos para poder consultar el
  histórico (marcadas con icono Archive + opacidad reducida).
- Los movimientos antiguos siguen mostrando la categoría con su nombre y
  color.
- Pueden **restaurarse** desde `/categorias` con un toggle "Ver
  archivadas".
- Las categorías default ([ADR-0005](0005-categorias-default-no-se-borran.md))
  no se archivan.

El borrado definitivo (`useDeleteCategory`) sigue existiendo en el código
pero **no se expone desde la UI**, para evitar perder histórico por
accidente.

## Consecuencias

✅ Histórico íntegro: el donut de "Viaje Madrid mes 1" sigue funcionando.
✅ Selectores limpios.
✅ Reversible: si el viaje vuelve a hacerse, una pulsación de "Restaurar".
✅ Filtro de movimientos sigue siendo útil para gastos pasados.

❌ Crecimiento monótono de la tabla `categories` (en la práctica
   despreciable: docenas, no miles).
❌ Si en algún momento Paula renombra una archivada al mismo nombre que una
   nueva, choca con el índice único `(user_id, name)` — error claro: "Ya
   tienes una categoría con ese nombre".

## Aplicación

- `supabase/migrations/0005_categories_archive.sql` — añade columna
  `is_archived` + índice parcial sobre activas.
- `src/hooks/useCategories.js` — `useCategories({ includeArchived })`,
  `useArchiveCategory`, `useUnarchiveCategory`.
- `src/pages/Categories.jsx` — UI con toggle "Ver archivadas".
- `src/components/transactions/MovementsFilters.jsx` — pasa
  `includeArchived: true` para poder filtrar histórico.
