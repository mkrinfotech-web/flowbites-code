"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { deleteMediaObjectAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import type { MediaBucket } from "@/lib/admin-utils";
import { Check, Copy, Trash2 } from "lucide-react";

export type MediaRow = {
  bucket: MediaBucket;
  path: string;
  publicUrl: string;
  size: number | null;
  updatedAt: string | null;
};

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(url);
}

function formatBytes(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryList({ files }: { files: MediaRow[] }) {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function copyUrl(url: string, key: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Could not copy — select the URL manually.");
    }
  }

  function onDelete(bucket: MediaBucket, path: string) {
    setError(null);
    const fd = new FormData();
    fd.set("bucket", bucket);
    fd.set("path", path);
    startTransition(async () => {
      const res = await deleteMediaObjectAction(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (files.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-flo-maroon/20 bg-white/50 p-8 text-center text-sm text-flo-ink/55">
        No files yet — upload to <code className="text-flo-pink">media</code> or{" "}
        <code className="text-flo-pink">product-images</code>.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {error ? (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {files.map((f) => {
          const key = `${f.bucket}:${f.path}`;
          return (
            <article
              key={key}
              className="overflow-hidden rounded-2xl border border-flo-maroon/10 bg-white/75 shadow-sm"
            >
              <div className="relative flex h-36 items-center justify-center bg-flo-blush/40">
                {isImageUrl(f.publicUrl) ? (
                  <Image
                    src={f.publicUrl}
                    alt={f.path}
                    fill
                    className="object-contain p-3"
                    sizes="320px"
                    unoptimized
                  />
                ) : (
                  <p className="px-4 text-center text-xs font-semibold text-flo-maroon/50">
                    {f.path.split("/").pop()}
                  </p>
                )}
              </div>
              <div className="space-y-2 p-4">
                <p className="truncate text-xs font-bold uppercase tracking-wide text-flo-pink">
                  {f.bucket}
                </p>
                <p className="truncate text-sm font-semibold text-flo-maroon">
                  {f.path}
                </p>
                <p className="text-xs text-flo-ink/50">
                  {formatBytes(f.size)}
                  {f.updatedAt
                    ? ` · ${new Date(f.updatedAt).toLocaleDateString("en-IN")}`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyUrl(f.publicUrl, key)}
                    className="inline-flex items-center gap-1 rounded-full bg-flo-soft px-3 py-1.5 text-xs font-bold text-flo-maroon"
                  >
                    {copied === key ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied === key ? "Copied" : "Copy URL"}
                  </button>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onDelete(f.bucket, f.path);
                    }}
                  >
                    <ConfirmSubmitButton
                      confirmMessage={`Delete ${f.path} from ${f.bucket}?`}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
