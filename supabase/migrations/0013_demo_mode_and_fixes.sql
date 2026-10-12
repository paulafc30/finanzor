-- Finanzor — 0013: modo demo + correcciones de la auditoría.
--
-- 1) protect_default_categories: dejaba sin efecto el borrado de cuenta.
--    El `ON DELETE CASCADE` desde auth.users también dispara el trigger
--    BEFORE DELETE de categories, así que borrar un usuario fallaba por sus
--    categorías por defecto. Ahora el borrado se permite cuando el dueño
--    ya no existe en auth.users (es decir, es un borrado en cascada).
-- 2) delete_my_account: se elimina. Ya no la usa el frontend (lo hace la
--    Edge Function delete-account) y, con el trigger anterior, fallaría.
-- 3) feedback: la policy de INSERT permitía insertar con el user_id de otro.
-- 4) seed_demo_data(): rellena una cuenta anónima con datos de ejemplo para
--    el botón "Ver demo sin registrarme".
-- 5) cleanup_stale_demo_users(): limpieza de cuentas anónimas antiguas.
--
-- REQUISITO: activar "Allow anonymous sign-ins" en Supabase →
-- Authentication → Sign In / Providers.

-- ───────────────────────── 1) Trigger de categorías ─────────────────────
create or replace function public.protect_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.is_default
       and exists (select 1 from auth.users u where u.id = OLD.user_id) then
      raise exception 'No se puede eliminar una categoría por defecto (id=%). Solo se permite renombrar o recolorear.', OLD.id
        using errcode = '23514';
    end if;
    return OLD;
  end if;

  if TG_OP = 'UPDATE' then
    if OLD.is_default is distinct from NEW.is_default then
      raise exception 'No se puede cambiar el estado "por defecto" de una categoría (id=%).', OLD.id
        using errcode = '23514';
    end if;

    if OLD.is_default and NEW.is_archived then
      raise exception 'Una categoría por defecto (id=%) no se puede archivar.', OLD.id
        using errcode = '23514';
    end if;

    return NEW;
  end if;

  return NEW;
end;
$$;

-- ───────────────────────── 2) RPC obsoleta ──────────────────────────────
drop function if exists public.delete_my_account();

-- ───────────────────────── 3) Policy de feedback ────────────────────────
drop policy if exists "feedback_insert_authenticated" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert with check (auth.uid() = user_id);

