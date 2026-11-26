import { PRODUCTS, type Product } from "@/lib/data";
import { parseProductContent } from "@/lib/product-content";
import { getSupabaseAdmin } from "@/lib/supabase";
import { unstable_noStore as noStore } from "next/cache";

function mapDbRow(row: {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  pack_label: string;
  price_inr: number;
  image_path: string;
  badge: string | null;
  shelf_color: string | null;
  edition?: string | null;
  content?: unknown;
}): Product {
  const fallback = PRODUCTS.find((p) => p.id === row.id || p.slug === row.slug);
  const content = parseProductContent(row.content, fallback?.content);
  const edition =
    row.edition === "flo" || row.edition === "flo_plus"
      ? row.edition
      : fallback?.edition;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline || content?.descriptionPunchy || fallback?.tagline || "",
    description:
      content?.descriptionFormal ||
      row.description ||
      fallback?.description ||
      "",
    packLabel: row.pack_label,
    priceInr: row.price_inr,
    imagePath: row.image_path,
    badge: row.badge ?? fallback?.badge ?? "",
    shelfColor: row.shelf_color ?? fallback?.shelfColor ?? "#fa3558",
    edition,
    ingredients: content?.ingredients?.length
      ? content.ingredients
      : fallback?.ingredients,
    cornerRibbon: fallback?.cornerRibbon,
    content,
  };
}

export async function getActiveProducts(): Promise<Product[]> {
  noStore();
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (!error && data?.length) {
      return data.map(mapDbRow);
    }
  }
  return PRODUCTS;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("products")
      .select("*")
      .eq("slug", normalized)
      .eq("is_active", true)
      .maybeSingle();
    if (!error && data) return mapDbRow(data);
  }

  return PRODUCTS.find((p) => p.slug === normalized) ?? null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await getActiveProducts();
  return products.map((p) => p.slug);
}
