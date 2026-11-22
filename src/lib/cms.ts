import { FAQS, TESTIMONIALS, type Faq, type Testimonial } from "@/lib/data";
import { readingMinutes } from "@/lib/blog";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export type BannerPlacement =
  | "homepage_top"
  | "homepage_mid"
  | "sitewide"
  | "checkout";

export type BannerRow = {
  id: string;
  name: string;
  placement: BannerPlacement;
  headline: string | null;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_path: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export type PostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_path: string | null;
  category: string | null;
  tags: string[];
  author_name: string | null;
  reading_minutes?: number;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PostRow = PostListItem & {
  body_md: string;
  author_id: string | null;
};

/** Active FAQs for the homepage; falls back to static copy when empty. */
export async function getActiveFaqs(): Promise<Faq[]> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("faqs")
      .select("id, question, answer, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (!error && data?.length) {
      return data.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
      }));
    }
    if (!error) return FAQS;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("id, question, answer, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return FAQS;
    return data.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    }));
  } catch {
    return FAQS;
  }
}

/** Active testimonials for the homepage; falls back to static copy when empty. */
export async function getActiveTestimonials(): Promise<Testimonial[]> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("testimonials")
      .select("id, quote, author_name, city, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (!error && data?.length) {
      return data.map((t) => ({
        id: t.id,
        quote: t.quote,
        authorName: t.author_name,
        city: t.city,
      }));
    }
    if (!error) return TESTIMONIALS;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("id, quote, author_name, city, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return TESTIMONIALS;
    return data.map((t) => ({
      id: t.id,
      quote: t.quote,
      authorName: t.author_name,
      city: t.city,
    }));
  } catch {
    return TESTIMONIALS;
  }
}

const POST_LIST_COLUMNS =
  "id, slug, title, excerpt, cover_image_path, category, tags, author_name, seo_title, seo_description, is_published, published_at, created_at, updated_at";
const POST_FULL_COLUMNS = `${POST_LIST_COLUMNS}, body_md, author_id`;

function liveFilter() {
  return `published_at.is.null,published_at.lte.${new Date().toISOString()}`;
}

function normalisePost<T extends PostListItem>(row: T): T {
  const body = (row as { body_md?: string }).body_md;
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
    reading_minutes: readingMinutes(body),
  };
}

/** List rows carry reading time only; the markdown body is dropped. */
function toListItem(row: PostListItem & { body_md?: string }): PostListItem {
  const { body_md: _body, ...rest } = normalisePost(row);
  void _body;
  return rest;
}

export type PostQuery = { category?: string; tag?: string; limit?: number };

async function queryPosts(opts: PostQuery): Promise<PostListItem[]> {
  const build = (client: NonNullable<ReturnType<typeof getSupabaseAdmin>>) => {
    let q = client
      .from("posts")
      .select(`${POST_LIST_COLUMNS}, body_md`)
      .eq("is_published", true)
      .or(liveFilter())
      .order("published_at", { ascending: false, nullsFirst: false });
    if (opts.category) q = q.eq("category", opts.category);
    if (opts.tag) q = q.contains("tags", [opts.tag]);
    if (opts.limit) q = q.limit(opts.limit);
    return q;
  };

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await build(admin);
    if (!error) return ((data as unknown as PostListItem[] | null) ?? []).map(toListItem);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await build(
      supabase as unknown as NonNullable<ReturnType<typeof getSupabaseAdmin>>,
    );
    if (error) return [];
    return ((data as unknown as PostListItem[] | null) ?? []).map(toListItem);
  } catch {
    return [];
  }
}

/** Published, non-scheduled blog posts. Returns [] if the posts table is missing or empty. */
export async function getPublishedPosts(
  opts: PostQuery = {},
): Promise<PostListItem[]> {
  return queryPosts(opts);
}

export async function getLatestPosts(limit = 3): Promise<PostListItem[]> {
  return queryPosts({ limit });
}

/** Same category first, then shared tags, then latest. Excludes the post itself. */
export async function getRelatedPosts(
  post: Pick<PostListItem, "id" | "category" | "tags">,
  limit = 3,
): Promise<PostListItem[]> {
  const all = (await queryPosts({})).filter((p) => p.id !== post.id);
  const tags = new Set(post.tags ?? []);
  const scored = all.map((p, index) => ({
    p,
    index,
    sameCategory: Boolean(post.category) && p.category === post.category,
    shared: (p.tags ?? []).filter((t) => tags.has(t)).length,
  }));
  scored.sort((a, b) => {
    if (a.sameCategory !== b.sameCategory) return a.sameCategory ? -1 : 1;
    if (a.shared !== b.shared) return b.shared - a.shared;
    return a.index - b.index;
  });
  return scored.slice(0, limit).map((x) => x.p);
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<PostRow | null> {
  const build = (client: NonNullable<ReturnType<typeof getSupabaseAdmin>>) =>
    client
      .from("posts")
      .select(POST_FULL_COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .or(liveFilter())
      .maybeSingle();

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await build(admin);
    if (!error && data) return normalisePost(data as unknown as PostRow);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await build(
      supabase as unknown as NonNullable<ReturnType<typeof getSupabaseAdmin>>,
    );
    if (error || !data) return null;
    return normalisePost(data as unknown as PostRow);
  } catch {
    return null;
  }
}

function filterLiveBanners(rows: BannerRow[]): BannerRow[] {
  const now = Date.now();
  return rows.filter((b) => {
    if (b.starts_at && new Date(b.starts_at).getTime() > now) return false;
    if (b.ends_at && new Date(b.ends_at).getTime() <= now) return false;
    return true;
  });
}

export async function getActiveBanners(
  placement?: BannerPlacement,
): Promise<BannerRow[]> {
  const admin = getSupabaseAdmin();
  if (admin) {
    let query = admin
      .from("banners")
      .select(
        "id, name, placement, headline, body, cta_label, cta_href, image_path, is_active, sort_order, starts_at, ends_at, created_at",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (placement) query = query.eq("placement", placement);
    const { data, error } = await query;
    if (!error) return filterLiveBanners((data as BannerRow[] | null) ?? []);
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("banners")
      .select(
        "id, name, placement, headline, body, cta_label, cta_href, image_path, is_active, sort_order, starts_at, ends_at, created_at",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (placement) query = query.eq("placement", placement);
    const { data, error } = await query;
    if (error) return [];
    return filterLiveBanners((data as BannerRow[] | null) ?? []);
  } catch {
    return [];
  }
}
