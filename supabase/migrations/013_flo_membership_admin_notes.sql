-- Flo Circle member CRM: staff-only notes on memberships
-- Depends on 004_flo_circle.sql

alter table public.flo_circle_memberships
  add column if not exists admin_notes text;
