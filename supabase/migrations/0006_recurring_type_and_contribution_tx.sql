-- ──────────────────────────────────────────────────────────────────────
-- 0006: Soporte de ingresos fijos + enlace contribuciones <-> movimientos
-- ──────────────────────────────────────────────────────────────────────
--
-- 1) `recurring_expenses` ya servia para gastos fijos. Anadimos columna
--    `type` para tambien modelar ingresos fijos (nomina, alquileres
--    cobrados, etc.) sin tener que duplicar tabla.
--
-- 2) `goal_contributions` ahora guarda opcionalmente el `transaction_id`
--    del movimiento que se creo automaticamente cuando el usuario aporto
--    a la meta. Asi al borrar el aporte borramos tambien su movimiento,
--    y evitamos duplicarlos en estadisticas.
--
-- Idempotente: usa IF NOT EXISTS para poder re-ejecutar.

-- 1) Tipo en recurrentes
ALTER TABLE recurring_expenses
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense'
    CHECK (type IN ('expense', 'income'));

-- Indice por (user_id, type) para listar separadamente sin escanear todo
CREATE INDEX IF NOT EXISTS recurring_expenses_user_type_idx
  ON recurring_expenses (user_id, type);

-- 2) FK contribuciones -> transacciones
ALTER TABLE goal_contributions
  ADD COLUMN IF NOT EXISTS transaction_id UUID
    REFERENCES transactions (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS goal_contributions_transaction_idx
  ON goal_contributions (transaction_id)
  WHERE transaction_id IS NOT NULL;
