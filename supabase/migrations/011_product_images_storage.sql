-- Public product-images bucket for admin product uploads

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public CDN serves by URL; avoid anonymous listing via SELECT.
drop policy if exists "Public read product-images objects" on storage.objects;
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
