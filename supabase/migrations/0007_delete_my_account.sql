-- ──────────────────────────────────────────────────────────────────────
-- 0007: Funcion RPC para que un usuario borre todos sus datos
-- ──────────────────────────────────────────────────────────────────────
--
-- Permite al usuario "vaciar su cuenta" desde la app: borra todas sus
-- filas en las tablas de dominio. El registro en `auth.users` NO se
-- elimina (eso requiere service_role); si el usuario quiere darse de
-- baja del todo, puede pedirlo desde Supabase Dashboard o hacerlo via
-- una Edge Function en el futuro.
--
-- Efecto practico: al volver a iniciar sesion con el mismo email, ve la
-- app como una cuenta nueva (sin movimientos, ni categorias, ni metas).
--
-- SECURITY DEFINER: la funcion corre con permisos del propietario para
-- poder sortear RLS, pero internamente solo borra filas donde
-- user_id = auth.uid(). Es decir, el llamante NO puede borrar datos de
-- otros usuarios aunque pase parametros.

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Orden de borrado respetando dependencias.
  -- Las FKs entre tablas de dominio tienen ON DELETE SET NULL o CASCADE,
  -- asi que con borrar fila a fila aqui basta.

  DELETE FROM goal_contributions   WHERE user_id = uid;
  DELETE FROM goals                WHERE user_id = uid;
  DELETE FROM transactions         WHERE user_id = uid;
  DELETE FROM budgets              WHERE user_id = uid;
  DELETE FROM recurring_expenses   WHERE user_id = uid;
  DELETE FROM categories           WHERE user_id = uid;

  -- Feedback opcional: si la tabla `feedback` tiene `user_id`, lo borramos.
  -- Lo envolvemos en un bloque por si la columna no existiera en una
  -- instalacion antigua.
  BEGIN
    DELETE FROM feedback WHERE user_id = uid;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    -- silenciar: no impide el borrado del resto
    NULL;
  END;
END;
$$;

-- Cualquier usuario autenticado puede llamarla (afectara solo a sus
-- propios datos por la comprobacion interna).
REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
