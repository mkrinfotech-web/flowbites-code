-- Order verification workflow + Flo Circle join flag + welcome email audit
-- Depends on 002_cms_admin.sql, 004_flo_circle.sql

-- ---------------------------------------------------------------------------
-- Orders: verified status + audit columns
-- ---------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'pending','paid','verified','processing','shipped','delivered',
    'failed','refunded','cancelled'
  ));

alter table public.orders
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists includes_flo_circle_join boolean not null default false;

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_verified_at_idx on public.orders(verified_at)
  where verified_at is not null;

-- ---------------------------------------------------------------------------
-- Memberships: avoid duplicate welcome emails
-- ---------------------------------------------------------------------------
alter table public.flo_circle_memberships
  add column if not exists welcome_email_sent_at timestamptz;
