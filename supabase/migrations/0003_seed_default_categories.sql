-- Finanzor — al crearse un usuario nuevo, le sembramos las 9 categorías por defecto.
-- Cada usuario podrá luego renombrarlas, cambiar color/icono o eliminarlas.

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, icon, color, is_default) values
    (new.id, 'Vivienda',   'home',         '#7c5cff', true),
    (new.id, 'Ahorro',     'piggy-bank',   '#22c55e', true),
    (new.id, 'Comida',     'utensils',     '#f59e0b', true),
    (new.id, 'Gimnasio',   'dumbbell',     '#06b6d4', true),
    (new.id, 'Salud',      'heart-pulse',  '#ef4444', true),
    (new.id, 'Caprichos',  'sparkles',     '#ec4899', true),
    (new.id, 'Transporte', 'car',          '#3b82f6', true),
    (new.id, 'Ocio',       'gamepad-2',    '#a855f7', true),
    (new.id, 'Otros',      'circle',       '#94a3b8', true);
  return new;
end;
$$;

drop trigger if exists trg_seed_default_categories on auth.users;

create trigger trg_seed_default_categories
  after insert on auth.users
  for each row execute function public.seed_default_categories();
