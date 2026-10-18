-- Finanzor — reglas de categorización propias del usuario.
--
-- Complementan las reglas fijas de src/lib/categoryRules.js: el usuario
-- puede "recordar" que un comercio (palabra clave) va siempre a una
-- categoría. En la importación de CSV las reglas del usuario se evalúan
-- ANTES que las fijas.
--
-- `keyword` se guarda normalizado (minúsculas, sin tildes, 2-60 caracteres).
-- La política de INSERT/UPDATE comprueba además que la categoría sea del
-- propio usuario (la FK sola no lo garantiza).

create table if not exists public.category_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  keyword     text not null check (char_length(keyword) between 2 and 60 and keyword = lower(keyword)),
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, keyword)
);

create index if not exists idx_category_rules_user on public.category_rules(user_id);

alter table public.category_rules enable row level security;

drop policy if exists "cr_select_own" on public.category_rules;
drop policy if exists "cr_insert_own" on public.category_rules;
drop policy if exists "cr_update_own" on public.category_rules;
drop policy if exists "cr_delete_own" on public.category_rules;

create policy "cr_select_own" on public.category_rules
  for select using (auth.uid() = user_id);

create policy "cr_insert_own" on public.category_rules
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = auth.uid()
    )
  );

create policy "cr_update_own" on public.category_rules
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = auth.uid()
    )
  );

create policy "cr_delete_own" on public.category_rules
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.category_rules to authenticated;
