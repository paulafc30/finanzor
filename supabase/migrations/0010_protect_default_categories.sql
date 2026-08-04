-- Finanzor — protege las categorías por defecto a nivel de base de datos.
--
-- Hasta ahora la regla "las categorías is_default no se pueden borrar, solo
-- renombrar/recolorear" solo se comprobaba en el frontend (useCategories.js).
-- Cualquiera con su JWT podía llamar directo a la Data API de Supabase
-- (supabase.from('categories').delete().eq('id', <default>)) y saltársela,
-- rompiendo el mínimo garantizado de 9 categorías y las estadísticas que
-- dependen de ellas.
--
-- Esta migración lo bloquea con un trigger, sea cual sea el cliente que
-- haga la petición.

create or replace function public.protect_default_categories()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.is_default then
      raise exception 'No se puede eliminar una categoría por defecto (id=%). Solo se permite renombrar o recolorear.', OLD.id
        using errcode = '23514'; -- check_violation, para que el frontend lo distinga fácil
    end if;
    return OLD;
  end if;

  if TG_OP = 'UPDATE' then
    -- No se permite "desmarcar" ni "marcar" is_default desde fuera del seed inicial.
    if OLD.is_default is distinct from NEW.is_default then
      raise exception 'No se puede cambiar el estado "por defecto" de una categoría (id=%).', OLD.id
        using errcode = '23514';
    end if;

    -- Las categorías por defecto nunca se archivan (regla ya documentada en
    -- 0005_categories_archive.sql, aquí se hace cumplir de verdad).
    if OLD.is_default and NEW.is_archived then
      raise exception 'Una categoría por defecto (id=%) no se puede archivar.', OLD.id
        using errcode = '23514';
    end if;

    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_protect_default_categories_delete on public.categories;
create trigger trg_protect_default_categories_delete
  before delete on public.categories
  for each row execute function public.protect_default_categories();

drop trigger if exists trg_protect_default_categories_update on public.categories;
create trigger trg_protect_default_categories_update
  before update on public.categories
  for each row execute function public.protect_default_categories();