-- ───────────────────────── 4) Datos de demo ─────────────────────────────
-- Solo para usuarios anónimos (is_anonymous = true en el JWT): una cuenta
-- real nunca puede ser "rellenada" con datos de ejemplo. Es idempotente:
-- si el usuario ya tiene movimientos no hace nada.
-- Las fechas son relativas a hoy, así la demo siempre se ve "viva".
create or replace function public.seed_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid        uuid := auth.uid();
  month0     date := date_trunc('month', current_date)::date;
  m          int;
  base       date;
  occurred   date;
  r          record;
  cat_id     uuid;
  rec_id     uuid;
  tx_id      uuid;
  goal_id    uuid;
  factor     numeric;
  idx        int := 0;
  rec_ids    jsonb := '{}'::jsonb;
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;
  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'El modo demo solo está disponible para cuentas anónimas';
  end if;
  if exists (select 1 from public.transactions where user_id = uid) then
    return; -- ya sembrada
  end if;

  -- Gastos / ingresos fijos (monthly). created_at antiguo para que el
  -- "materializador" del frontend no los duplique.
  for r in
    select * from (values
      ('Alquiler',      'expense', 'Vivienda', 650.00, 1),
      ('Gimnasio',      'expense', 'Gimnasio',  29.90, 5),
      ('Spotify',       'expense', 'Ocio',      10.99, 7),
      ('Nómina',        'income',  'Otros',   1650.00, 2)
    ) as t(name, type, cat, amount, day)
  loop
    select id into cat_id from public.categories where user_id = uid and name = r.cat;
    insert into public.recurring_expenses
      (user_id, name, amount, category_id, day_of_month, frequency, type, created_at)
    values
      (uid, r.name, r.amount, cat_id, r.day, 'monthly', r.type, now() - interval '4 months')
    returning id into rec_id;
    rec_ids := rec_ids || jsonb_build_object(r.name, rec_id);
  end loop;

  -- Movimientos de los últimos 3 meses (m = 2 → hace dos meses, 0 → este).
  for m in reverse 2..0 loop
    base := (month0 - make_interval(months => m))::date;
    idx := 0;
    for r in
      select * from (values
        ('Alquiler',            'expense', 'Vivienda',   650.00,  1, 'card', true),
        ('Nómina',              'income',  'Otros',     1650.00,  2, 'card', true),
        ('Gimnasio',            'expense', 'Gimnasio',    29.90,  5, 'card', true),
        ('Spotify',             'expense', 'Ocio',        10.99,  7, 'card', true),
        ('Supermercado',        'expense', 'Comida',      58.40,  3, 'card', false),
        ('Supermercado',        'expense', 'Comida',      73.15, 10, 'card', false),
        ('Mercado de frutas',   'expense', 'Comida',      21.80, 14, 'cash', false),
        ('Supermercado',        'expense', 'Comida',      66.90, 17, 'card', false),
        ('Supermercado',        'expense', 'Comida',      49.25, 24, 'card', false),
        ('Gasolina',            'expense', 'Transporte',  47.00,  8, 'card', false),
        ('Gasolina',            'expense', 'Transporte',  41.50, 22, 'card', false),
        ('Cena con amigos',     'expense', 'Ocio',        38.00, 12, 'card', false),
        ('Cine',                'expense', 'Ocio',        18.50, 19, 'cash', false),
        ('Farmacia',            'expense', 'Salud',       14.60, 15, 'card', false),
        ('Café y tostada',      'expense', 'Caprichos',    6.80, 11, 'cash', false),
        ('Ropa',                'expense', 'Caprichos',   54.99, 20, 'card', false)
      ) as t(descr, type, cat, amount, day, pm, is_fixed)
    loop
      idx := idx + 1;
      occurred := base + (r.day - 1);
      continue when occurred > current_date;
      select id into cat_id from public.categories where user_id = uid and name = r.cat;
      -- Variación determinista ±4 % para que los meses no sean idénticos
      -- (los fijos se mantienen exactos).
      factor := case when r.is_fixed then 1
                     else 1 + (((m * 7 + idx * 3) % 5) - 2) / 50.0 end;
      insert into public.transactions
        (user_id, type, amount, description, category_id, occurred_on, recurring_id, payment_method)
      values
        (uid, r.type, round(r.amount * factor, 2), r.descr, cat_id, occurred,
         case when r.is_fixed then (rec_ids ->> r.descr)::uuid else null end,
         r.pm);
    end loop;
  end loop;

  -- Presupuestos del mes actual y del anterior
  for m in 0..1 loop
    base := (month0 - make_interval(months => m))::date;
    for r in
      select * from (values
        ('Vivienda', 650.00), ('Comida', 300.00), ('Transporte', 100.00),
        ('Ocio', 90.00), ('Salud', 40.00), ('Caprichos', 70.00),
        ('Gimnasio', 30.00), ('Ahorro', 250.00)
      ) as t(cat, amount)
    loop
      select id into cat_id from public.categories where user_id = uid and name = r.cat;
      insert into public.budgets (user_id, category_id, month, amount)
      values (uid, cat_id, base, r.amount)
      on conflict (user_id, category_id, month) do nothing;
    end loop;
  end loop;

  -- Metas de ahorro con aportaciones (cada aportación genera su movimiento
  -- en la categoría "Ahorro", igual que hace el frontend).
  select id into cat_id from public.categories where user_id = uid and name = 'Ahorro';
  for r in
    select * from (values
      ('Viaje a Japón',      3000.00, 10, 150.00, 5),
      ('Fondo de emergencia', 2000.00, 14, 100.00, 6)
    ) as t(name, target, months_ahead, monthly, day)
  loop
    insert into public.goals (user_id, name, target_amount, target_date)
    values (uid, r.name, r.target, (month0 + make_interval(months => r.months_ahead))::date)
    returning id into goal_id;

    for m in reverse 2..0 loop
      occurred := (month0 - make_interval(months => m))::date + (r.day - 1);
      continue when occurred > current_date;
      insert into public.transactions
        (user_id, type, amount, description, category_id, occurred_on)
      values (uid, 'expense', r.monthly, 'Ahorro: ' || r.name, cat_id, occurred)
      returning id into tx_id;
      insert into public.goal_contributions
        (user_id, goal_id, amount, contributed_on, transaction_id)
      values (uid, goal_id, r.monthly, occurred, tx_id);
    end loop;
  end loop;
end;
$$;

revoke all on function public.seed_demo_data() from public, anon;
grant execute on function public.seed_demo_data() to authenticated;

-- ───────────────────────── 5) Limpieza de demos ─────────────────────────
-- Borra cuentas anónimas con más de `max_age_days` días. Los datos caen en
-- cascada. No es invocable desde la app (sin GRANT); ejecútala a mano en el
-- SQL Editor o prográmala con pg_cron:
--   select cron.schedule('limpiar-demos', '0 4 * * *',
--     $$ select public.cleanup_stale_demo_users(7) $$);
create or replace function public.cleanup_stale_demo_users(max_age_days int default 7)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  n int;
begin
  delete from auth.users
  where is_anonymous
    and created_at < now() - make_interval(days => max_age_days);
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.cleanup_stale_demo_users(int) from public, anon, authenticated;
