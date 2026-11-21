-- FloBites CMS + Admin schema extension
-- Depends on 001_init.sql

-- ---------------------------------------------------------------------------
-- Alter products: inventory + gallery
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists stock_qty integer not null default 0
    check (stock_qty >= 0),
  add column if not exists images jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Alter orders: ops statuses + fulfillment
-- ---------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'pending','paid','processing','shipped','delivered',
    'failed','refunded','cancelled'
  ));

alter table public.orders
  add column if not exists admin_notes text,
  add column if not exists shipped_at timestamptz,
  add column if not exists tracking_number text;

-- ---------------------------------------------------------------------------
-- Alter discount_codes: manual promos + Love Score
-- ---------------------------------------------------------------------------
alter table public.discount_codes
  alter column loved_name drop not null;

alter table public.discount_codes
  alter column session_id drop not null;

alter table public.discount_codes
  add column if not exists kind text not null default 'love_score'
    check (kind in ('love_score','manual')),
  add column if not exists max_uses integer,
  add column if not exists use_count integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_by uuid references auth.users(id);

-- ---------------------------------------------------------------------------
-- Staff profiles (1:1 with auth.users)
-- Roles: admin (full) | staff (orders-focused)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'staff'
    check (role in ('admin','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CMS pages
-- ---------------------------------------------------------------------------
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  type text not null default 'custom'
    check (type in (
      'policy','landing','about','contact','ingredient','custom'
    )),
  body_md text not null default '',
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  sort_order integer not null default 0,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Blog posts
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body_md text not null default '',
  cover_image_path text,
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  author_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Site banners
-- ---------------------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  placement text not null
    check (placement in (
      'homepage_top','homepage_mid','sitewide','checkout'
    )),
  headline text,
  body text,
  cta_label text,
  cta_href text,
  image_path text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Media library metadata
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null unique,
  alt text,
  mime_type text,
  width integer,
  height integer,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role = 'admin'
  );
$$;

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
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists pages_updated_at on public.pages;
create trigger pages_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.pages enable row level security;
alter table public.posts enable row level security;
alter table public.banners enable row level security;
alter table public.media_assets enable row level security;

-- Profiles
drop policy if exists "Staff read own profile" on public.profiles;
create policy "Staff read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Admin manage profiles" on public.profiles;
create policy "Admin manage profiles"
  on public.profiles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Products: staff write
drop policy if exists "Staff read all products" on public.products;
create policy "Staff read all products"
  on public.products for select to authenticated
  using (public.is_staff());

drop policy if exists "Staff write products" on public.products;
create policy "Staff write products"
  on public.products for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- FAQs / testimonials write
drop policy if exists "Admin write faqs" on public.faqs;
create policy "Admin write faqs"
  on public.faqs for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Admin write testimonials" on public.testimonials;
create policy "Admin write testimonials"
  on public.testimonials for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Orders: staff can read + update status
drop policy if exists "Staff read orders" on public.orders;
create policy "Staff read orders"
  on public.orders for select to authenticated
  using (public.is_staff());

drop policy if exists "Staff update orders" on public.orders;
create policy "Staff update orders"
  on public.orders for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Staff read order items" on public.order_items;
create policy "Staff read order items"
  on public.order_items for select to authenticated
  using (public.is_staff());

-- Discount codes: staff read, admin write
drop policy if exists "Staff read discounts" on public.discount_codes;
create policy "Staff read discounts"
  on public.discount_codes for select to authenticated
  using (public.is_staff());

drop policy if exists "Staff write discounts" on public.discount_codes;
create policy "Staff write discounts"
  on public.discount_codes for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Pages: public read published; staff full
drop policy if exists "Public read published pages" on public.pages;
create policy "Public read published pages"
  on public.pages for select to anon, authenticated
  using (is_published = true or public.is_staff());

drop policy if exists "Staff write pages" on public.pages;
create policy "Staff write pages"
  on public.pages for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Posts
drop policy if exists "Public read published posts" on public.posts;
create policy "Public read published posts"
  on public.posts for select to anon, authenticated
  using (is_published = true or public.is_staff());

drop policy if exists "Staff write posts" on public.posts;
create policy "Staff write posts"
  on public.posts for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Banners
drop policy if exists "Public read active banners" on public.banners;
create policy "Public read active banners"
  on public.banners for select to anon, authenticated
  using (
    (is_active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now()))
    or public.is_staff()
  );

drop policy if exists "Staff write banners" on public.banners;
create policy "Staff write banners"
  on public.banners for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Media
drop policy if exists "Public read media" on public.media_assets;
create policy "Public read media"
  on public.media_assets for select to anon, authenticated
  using (true);

drop policy if exists "Staff write media" on public.media_assets;
create policy "Staff write media"
  on public.media_assets for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());
