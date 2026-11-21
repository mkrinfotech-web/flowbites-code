"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_LIBRARY_BUCKETS } from "@/lib/media";
import type { MediaBucket } from "@/lib/admin-utils";
import { Upload } from "lucide-react";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
}

type Props = {
  /** Hidden input name written with the final URL/path */
  name?: string;
  label?: string;
  defaultValue?: string | null;
  bucket?: MediaBucket;
  folder?: string;
  required?: boolean;
  /** Show optional path/URL override under the file picker */
  showUrlOverride?: boolean;
  className?: string;
};

/**
 * Soft-retail image field: file upload + live preview + optional URL override.
 * Uploads to Supabase Storage and writes the public URL into a hidden input.
 */
export function ImageUploadField({
  name = "imagePath",
  label = "Image",
  defaultValue = "",
  bucket = "media",
  folder = "cms",
  required = false,
  showUrlOverride = true,
  className = "",
}: Props) {
  const id = useId();
  const [value, setValue] = useState(defaultValue ?? "");
  const [preview, setPreview] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(file: File | null) {
    setError(null);
    if (!file || file.size === 0) return;

    if (!MEDIA_LIBRARY_BUCKETS.includes(bucket)) {
      setError("Invalid storage bucket.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const supabase = createClient();
      const path = [folder, `${Date.now()}-${safeName(file.name)}`]
        .filter(Boolean)
        .join("/");
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });
      if (upErr) {
        setError(upErr.message);
        setUploading(false);
        return;
      }
      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data
        .publicUrl;
      setValue(publicUrl);
      setPreview(publicUrl);
      URL.revokeObjectURL(localUrl);

      if (bucket === "media") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase.from("media_assets").upsert(
          {
            bucket,
            path,
            mime_type: file.type || null,
            uploaded_by: user?.id ?? null,
          },
          { onConflict: "path" },
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input type="hidden" name={name} value={value} required={required} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-flo-blush ring-1 ring-flo-maroon/10">
          {preview ? (
            <Image
              src={preview}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={preview.startsWith("blob:")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-flo-maroon/35">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <label
            htmlFor={id}
            className="block text-xs font-bold uppercase text-flo-maroon/60"
          >
            {label}
            <input
              id={id}
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm font-normal normal-case file:mr-3 file:rounded-full file:border-0 file:bg-flo-pink/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-flo-maroon"
            />
          </label>
          {uploading ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-flo-maroon/70">
              <Upload className="h-3.5 w-3.5 animate-pulse" /> Uploading…
            </p>
          ) : null}
          {error ? (
            <p className="text-xs font-medium text-rose-600">{error}</p>
          ) : null}
        </div>
      </div>

      {showUrlOverride ? (
        <label className="block text-[11px] font-bold uppercase tracking-wide text-flo-maroon/45">
          Or path / URL override
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setPreview(e.target.value);
            }}
            placeholder="/images/… or https://…"
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm font-normal normal-case text-flo-ink"
          />
        </label>
      ) : null}
    </div>
  );
}
