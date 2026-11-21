import type { MediaBucket } from "@/lib/admin-utils";

export const MEDIA_LIBRARY_BUCKETS = ["media", "product-images"] as const;

export function isMediaBucket(value: string): value is MediaBucket {
  return (MEDIA_LIBRARY_BUCKETS as readonly string[]).includes(value);
}
