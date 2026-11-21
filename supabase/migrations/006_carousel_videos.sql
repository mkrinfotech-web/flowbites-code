-- Carousel videos (stories + showcase) + public storage bucket

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  url text not null,
  poster text,
  storage_path text,
  poster_storage_path text,
  placement text not null default 'stories'
    check (placement in ('stories', 'showcase', 'both')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_placement_active_sort_idx
  on public.videos (placement, is_active, sort_order);

drop trigger if exists videos_updated_at on public.videos;
create trigger videos_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

alter table public.videos enable row level security;

drop policy if exists "Public read active videos" on public.videos;
create policy "Public read active videos"
  on public.videos for select to anon, authenticated
  using (is_active = true or public.is_staff());

drop policy if exists "Staff write videos" on public.videos;
create policy "Staff write videos"
  on public.videos for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Public videos bucket (quality-first uploads; large file limit)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  524288000,
  array[
    'video/mp4',
    'video/webm',
    'video/quicktime',
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

-- Public bucket CDN serves files by URL; avoid anonymous listing via SELECT.
drop policy if exists "Public read videos objects" on storage.objects;
drop policy if exists "Staff read videos objects" on storage.objects;
create policy "Staff read videos objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'videos' and public.is_staff());

drop policy if exists "Staff insert videos objects" on storage.objects;
create policy "Staff insert videos objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and public.is_staff());

drop policy if exists "Staff update videos objects" on storage.objects;
create policy "Staff update videos objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'videos' and public.is_staff())
  with check (bucket_id = 'videos' and public.is_staff());

drop policy if exists "Staff delete videos objects" on storage.objects;
create policy "Staff delete videos objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and public.is_staff());
