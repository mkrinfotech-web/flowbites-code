/**
 * Shared blog helpers (client- and server-safe; no Node or Supabase imports).
 */

export const BLOG_CATEGORIES = [
  { slug: "cycle-care", label: "Cycle Care" },
  { slug: "nutrition", label: "Nutrition" },
  { slug: "recipes", label: "Recipes" },
  { slug: "wellness", label: "Wellness" },
  { slug: "news", label: "News" },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];

export function isBlogCategory(value: string | null | undefined): value is BlogCategorySlug {
  return BLOG_CATEGORIES.some((c) => c.slug === value);
}

export function categoryLabel(slug: string | null | undefined): string | null {
  return BLOG_CATEGORIES.find((c) => c.slug === slug)?.label ?? null;
}

/** Estimated reading time in minutes (200 words per minute, minimum 1). */
export function readingMinutes(markdown: string | null | undefined): number {
  const words = (markdown ?? "")
    .replace(/\[\[product:[a-z0-9-]+\]\]/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Normalise a comma-separated tag string into a clean, de-duplicated list. */
export function parseTags(input: string | null | undefined): string[] {
  const seen = new Set<string>();
  for (const raw of (input ?? "").split(",")) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 40);
    if (tag) seen.add(tag);
  }
  return [...seen].slice(0, 12);
}

/**
 * Product card shortcode: a line containing only `[[product:<slug>]]` in the
 * post body. renderMarkdown() turns it into PRODUCT_CARD_PLACEHOLDER(slug),
 * and splitProductCards() lets the page swap that placeholder for a React card.
 */
export const PRODUCT_SHORTCODE_LINE = /^\[\[product:([a-z0-9-]+)\]\]$/;

export function productCardPlaceholder(slug: string): string {
  return `<div data-product-card="${slug}"></div>`;
}

export type ArticleSegment =
  | { type: "html"; html: string }
  | { type: "product"; slug: string };

export function splitProductCards(html: string): ArticleSegment[] {
  const out: ArticleSegment[] = [];
  const re = /<div data-product-card="([a-z0-9-]+)"><\/div>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m.index > last) out.push({ type: "html", html: html.slice(last, m.index) });
    out.push({ type: "product", slug: m[1] });
    last = m.index + m[0].length;
  }
  if (last < html.length) out.push({ type: "html", html: html.slice(last) });
  return out;
}
