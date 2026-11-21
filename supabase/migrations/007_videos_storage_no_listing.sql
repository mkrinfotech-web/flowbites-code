-- Tighten videos bucket SELECT: public CDN does not need listing.

drop policy if exists "Public read videos objects" on storage.objects;

drop policy if exists "Staff read videos objects" on storage.objects;
create policy "Staff read videos objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'videos' and public.is_staff());
