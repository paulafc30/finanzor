-- Permite "archivar" categorias personalizadas en vez de borrarlas.
--
-- Las archivadas:
--   - No aparecen en los selectores nuevos (formulario de movimientos,
--     presupuestos, importacion).
--   - Si aparecen en el filtro de Movimientos (marcadas con un icono)
--     para poder consultar el historico.
--   - Conservan su nombre y color para que los movimientos antiguos
--     sigan mostrandose correctamente en estadisticas.
--
-- Las categorias por defecto (is_default = true) NUNCA se archivan.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Indice parcial para acelerar el listado de activas (lo mas comun).
CREATE INDEX IF NOT EXISTS categories_active_idx
  ON categories (user_id)
  WHERE is_archived = FALSE;
