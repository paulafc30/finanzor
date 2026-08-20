-- Finanzor — añade método de pago (tarjeta/efectivo) a los movimientos.
--
-- Se guarda como texto con check constraint, igual que `type`. Default
-- 'card' para no romper los movimientos ya existentes ni los inserts que
-- aún no mandan este campo (p.ej. la materialización de gastos/ingresos
-- fijos en useMaterializeRecurring, que de momento no lo setea).

alter table public.transactions
  add column if not exists payment_method text not null default 'card'
    check (payment_method in ('card', 'cash'));
