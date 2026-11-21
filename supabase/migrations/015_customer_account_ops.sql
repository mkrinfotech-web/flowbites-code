-- Customer account ops: return requests + support category for returns
-- Depends on 004_flo_circle.sql, 008_order_verification.sql

create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null
    check (reason in (
      'damaged',
      'wrong_item',
      'quality',
      'changed_mind',
      'other'
    )),
  message text not null default '',
  status text not null default 'open'
    check (status in ('open','in_progress','approved','rejected','refunded','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id)
);

create index if not exists return_requests_user_idx
  on public.return_requests(user_id);
create index if not exists return_requests_status_idx
  on public.return_requests(status);

drop trigger if exists return_requests_updated_at on public.return_requests;
create trigger return_requests_updated_at
  before update on public.return_requests
  for each row execute function public.set_updated_at();

alter table public.return_requests enable row level security;

drop policy if exists "Own return requests" on public.return_requests;
create policy "Own return requests"
  on public.return_requests for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "Insert own return requests" on public.return_requests;
create policy "Insert own return requests"
  on public.return_requests for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Staff write return requests" on public.return_requests;
create policy "Staff write return requests"
  on public.return_requests for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Soft expand support categories for order help
alter table public.flo_support_tickets
  drop constraint if exists flo_support_tickets_category_check;

alter table public.flo_support_tickets
  add constraint flo_support_tickets_category_check
  check (category in (
    'cancel_membership',
    'cancel_sub',
    'general',
    'shipping',
    'order',
    'return'
  ));

-- Optional cancel audit on orders
alter table public.orders
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text;
