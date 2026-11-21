-- Flo Circle: memberships, auto-delivery, portal, gifts, events
-- Depends on 001_init + 002_cms_admin

-- ---------------------------------------------------------------------------
-- Profiles: allow customer role; default new signups to customer
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'staff', 'customer'));

alter table public.profiles alter column role set default 'customer';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.is_customer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role = 'customer'
  );
$$;

-- ---------------------------------------------------------------------------
-- Site settings (discount stack mode, etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value) values
  ('discount_stack_mode', '"best_of_one"'::jsonb),
  ('flo_circle_member_percent', '20'::jsonb),
  ('subscribe_save_percent', '20'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------
create table if not exists public.flo_circle_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  duration_days integer not null check (duration_days > 0),
  price_inr integer not null check (price_inr > 0),
  razorpay_plan_id text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  perks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Member profiles & addresses
-- ---------------------------------------------------------------------------
create table if not exists public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  member_id text unique not null,
  full_name text,
  phone text,
  email text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists member_addresses_user_idx on public.member_addresses(user_id);

-- ---------------------------------------------------------------------------
-- Memberships
-- ---------------------------------------------------------------------------
create table if not exists public.flo_circle_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.flo_circle_plans(id),
  status text not null default 'pending'
    check (status in ('active','paused','past_due','cancelled','expired','pending')),
  started_at timestamptz,
  ends_at timestamptz,
  paused_at timestamptz,
  cancelled_at timestamptz,
  razorpay_subscription_id text unique,
  razorpay_customer_id text,
  cancel_reason text,
  auto_renew boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flo_memberships_user_idx on public.flo_circle_memberships(user_id);
create index if not exists flo_memberships_status_idx on public.flo_circle_memberships(status);

-- ---------------------------------------------------------------------------
-- Auto-delivery subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.flo_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid references public.flo_circle_memberships(id) on delete set null,
  status text not null default 'pending'
    check (status in ('active','paused','skipped','cancelled','past_due','pending')),
  cadence_days integer not null default 30 check (cadence_days > 0),
  next_ship_at timestamptz,
  paused_at timestamptz,
  cancelled_at timestamptz,
  skip_until timestamptz,
  razorpay_subscription_id text,
  shipping_address_id uuid references public.member_addresses(id) on delete set null,
  discount_percent integer not null default 20,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flo_subs_user_idx on public.flo_subscriptions(user_id);
create index if not exists flo_subs_next_ship_idx on public.flo_subscriptions(next_ship_at);

create table if not exists public.flo_subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.flo_subscriptions(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price_inr integer not null check (unit_price_inr > 0)
);

-- ---------------------------------------------------------------------------
-- Savings ledger
-- ---------------------------------------------------------------------------
create table if not exists public.flo_savings_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  membership_id uuid references public.flo_circle_memberships(id) on delete set null,
  source text not null
    check (source in ('flo_circle','subscribe_save','love_score','coupon','other')),
  amount_inr integer not null check (amount_inr >= 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists flo_savings_user_idx on public.flo_savings_ledger(user_id);

-- ---------------------------------------------------------------------------
-- Perks
-- ---------------------------------------------------------------------------
create table if not exists public.flo_perks (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.flo_member_perks (
  membership_id uuid not null references public.flo_circle_memberships(id) on delete cascade,
  perk_id uuid not null references public.flo_perks(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (membership_id, perk_id)
);

-- ---------------------------------------------------------------------------
-- Gifts
-- ---------------------------------------------------------------------------
create table if not exists public.flo_gifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid references public.flo_circle_memberships(id) on delete set null,
  title text not null,
  kind text not null default 'manual'
    check (kind in ('join','milestone','event','manual')),
  status text not null default 'queued'
    check (status in ('queued','assigned','shipped','delivered','cancelled')),
  trigger_key text,
  notes text,
  assigned_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  shipped_at timestamptz
);

create index if not exists flo_gifts_status_idx on public.flo_gifts(status);

-- ---------------------------------------------------------------------------
-- Events & launches
-- ---------------------------------------------------------------------------
create table if not exists public.flo_events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description_md text not null default '',
  event_at timestamptz not null,
  location text,
  is_published boolean not null default false,
  max_rsvp integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flo_event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.flo_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'going'
    check (status in ('going','waitlist','cancelled')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.flo_launches (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  teaser text,
  body_md text not null default '',
  goes_live_at timestamptz,
  is_published boolean not null default false,
  early_access_members_only boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Support tickets
-- ---------------------------------------------------------------------------
create table if not exists public.flo_support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null
    check (category in ('cancel_membership','cancel_sub','general','shipping')),
  reason_code text,
  message text not null default '',
  status text not null default 'open'
    check (status in ('open','in_progress','closed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders extensions
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists is_member_order boolean not null default false,
  add column if not exists is_priority boolean not null default false,
  add column if not exists discount_source text,
  add column if not exists discount_percent integer not null default 0,
  add column if not exists membership_id uuid references public.flo_circle_memberships(id) on delete set null,
  add column if not exists subscription_id uuid references public.flo_subscriptions(id) on delete set null;

create index if not exists orders_user_idx on public.orders(user_id);

-- ---------------------------------------------------------------------------
-- Updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists flo_plans_updated_at on public.flo_circle_plans;
create trigger flo_plans_updated_at
  before update on public.flo_circle_plans
  for each row execute function public.set_updated_at();

drop trigger if exists member_profiles_updated_at on public.member_profiles;
create trigger member_profiles_updated_at
  before update on public.member_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists flo_memberships_updated_at on public.flo_circle_memberships;
create trigger flo_memberships_updated_at
  before update on public.flo_circle_memberships
  for each row execute function public.set_updated_at();

drop trigger if exists flo_subs_updated_at on public.flo_subscriptions;
create trigger flo_subs_updated_at
  before update on public.flo_subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists flo_gifts_updated_at on public.flo_gifts;
create trigger flo_gifts_updated_at
  before update on public.flo_gifts
  for each row execute function public.set_updated_at();

drop trigger if exists flo_events_updated_at on public.flo_events;
create trigger flo_events_updated_at
  before update on public.flo_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed plans, perks, sample event/launch
-- ---------------------------------------------------------------------------
insert into public.flo_circle_plans (slug, name, description, duration_days, price_inr, sort_order, perks)
values
  ('monthly', 'Monthly', 'Flexible month-to-month Flo Circle membership', 30, 299, 1,
    '["20% off every order","Priority packing","Member gifts","Early access","Events"]'::jsonb),
  ('quarterly', '3 Months', 'Best starter — three months of circle benefits', 90, 799, 2,
    '["20% off every order","Priority packing","Member gifts","Early access","Events","Milestone gift"]'::jsonb),
  ('biannual', '6 Months', 'Half-year commitment, bigger savings rhythm', 180, 1499, 3,
    '["20% off every order","Priority packing","Member gifts","Early access","Events","Milestone gift"]'::jsonb),
  ('yearly', 'Yearly', 'Full year in the circle — best value', 365, 2499, 4,
    '["20% off every order","Priority packing","Member gifts","Early access","Events","Milestone + anniversary gifts"]'::jsonb)
on conflict (slug) do nothing;

insert into public.flo_perks (key, title, description, sort_order) values
  ('discount_20', '20% off every order', 'Always-on member pricing on shop orders', 1),
  ('priority', 'Priority packing', 'Member orders get priority attention', 2),
  ('subscribe_save', 'Subscribe & save', 'Optional auto-delivery at 20% off', 3),
  ('gifts', 'Member gifts', 'Join and milestone gifts', 4),
  ('early_access', 'Early access launches', 'See new drops before everyone else', 5),
  ('events', 'Member events', 'RSVP to Flo Circle moments', 6)
on conflict (key) do nothing;

insert into public.flo_events (slug, title, description_md, event_at, location, is_published, max_rsvp)
values (
  'circle-welcome-2026',
  'Flo Circle Welcome Hour',
  'A soft retail hangout for new members — cycle tips, product Q&A, and community.',
  now() + interval '45 days',
  'Online (Zoom link emailed)',
  true,
  100
)
on conflict (slug) do nothing;

insert into public.flo_launches (slug, title, teaser, body_md, goes_live_at, is_published, early_access_members_only)
values (
  'new-flavor-preview',
  'New flavor preview',
  'Members peek first.',
  'Early access for Flo Circle members before public launch.',
  now() + interval '21 days',
  true,
  true
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.flo_circle_plans enable row level security;
alter table public.member_profiles enable row level security;
alter table public.member_addresses enable row level security;
alter table public.flo_circle_memberships enable row level security;
alter table public.flo_subscriptions enable row level security;
alter table public.flo_subscription_items enable row level security;
alter table public.flo_savings_ledger enable row level security;
alter table public.flo_perks enable row level security;
alter table public.flo_member_perks enable row level security;
alter table public.flo_gifts enable row level security;
alter table public.flo_events enable row level security;
alter table public.flo_event_rsvps enable row level security;
alter table public.flo_launches enable row level security;
alter table public.flo_support_tickets enable row level security;

-- site_settings: public read
drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings"
  on public.site_settings for select to anon, authenticated using (true);

drop policy if exists "Staff write site settings" on public.site_settings;
create policy "Staff write site settings"
  on public.site_settings for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- plans
drop policy if exists "Public read active plans" on public.flo_circle_plans;
create policy "Public read active plans"
  on public.flo_circle_plans for select to anon, authenticated
  using (is_active = true or public.is_staff());

drop policy if exists "Staff write plans" on public.flo_circle_plans;
create policy "Staff write plans"
  on public.flo_circle_plans for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- member_profiles
drop policy if exists "Own member profile" on public.member_profiles;
create policy "Own member profile"
  on public.member_profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

drop policy if exists "Update own member profile" on public.member_profiles;
create policy "Update own member profile"
  on public.member_profiles for update to authenticated
  using (id = auth.uid() or public.is_staff())
  with check (id = auth.uid() or public.is_staff());

drop policy if exists "Insert own member profile" on public.member_profiles;
create policy "Insert own member profile"
  on public.member_profiles for insert to authenticated
  with check (id = auth.uid() or public.is_staff());

-- addresses
drop policy if exists "Own addresses" on public.member_addresses;
create policy "Own addresses"
  on public.member_addresses for all to authenticated
  using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

-- memberships
drop policy if exists "Own memberships" on public.flo_circle_memberships;
create policy "Own memberships"
  on public.flo_circle_memberships for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "Staff write memberships" on public.flo_circle_memberships;
create policy "Staff write memberships"
  on public.flo_circle_memberships for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- subscriptions
drop policy if exists "Own subscriptions" on public.flo_subscriptions;
create policy "Own subscriptions"
  on public.flo_subscriptions for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "Staff write subscriptions" on public.flo_subscriptions;
create policy "Staff write subscriptions"
  on public.flo_subscriptions for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Own subscription items" on public.flo_subscription_items;
create policy "Own subscription items"
  on public.flo_subscription_items for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.flo_subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "Staff write subscription items" on public.flo_subscription_items;
create policy "Staff write subscription items"
  on public.flo_subscription_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- savings
drop policy if exists "Own savings" on public.flo_savings_ledger;
create policy "Own savings"
  on public.flo_savings_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "Staff write savings" on public.flo_savings_ledger;
create policy "Staff write savings"
  on public.flo_savings_ledger for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- perks
drop policy if exists "Public read perks" on public.flo_perks;
create policy "Public read perks"
  on public.flo_perks for select to anon, authenticated
  using (is_active = true or public.is_staff());

drop policy if exists "Staff write perks" on public.flo_perks;
create policy "Staff write perks"
  on public.flo_perks for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Own member perks" on public.flo_member_perks;
create policy "Own member perks"
  on public.flo_member_perks for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.flo_circle_memberships m
      where m.id = membership_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "Staff write member perks" on public.flo_member_perks;
create policy "Staff write member perks"
  on public.flo_member_perks for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- gifts
drop policy if exists "Own gifts" on public.flo_gifts;
create policy "Own gifts"
  on public.flo_gifts for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "Staff write gifts" on public.flo_gifts;
create policy "Staff write gifts"
  on public.flo_gifts for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- events
drop policy if exists "Public read events" on public.flo_events;
create policy "Public read events"
  on public.flo_events for select to anon, authenticated
  using (is_published = true or public.is_staff());

drop policy if exists "Staff write events" on public.flo_events;
create policy "Staff write events"
  on public.flo_events for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Own rsvps" on public.flo_event_rsvps;
create policy "Own rsvps"
  on public.flo_event_rsvps for all to authenticated
  using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

-- launches
drop policy if exists "Public read launches" on public.flo_launches;
create policy "Public read launches"
  on public.flo_launches for select to anon, authenticated
  using (
    (is_published = true and early_access_members_only = false)
    or public.is_staff()
    or (
      is_published = true
      and early_access_members_only = true
      and exists (
        select 1 from public.flo_circle_memberships m
        where m.user_id = auth.uid() and m.status = 'active'
      )
    )
  );

drop policy if exists "Staff write launches" on public.flo_launches;
create policy "Staff write launches"
  on public.flo_launches for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- support
drop policy if exists "Own support tickets" on public.flo_support_tickets;
create policy "Own support tickets"
  on public.flo_support_tickets for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "Insert own support tickets" on public.flo_support_tickets;
create policy "Insert own support tickets"
  on public.flo_support_tickets for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Staff write support tickets" on public.flo_support_tickets;
create policy "Staff write support tickets"
  on public.flo_support_tickets for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Customer can read own orders
drop policy if exists "Customer read own orders" on public.orders;
create policy "Customer read own orders"
  on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "Customer read own order items" on public.order_items;
create policy "Customer read own order items"
  on public.order_items for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );
