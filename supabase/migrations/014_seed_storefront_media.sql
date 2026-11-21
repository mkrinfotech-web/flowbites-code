-- Seed admin-editable copies of live storefront videos + banners.
-- FAQs (8) and testimonials (11) are already present; this only fills empty tables.
-- Video URLs point at public/ assets (same files the homepage already plays).

-- Stories carousel (placement = stories)
insert into public.videos (title, url, poster, placement, sort_order, is_active)
select v.title, v.url, v.poster, v.placement, v.sort_order, true
from (
  values
    ('Period story 1', '/videos/testimonial-vid-1.mp4', '/images/stories-posters/poster-1.jpg', 'stories', 0),
    ('Period story 2', '/videos/testimonial-vid-2.mp4', '/images/stories-posters/poster-2.jpg', 'stories', 1),
    ('Period story 3', '/videos/testimonial-vid-3.mp4', '/images/stories-posters/poster-3.jpg', 'stories', 2),
    ('Period story 4', '/videos/testimonial-vid-4.mp4', '/images/stories-posters/poster-4.jpg', 'stories', 3),
    ('Showcase 1', '/videos/showcase-vid-1.mp4', null, 'showcase', 10),
    ('Showcase 2', '/videos/showcase-vid-2.mp4', null, 'showcase', 11),
    ('Showcase 3', '/videos/showcase-vid-3.mp4', null, 'showcase', 12),
    ('Showcase 4', '/videos/showcase-vid-4.mp4', null, 'showcase', 13)
) as v(title, url, poster, placement, sort_order)
where not exists (
  select 1 from public.videos existing where existing.url = v.url
);

-- Homepage / promo banners from live site assets
insert into public.banners (
  name, placement, headline, body, cta_label, cta_href, image_path, is_active, sort_order
)
select b.name, b.placement, b.headline, b.body, b.cta_label, b.cta_href, b.image_path, true, b.sort_order
from (
  values
    (
      'Homepage hero bars',
      'homepage_top',
      'Your period week just got better.',
      'Hero product visual — Flo Bites bars.',
      'Shop now',
      '/#bestsellers',
      '/images/figma-exact/hero/group-3.png',
      0
    ),
    (
      'Homepage product strip',
      'homepage_mid',
      'Craving Cruncher',
      'Dark chocolate Flo Bites for period-week cravings.',
      'Add to bag',
      '/#bestsellers',
      '/images/products/craving-cruncher.png',
      1
    ),
    (
      'Blog / stories promo',
      'sitewide',
      'Period tips & stories',
      'Soft retail promo strip using the live blog visual.',
      'Read the blog',
      '/blog',
      '/images/website/blog-sec.png',
      2
    ),
    (
      'Checkout comfort',
      'checkout',
      'You''re almost there',
      'Checkout reassurance visual.',
      null,
      null,
      '/images/website/women-eating.png',
      3
    )
) as b(name, placement, headline, body, cta_label, cta_href, image_path, sort_order)
where not exists (select 1 from public.banners limit 1);
