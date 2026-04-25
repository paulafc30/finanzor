-- Finanzor — Row-Level Security
-- Cada usuario solo ve y modifica sus propias filas.

-- ===== categories =====
alter table public.categories enable row level security;

drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;

create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- ===== transactions =====
alter table public.transactions enable row level security;

drop policy if exists "tx_select_own" on public.transactions;
drop policy if exists "tx_insert_own" on public.transactions;
drop policy if exists "tx_update_own" on public.transactions;
drop policy if exists "tx_delete_own" on public.transactions;

create policy "tx_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "tx_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "tx_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tx_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- ===== recurring_expenses =====
alter table public.recurring_expenses enable row level security;

drop policy if exists "rec_select_own" on public.recurring_expenses;
drop policy if exists "rec_insert_own" on public.recurring_expenses;
drop policy if exists "rec_update_own" on public.recurring_expenses;
drop policy if exists "rec_delete_own" on public.recurring_expenses;

create policy "rec_select_own" on public.recurring_expenses
  for select using (auth.uid() = user_id);
create policy "rec_insert_own" on public.recurring_expenses
  for insert with check (auth.uid() = user_id);
create policy "rec_update_own" on public.recurring_expenses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rec_delete_own" on public.recurring_expenses
  for delete using (auth.uid() = user_id);

-- ===== budgets =====
alter table public.budgets enable row level security;

drop policy if exists "bud_select_own" on public.budgets;
drop policy if exists "bud_insert_own" on public.budgets;
drop policy if exists "bud_update_own" on public.budgets;
drop policy if exists "bud_delete_own" on public.budgets;

create policy "bud_select_own" on public.budgets
  for select using (auth.uid() = user_id);
create policy "bud_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "bud_update_own" on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bud_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);

-- ===== goals =====
alter table public.goals enable row level security;

drop policy if exists "goal_select_own" on public.goals;
drop policy if exists "goal_insert_own" on public.goals;
drop policy if exists "goal_update_own" on public.goals;
drop policy if exists "goal_delete_own" on public.goals;

create policy "goal_select_own" on public.goals
  for select using (auth.uid() = user_id);
create policy "goal_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "goal_update_own" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goal_delete_own" on public.goals
  for delete using (auth.uid() = user_id);

-- ===== goal_contributions =====
alter table public.goal_contributions enable row level security;

drop policy if exists "gc_select_own" on public.goal_contributions;
drop policy if exists "gc_insert_own" on public.goal_contributions;
drop policy if exists "gc_update_own" on public.goal_contributions;
drop policy if exists "gc_delete_own" on public.goal_contributions;

create policy "gc_select_own" on public.goal_contributions
  for select using (auth.uid() = user_id);
create policy "gc_insert_own" on public.goal_contributions
  for insert with check (auth.uid() = user_id);
create policy "gc_update_own" on public.goal_contributions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "gc_delete_own" on public.goal_contributions
  for delete using (auth.uid() = user_id);
