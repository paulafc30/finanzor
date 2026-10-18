-- Finanzor — "Vaciar hucha" = dar ese dinero por gastado, sin tocar el saldo.
--
-- Al aportar a la hucha (categoría Ahorro) el dinero ya sale del saldo como
-- un gasto. Vaciar la hucha NO debe crear ningún movimiento ni cambiar el
-- saldo: solo pone el contador de la hucha a cero. Para eso se registra cada
-- vaciado aquí, y la hucha muestra:
--
--     gastos de la categoría Ahorro − suma de piggy_withdrawals
--
-- (los movimientos de Ahorro se conservan intactos en Movimientos, Dashboard
-- y Presupuestos).
--
-- Esta migración también limpia la versión anterior del botón, que creaba un
-- ingreso "Hucha vaciada" en la categoría Ahorro y devolvía el dinero al
-- saldo: esos ingresos se convierten en vaciados y se borran de movimientos.
-- Idempotente.

create table if not exists public.piggy_withdrawals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  amount     numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_piggy_withdrawals_user on public.piggy_withdrawals(user_id);

alter table public.piggy_withdrawals enable row level security;

drop policy if exists "pw_select_own" on public.piggy_withdrawals;
drop policy if exists "pw_insert_own" on public.piggy_withdrawals;
drop policy if exists "pw_delete_own" on public.piggy_withdrawals;

create policy "pw_select_own" on public.piggy_withdrawals
  for select using (auth.uid() = user_id);
create policy "pw_insert_own" on public.piggy_withdrawals
  for insert with check (auth.uid() = user_id);
create policy "pw_delete_own" on public.piggy_withdrawals
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.piggy_withdrawals to authenticated;

-- Limpieza de la versión anterior: ingresos "Hucha vaciada" en Ahorro.
with legacy as (
  select t.id, t.user_id, t.amount, t.created_at
  from public.transactions t
  join public.categories c on c.id = t.category_id and c.user_id = t.user_id
  where t.type = 'income'
    and c.name = 'Ahorro'
    and t.description in ('Hucha vaciada', 'Piggy bank emptied')
),
moved as (
  insert into public.piggy_withdrawals (user_id, amount, created_at)
  select user_id, amount, created_at from legacy
  returning 1
)
delete from public.transactions where id in (select id from legacy);
