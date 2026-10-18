-- Finanzor — amplía los datos de la demo con las funciones nuevas.
--
-- Sustituye `seed_demo_data()` (0013) por una versión que además siembra:
--   · un cargo mensual de Netflix SIN recurrente  → "Suscripciones detectadas"
--   · 14 gastos pequeños de los últimos 30 días   → "Gastos hormiga"
--   · una regla de categorización de ejemplo      → "Reglas automáticas"
--     (solo si existe la tabla `category_rules`, migración 0015)
--
-- Las funciones de previsión, proyección de metas y hucha ya tienen datos con
-- el seed original (recurrentes, metas con aportaciones y categoría Ahorro).
-- Se ajusta el "Fondo de emergencia" (150 €/mes) para que la proyección
-- muestre una meta que llega a tiempo y otra que no (Viaje a Japón), y el
-- presupuesto de Ahorro sube a 300 €.
--
-- Orden recomendado: 0015 y después esta. Las cuentas de demo ya creadas
-- conservan sus datos; las nuevas usan esta versión. Idempotente.

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
        ('Gimnasio', 30.00), ('Ahorro', 300.00)
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
      ('Fondo de emergencia', 2000.00, 14, 150.00, 6)
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
  -- ── (0016) Datos para las funciones nuevas ───────────────────────────

  -- Netflix cada mes SIN estar dado de alta como recurrente: la tarjeta
  -- "Suscripciones detectadas" tiene algo que proponer. Con m >= 1 siempre
  -- hay 3 cargos en el pasado, así que se detecta aunque estemos a principios
  -- de mes.
  select id into cat_id from public.categories where user_id = uid and name = 'Ocio';
  for m in reverse 3..0 loop
    occurred := (month0 - make_interval(months => m))::date + 8; -- día 9
    continue when occurred > current_date;
    insert into public.transactions
      (user_id, type, amount, description, category_id, occurred_on, payment_method)
    values (uid, 'expense', 12.99, 'Netflix', cat_id, occurred, 'card');
  end loop;

  -- Gastos hormiga de los últimos 30 días (importes <= 10 €, irregulares
  -- a propósito para que no se confundan con una suscripción).
  for r in
    select * from (values
      ('Cafetería',       1, 1.60, 'Comida'),
      ('Panadería',       2, 2.35, 'Comida'),
      ('Kiosco',          4, 3.20, 'Caprichos'),
      ('Cafetería',       5, 1.80, 'Comida'),
      ('Chuches',         7, 2.50, 'Caprichos'),
      ('Máquina vending', 9, 1.50, 'Comida'),
      ('Panadería',      10, 2.10, 'Comida'),
      ('Cafetería',      12, 1.60, 'Comida'),
      ('Kiosco',         14, 4.80, 'Caprichos'),
      ('Cafetería',      16, 1.90, 'Comida'),
      ('Panadería',      19, 2.35, 'Comida'),
      ('Chuches',        21, 1.70, 'Caprichos'),
      ('Cafetería',      23, 1.60, 'Comida'),
      ('Kiosco',         26, 3.60, 'Caprichos')
    ) as t(descr, days_ago, amount, cat)
  loop
    select id into cat_id from public.categories where user_id = uid and name = r.cat;
    insert into public.transactions
      (user_id, type, amount, description, category_id, occurred_on, payment_method)
    values (uid, 'expense', r.amount, r.descr, cat_id, current_date - r.days_ago, 'cash');
  end loop;

  -- Una regla de categorización propia de ejemplo. Solo si ya se aplicó la
  -- migración 0015 (así esta función no falla si falta esa tabla).
  if to_regclass('public.category_rules') is not null then
    insert into public.category_rules (user_id, keyword, category_id)
    select uid, 'netflix', id
    from public.categories
    where user_id = uid and name = 'Ocio'
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.seed_demo_data() from public, anon;
grant execute on function public.seed_demo_data() to authenticated;
