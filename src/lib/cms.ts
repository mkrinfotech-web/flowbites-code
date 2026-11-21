import { FAQS, TESTIMONIALS, type Faq, type Testimonial } from "@/lib/data";
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

/** Published blog posts. Returns [] if the posts table is missing or empty. */
export async function getPublishedPosts(): Promise<PostListItem[]> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("posts")
      .select(
        "id, slug, title, excerpt, cover_image_path, seo_title, seo_description, is_published, published_at, created_at, updated_at",
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    if (!error) return (data as PostListItem[] | null) ?? [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, slug, title, excerpt, cover_image_path, seo_title, seo_description, is_published, published_at, created_at, updated_at",
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    if (error) return [];
    return (data as PostListItem[] | null) ?? [];
  } catch {
    return [];
  }
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<PostRow | null> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("posts")
      .select(
        "id, slug, title, excerpt, body_md, cover_image_path, seo_title, seo_description, is_published, published_at, author_id, created_at, updated_at",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!error && data) return data as PostRow;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, slug, title, excerpt, body_md, cover_image_path, seo_title, seo_description, is_published, published_at, author_id, created_at, updated_at",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !data) return null;
    return data as PostRow;
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
