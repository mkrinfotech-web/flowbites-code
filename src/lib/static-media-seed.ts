/**
 * Known public/ storefront assets that admin can import into CMS tables
 * when the DB is empty (so founders see editable copies of live content).
 */

export const STATIC_STORY_VIDEOS = [
  {
    title: "Those days story 1",
    url: "/videos/testimonial-vid-1.mp4",
    poster: "/images/stories-posters/poster-1.jpg",
    placement: "stories" as const,
    sortOrder: 0,
  },
  {
    title: "Those days story 2",
    url: "/videos/testimonial-vid-2.mp4",
    poster: "/images/stories-posters/poster-2.jpg",
    placement: "stories" as const,
    sortOrder: 1,
  },
  {
    title: "Those days story 3",
    url: "/videos/testimonial-vid-3.mp4",
    poster: "/images/stories-posters/poster-3.jpg",
    placement: "stories" as const,
    sortOrder: 2,
  },
  {
    title: "Those days story 4",
    url: "/videos/testimonial-vid-4.mp4",
    poster: "/images/stories-posters/poster-4.jpg",
    placement: "stories" as const,
    sortOrder: 3,
  },
];

export const STATIC_SHOWCASE_VIDEOS = [
  {
    title: "Showcase 1",
    url: "/videos/showcase-vid-1.mp4",
    poster: null as string | null,
    placement: "showcase" as const,
    sortOrder: 10,
  },
  {
    title: "Showcase 2",
    url: "/videos/showcase-vid-2.mp4",
    poster: null as string | null,
    placement: "showcase" as const,
    sortOrder: 11,
  },
  {
    title: "Showcase 3",
    url: "/videos/showcase-vid-3.mp4",
    poster: null as string | null,
    placement: "showcase" as const,
    sortOrder: 12,
  },
  {
    title: "Showcase 4",
    url: "/videos/showcase-vid-4.mp4",
    poster: null as string | null,
    placement: "showcase" as const,
    sortOrder: 13,
  },
];

export const STATIC_HOMEPAGE_BANNERS = [
  {
    name: "Homepage hero bars",
    placement: "homepage_top" as const,
    headline: "Those Days? Snack Better.",
    body: "Hero product visual — Flo Bites bars.",
    cta_label: "Shop now",
    cta_href: "/#bestsellers",
    image_path: "/images/figma-exact/hero/group-3.png",
    sort_order: 0,
  },
  {
    name: "Homepage product strip",
    placement: "homepage_mid" as const,
    headline: "Craving Cruncher",
    body: "Dark chocolate Flo Bites for cravings on those days.",
    cta_label: "Add to bag",
    cta_href: "/#bestsellers",
    image_path: "/images/products/craving-cruncher.png",
    sort_order: 1,
  },
  {
    name: "Blog / stories promo",
    placement: "sitewide" as const,
    headline: "Tips & stories for those days",
    body: "Soft retail promo strip using the live blog visual.",
    cta_label: "Read the blog",
    cta_href: "/blog",
    image_path: "/images/website/blog-sec.png",
    sort_order: 2,
  },
  {
    name: "Checkout comfort",
    placement: "checkout" as const,
    headline: "You're almost there",
    body: "Checkout reassurance visual.",
    cta_label: null as string | null,
    cta_href: null as string | null,
    image_path: "/images/website/women-eating.png",
    sort_order: 3,
  },
];
