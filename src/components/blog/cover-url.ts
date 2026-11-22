const MEDIA_BUCKET = "media";

/**
 * Public URL for a post cover: absolute URLs and site paths ("/images/...")
 * pass through; anything else is treated as a file in the `media` bucket.
 */
export function coverUrl(path: string | null | undefined): string | null {
  const value = path?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${value.replace(/^\/+/, "")}`;
}

export function formatPostDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
