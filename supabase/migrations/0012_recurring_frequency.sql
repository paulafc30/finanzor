-- Finanzor — añade frecuencia semanal a gastos/ingresos fijos.
--
-- Hasta ahora `recurring_expenses` solo sabía generar 1 movimiento al mes
-- (día fijo 1-28). Se añade `frequency` ('monthly' | 'weekly') y
-- `day_of_week` (0=domingo..6=sábado, igual que Date.getDay() en JS) para
-- los semanales. `day_of_month` pasa a ser opcional: solo se usa cuando
-- frequency='monthly'.
--
-- Los recurrentes existentes se marcan todos como 'monthly' (default),
-- así que no cambia nada para los datos ya creados.

alter table public.recurring_expenses
  add column if not exists frequency text not null default 'monthly'
    check (frequency in ('monthly', 'weekly'));

alter table public.recurring_expenses
  add column if not exists day_of_week int
    check (day_of_week is null or day_of_week between 0 and 6);

alter table public.recurring_expenses
  alter column day_of_month drop not null;

alter table public.recurring_expenses
  add constraint recurring_schedule_valid check (
    (frequency = 'monthly' and day_of_month is not null and day_of_week is null)
    or
    (frequency = 'weekly' and day_of_week is not null and day_of_month is null)
  );
