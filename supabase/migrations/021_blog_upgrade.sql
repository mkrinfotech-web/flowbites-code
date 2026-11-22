-- Blog upgrade: categories, tags, author name, scheduled publishing.

alter table public.posts
  add column if not exists category text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists author_name text;

-- Scheduled posts (published_at in the future) stay hidden until that time.
drop policy if exists "Public read published posts" on public.posts;
create policy "Public read published posts"
  on public.posts for select to anon, authenticated
  using (is_published = true and (published_at is null or published_at <= now()));

create index if not exists posts_published_at_idx
  on public.posts (is_published, published_at desc);

create index if not exists posts_category_idx
  on public.posts (category);
