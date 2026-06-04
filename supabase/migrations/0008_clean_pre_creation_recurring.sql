-- ──────────────────────────────────────────────────────────────────────
-- 0008: Limpiar movimientos materializados antes de la creacion del
-- recurrente que los origino.
-- ──────────────────────────────────────────────────────────────────────
--
-- ¿Por que?
-- Hasta la version anterior del codigo, navegar a un mes pasado en el
-- switcher disparaba `useMaterializeRecurring` y creaba en BBDD un
-- movimiento por cada gasto/ingreso fijo activo, aunque ese recurrente
-- no existiera todavia en ese mes. Resultado: nominas, alquileres y
-- gastos fijos aparecen en meses anteriores a su `created_at`, sumando
-- al saldo cosas que no debian existir.
--
-- Esta migracion borra todas esas transacciones huerfanas:
--   t.recurring_id IS NOT NULL
--   AND t.occurred_on < primer_dia_del_mes( r.created_at )
--
-- Las transacciones manuales (sin recurring_id) NO se tocan. Tampoco las
-- de meses iguales o posteriores al de creacion del recurrente.
--
-- IDEMPOTENTE: re-ejecutarla no hace nada si ya esta limpio.
--
-- IMPORTANTE: si tienes algun movimiento manual con la misma descripcion
-- que un recurrente pero `recurring_id IS NULL`, NO se borrara — solo
-- se eliminan los materializados (los que tienen ese enlace).

DO $$
DECLARE
  deleted_count int;
BEGIN
  WITH del AS (
    DELETE FROM transactions t
    USING recurring_expenses r
    WHERE t.recurring_id = r.id
      AND t.occurred_on < date_trunc('month', r.created_at)::date
    RETURNING t.id
  )
  SELECT count(*) INTO deleted_count FROM del;

  RAISE NOTICE 'Eliminadas % transacciones materializadas antes de la creacion de su recurrente.', deleted_count;
END $$;
