-- Finanzor — 0014: límites de longitud en BD y límite de envíos de feedback.
--
-- Hasta ahora los máximos (descripción 120, nombres 40/60, feedback 2000) solo
-- se comprobaban en los formularios. Cualquiera con un JWT (incluidas las
-- cuentas anónimas de la demo) podía llamar a la API directamente y guardar
-- textos enormes. Se replican aquí como CHECK.
--
-- `not valid`: se aplican a toda inserción/actualización nueva sin bloquear
-- la migración si ya hubiera filas antiguas más largas.

alter table public.transactions        drop constraint if exists transactions_description_len;
alter table public.transactions        add  constraint transactions_description_len
  check (description is null or char_length(description) <= 120) not valid;

alter table public.categories          drop constraint if exists categories_name_len;
alter table public.categories          add  constraint categories_name_len
  check (char_length(name) between 1 and 40) not valid;

alter table public.goals               drop constraint if exists goals_name_len;
alter table public.goals               add  constraint goals_name_len
  check (char_length(name) between 1 and 60) not valid;

alter table public.recurring_expenses  drop constraint if exists recurring_name_len;
alter table public.recurring_expenses  add  constraint recurring_name_len
  check (char_length(name) between 1 and 60) not valid;

alter table public.feedback            drop constraint if exists feedback_message_len;
alter table public.feedback            add  constraint feedback_message_len
  check (char_length(message) between 1 and 2000) not valid;

alter table public.feedback            drop constraint if exists feedback_email_len;
alter table public.feedback            add  constraint feedback_email_len
  check (email is null or char_length(email) <= 254) not valid;

alter table public.feedback            drop constraint if exists feedback_user_agent_len;
alter table public.feedback            add  constraint feedback_user_agent_len
  check (user_agent is null or char_length(user_agent) <= 500) not valid;

-- Máximo 10 mensajes de feedback por usuario y hora.
create or replace function public.limit_feedback_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.feedback
      where user_id = NEW.user_id
        and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Demasiados mensajes de feedback. Inténtalo más tarde.'
      using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_limit_feedback_rate on public.feedback;
create trigger trg_limit_feedback_rate
  before insert on public.feedback
  for each row execute function public.limit_feedback_rate();
