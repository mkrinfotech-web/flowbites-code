import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKETS, type MediaBucket } from "@/lib/admin-utils";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import {
  MediaLibraryList,
  type MediaRow,
} from "@/components/admin/media-library-list";

async function listBucketFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: MediaBucket,
  prefix = "",
): Promise<MediaRow[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 200,
    sortBy: { column: "updated_at", order: "desc" },
  });
  if (error || !data) return [];

  const rows: MediaRow[] = [];
  for (const item of data) {
    if (!item.name || item.name === ".emptyFolderPlaceholder") continue;
    const isFolder = item.id == null;
    const path = prefix ? `${prefix}/${item.name}` : item.name;

    // Shallow recurse one level for common folders (products/, cms/, etc.)
    if (isFolder && !prefix) {
      const nested = await listBucketFiles(supabase, bucket, item.name);
      rows.push(...nested);
      continue;
    }
    if (isFolder) continue;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    rows.push({
      bucket,
      path,
      publicUrl,
      size:
        typeof item.metadata?.size === "number" ? item.metadata.size : null,
      updatedAt: item.updated_at ?? item.created_at ?? null,
    });
  }
  return rows;
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string }>;
}) {
  const params = await searchParams;
  const filterBucket = MEDIA_BUCKETS.includes(params.bucket as MediaBucket)
    ? (params.bucket as MediaBucket)
    : null;

  const supabase = await createClient();
  const buckets = filterBucket ? [filterBucket] : [...MEDIA_BUCKETS];
  const lists = await Promise.all(
    buckets.map((b) => listBucketFiles(supabase, b)),
  );
  const files = lists.flat().sort((a, b) => {
    const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return tb - ta;
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-flo-maroon">Media library</h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Upload, copy public URLs, or delete files in{" "}
        <code className="text-flo-pink">media</code> and{" "}
        <code className="text-flo-pink">product-images</code>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/media"
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            !filterBucket
              ? "bg-flo-pink text-white"
              : "bg-white/80 text-flo-maroon"
          }`}
        >
          All
        </Link>
        {MEDIA_BUCKETS.map((b) => (
          <Link
            key={b}
            href={`/admin/media?bucket=${b}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              filterBucket === b
                ? "bg-flo-pink text-white"
                : "bg-white/80 text-flo-maroon"
            }`}
          >
            {b}
          </Link>
        ))}
      </div>

      <MediaUploadForm defaultBucket={filterBucket ?? "media"} />
      <MediaLibraryList files={files} />
    </div>
  );
}
