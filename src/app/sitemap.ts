import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";
import { getAllProductSlugs } from "@/lib/products";
import { getSupabaseAdmin } from "@/lib/supabase";

/** CMS slugs via service role only — sitemap must not use cookie/session clients. */
async function publishedCmsSlugs(): Promise<string[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("pages")
    .select("slug")
    .eq("is_published", true);
  return (data ?? []).map((p) => p.slug);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: origin,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${origin}/flo-circle`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const productSlugs = await getAllProductSlugs();
  const productRoutes: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${origin}/product/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const slugs = await publishedCmsSlugs();
  const cmsRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${origin}/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...cmsRoutes];
}
