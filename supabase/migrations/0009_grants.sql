-- Finanzor — Grants explícitos para PostgREST / supabase-js
--
-- A partir del 30 mayo 2026, los proyectos nuevos de Supabase no exponen
-- automáticamente las tablas del schema public a la Data API.
-- Hay que conceder permisos explícitamente al rol `authenticated`.
-- RLS sigue activo: los grants solo permiten el acceso a nivel de rol;
-- las políticas de RLS siguen filtrando a nivel de fila.

-- Acceso al schema
grant usage on schema public to anon, authenticated;

-- categories
grant select, insert, update, delete on public.categories to authenticated;

-- transactions
grant select, insert, update, delete on public.transactions to authenticated;

-- recurring_expenses
grant select, insert, update, delete on public.recurring_expenses to authenticated;

-- budgets
grant select, insert, update, delete on public.budgets to authenticated;

-- goals
grant select, insert, update, delete on public.goals to authenticated;

-- goal_contributions
grant select, insert, update, delete on public.goal_contributions to authenticated;

-- feedback (solo insert + select propio; no delete ni update)
grant select, insert on public.feedback to authenticated;
