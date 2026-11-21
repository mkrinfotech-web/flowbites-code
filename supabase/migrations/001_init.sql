-- FlowBites initial schema + RLS
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text not null,
  pack_label text not null default 'Pack of 6',
  price_inr integer not null check (price_inr > 0),
  image_path text not null,
  badge text,
  shelf_color text default '#fa3558',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text not null,
  city text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  status text not null default 'pending'
    check (status in ('pending','paid','failed','refunded')),
  customer_name text,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb,
  subtotal_inr integer not null,
  discount_inr integer not null default 0,
  total_inr integer not null,
  discount_code_id uuid,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  loved_name text not null,
  percent_off integer not null check (percent_off between 1 and 50),
  session_id text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  order_id uuid references public.orders(id),
  created_at timestamptz not null default now()
);

alter table public.orders
  drop constraint if exists orders_discount_code_id_fkey;

alter table public.orders
  add constraint orders_discount_code_id_fkey
  foreign key (discount_code_id) references public.discount_codes(id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  unit_price_inr integer not null,
  quantity integer not null check (quantity > 0),
  line_total_inr integer not null
);

alter table public.products enable row level security;
alter table public.faqs enable row level security;
alter table public.testimonials enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.discount_codes enable row level security;

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read active faqs" on public.faqs;
create policy "Public read active faqs"
  on public.faqs for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read active testimonials" on public.testimonials;
create policy "Public read active testimonials"
  on public.testimonials for select to anon, authenticated
  using (is_active = true);

-- No anon policies on orders / order_items / discount_codes (service role only)
