-- Performance indexes + public image storage buckets for CMS / products.
--
-- Note (doc-only): the repo has two historical `006_*.sql` files
-- (`006_carousel_videos.sql` and `006_flo_circle_intro.sql`). Do not rename
-- them on remotes that already applied either — keep filenames as-is.

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

create index if not exists products_active_sort_idx
  on public.products (is_active, sort_order);

create index if not exists pages_published_idx
  on public.pages (is_published);

create index if not exists posts_published_idx
  on public.posts (is_published);

create index if not exists faqs_active_sort_idx
  on public.faqs (is_active, sort_order);

create index if not exists testimonials_active_sort_idx
  on public.testimonials (is_active, sort_order);

create index if not exists banners_active_placement_idx
  on public.banners (is_active, placement);

create index if not exists discount_codes_expires_idx
  on public.discount_codes (expires_at);

-- ---------------------------------------------------------------------------
-- Storage: product-images (admin product gallery) + media (CMS library)
-- Public buckets: CDN serves objects by URL; staff-only SELECT avoids listing.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- product-images policies
drop policy if exists "Staff read product-images objects" on storage.objects;
create policy "Staff read product-images objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "Staff insert product-images objects" on storage.objects;
create policy "Staff insert product-images objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "Staff update product-images objects" on storage.objects;
create policy "Staff update product-images objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_staff())
  with check (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "Staff delete product-images objects" on storage.objects;
create policy "Staff delete product-images objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_staff());

-- media policies
drop policy if exists "Staff read media objects" on storage.objects;
create policy "Staff read media objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_staff());

drop policy if exists "Staff insert media objects" on storage.objects;
create policy "Staff insert media objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());

drop policy if exists "Staff update media objects" on storage.objects;
create policy "Staff update media objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_staff())
  with check (bucket_id = 'media' and public.is_staff());

drop policy if exists "Staff delete media objects" on storage.objects;
create policy "Staff delete media objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_staff());
