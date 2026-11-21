"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_LIBRARY_BUCKETS, isMediaBucket } from "@/lib/media";
import type { MediaBucket } from "@/lib/admin-utils";
import { Upload } from "lucide-react";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
}

export function MediaUploadForm({
  defaultBucket = "media",
}: {
  defaultBucket?: MediaBucket;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setProgress(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file") as File | null;
    const bucketRaw = String(fd.get("bucket") || "media");
    const folder = String(fd.get("folder") || "").trim().replace(/^\/+|\/+$/g, "");

    if (!file || file.size === 0) {
      setError("Choose a file to upload.");
      return;
    }
    if (!isMediaBucket(bucketRaw)) {
      setError("Pick a valid bucket.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const stamp = Date.now();
        const path = [folder, `${stamp}-${safeName(file.name)}`]
          .filter(Boolean)
          .join("/");

        setProgress("Uploading…");
        const { error: upErr } = await supabase.storage
          .from(bucketRaw)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream",
          });
        if (upErr) {
          setError(upErr.message);
          setProgress(null);
          return;
        }

        if (bucketRaw === "media") {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          await supabase.from("media_assets").upsert(
            {
              bucket: bucketRaw,
              path,
              mime_type: file.type || null,
              uploaded_by: user?.id ?? null,
            },
            { onConflict: "path" },
          );
        }

        formRef.current?.reset();
        setProgress(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setProgress(null);
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="mt-6 grid gap-3 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm md:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Bucket
        <select
          name="bucket"
          defaultValue={defaultBucket}
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        >
          {MEDIA_LIBRARY_BUCKETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Folder (optional)
        <input
          name="folder"
          placeholder="cms / products"
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        File
        <input
          name="file"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf"
          className="mt-1 w-full text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 self-end rounded-full bg-flo-pink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        <Upload className="h-4 w-4" />
        {pending ? progress || "Uploading…" : "Upload"}
      </button>
      {error ? (
        <p className="text-sm text-rose-700 md:col-span-4">{error}</p>
      ) : null}
    </form>
  );
}
