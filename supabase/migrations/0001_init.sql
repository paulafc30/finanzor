-- Finanzor — schema inicial
-- Ejecutar en el SQL Editor de Supabase

-- Para gen_random_uuid()
create extension if not exists "pgcrypto";

-- =====================================================
-- categories
-- =====================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  icon        text,
  color       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_categories_user on public.categories(user_id);
create unique index if not exists uq_categories_user_name on public.categories(user_id, name);

-- =====================================================
-- recurring_expenses
-- =====================================================
create table if not exists public.recurring_expenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  amount        numeric(12,2) not null check (amount >= 0),
  category_id   uuid references public.categories(id) on delete set null,
  day_of_month  int not null check (day_of_month between 1 and 28),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_recurring_user on public.recurring_expenses(user_id);

-- =====================================================
-- transactions
-- =====================================================
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('income','expense')),
  amount        numeric(12,2) not null check (amount >= 0),
  description   text,
  category_id   uuid references public.categories(id) on delete set null,
  occurred_on   date not null,                                  -- fecha real del movimiento
  recurring_id  uuid references public.recurring_expenses(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- IMPORTANTE: filtros por mes usan occurred_on, no created_at
create index if not exists idx_tx_user_occurred on public.transactions(user_id, occurred_on desc);
create index if not exists idx_tx_user_category on public.transactions(user_id, category_id);

-- =====================================================
-- budgets (presupuesto por categoría y mes)
-- =====================================================
create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  month        date not null,                                   -- siempre día 1 del mes
  amount       numeric(12,2) not null check (amount >= 0),
  unique (user_id, category_id, month)
);

create index if not exists idx_budgets_user_month on public.budgets(user_id, month);

-- =====================================================
-- goals (metas de ahorro)
-- =====================================================
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  target_amount  numeric(12,2) not null check (target_amount > 0),
  target_date    date,
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_goals_user on public.goals(user_id);

-- =====================================================
-- goal_contributions (aportaciones a metas)
-- =====================================================
create table if not exists public.goal_contributions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  goal_id         uuid not null references public.goals(id) on delete cascade,
  amount          numeric(12,2) not null check (amount > 0),
  contributed_on  date not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_contrib_goal on public.goal_contributions(goal_id);
create index if not exists idx_contrib_user_date on public.goal_contributions(user_id, contributed_on desc);
