-- Finanzor — tabla de feedback (sugerencias y bugs).
-- Ejecutar en el SQL Editor de Supabase.

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  type        text not null check (type in ('suggestion', 'bug', 'other')),
  message     text not null,
  email       text,
  user_agent  text,
  app_version text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_feedback_created on public.feedback(created_at desc);

-- RLS: cualquier usuario autenticado puede dejar feedback,
-- y cada usuario solo puede leer su propio histórico.
alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_authenticated" on public.feedback;
drop policy if exists "feedback_select_own" on public.feedback;

create policy "feedback_insert_authenticated" on public.feedback
  for insert with check (auth.uid() is not null);

create policy "feedback_select_own" on public.feedback
  for select using (auth.uid() = user_id);

-- Para revisar TODO el feedback (de todos los usuarios), entra al SQL Editor de
-- Supabase con tu cuenta de admin y ejecuta:
--   select * from public.feedback order by created_at desc;
-- (el SQL Editor usa service_role internamente y bypassea RLS)
