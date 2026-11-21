"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createVideoAction } from "@/app/admin/video-actions";
import { VIDEOS_BUCKET } from "@/lib/video-types";
import { Upload } from "lucide-react";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
}

export function VideoUploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setProgress(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const videoFile = fd.get("video") as File | null;
    const posterFile = fd.get("poster") as File | null;
    const title = String(fd.get("title") || "").trim();
    const placement = String(fd.get("placement") || "stories") as
      | "stories"
      | "showcase"
      | "both";
    const isActive = fd.get("isActive") === "on";

    if (!videoFile || videoFile.size === 0) {
      setError("Choose a video file to upload.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const stamp = Date.now();
        const videoPath = `carousel/${stamp}-${safeName(videoFile.name)}`;

        setProgress("Uploading video…");
        const { error: upErr } = await supabase.storage
          .from(VIDEOS_BUCKET)
          .upload(videoPath, videoFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: videoFile.type || "video/mp4",
          });
        if (upErr) {
          setError(upErr.message);
          setProgress(null);
          return;
        }

        const {
          data: { publicUrl: videoUrl },
        } = supabase.storage.from(VIDEOS_BUCKET).getPublicUrl(videoPath);

        let posterUrl: string | null = null;
        let posterPath: string | null = null;
        if (posterFile && posterFile.size > 0) {
          setProgress("Uploading poster…");
          posterPath = `posters/${stamp}-${safeName(posterFile.name)}`;
          const { error: posterErr } = await supabase.storage
            .from(VIDEOS_BUCKET)
            .upload(posterPath, posterFile, {
              cacheControl: "3600",
              upsert: false,
              contentType: posterFile.type || "image/jpeg",
            });
          if (posterErr) {
            setError(posterErr.message);
            setProgress(null);
            return;
          }
          posterUrl = supabase.storage
            .from(VIDEOS_BUCKET)
            .getPublicUrl(posterPath).data.publicUrl;
        }

        setProgress("Saving…");
        const result = await createVideoAction({
          title,
          url: videoUrl,
          poster: posterUrl,
          storagePath: videoPath,
          posterStoragePath: posterPath,
          placement,
          isActive,
        });

        if (result.error) {
          setError(result.error);
          setProgress(null);
          return;
        }

        formRef.current?.reset();
        setProgress("Uploaded.");
        router.refresh();
        setTimeout(() => setProgress(null), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        setProgress(null);
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="grid gap-3 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm md:grid-cols-2"
    >
      <label className="text-xs font-bold uppercase text-flo-maroon/60 md:col-span-2">
        Title
        <input
          name="title"
          placeholder="e.g. Period story 1"
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm font-semibold normal-case"
        />
      </label>

      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Video file
        <input
          name="video"
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          required
          className="mt-1 block w-full text-sm font-normal normal-case file:mr-3 file:rounded-full file:border-0 file:bg-flo-pink/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-flo-maroon"
        />
      </label>

      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Poster (optional)
        <input
          name="poster"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 block w-full text-sm font-normal normal-case file:mr-3 file:rounded-full file:border-0 file:bg-flo-pink/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-flo-maroon"
        />
      </label>

      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Placement
        <select
          name="placement"
          defaultValue="stories"
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm font-semibold normal-case"
        >
          <option value="stories">Stories carousel</option>
          <option value="showcase">Showcase strip</option>
          <option value="both">Both</option>
        </select>
      </label>

      <label className="flex items-center gap-2 self-end text-sm font-semibold text-flo-maroon">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked
          className="h-4 w-4 accent-flo-pink"
        />
        Active on storefront
      </label>

      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-flo-pink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {pending ? "Uploading…" : "Upload video"}
        </button>
        {progress ? (
          <p className="text-xs font-medium text-flo-maroon/70">{progress}</p>
        ) : null}
        {error ? (
          <p className="text-xs font-medium text-rose-600">{error}</p>
        ) : null}
      </div>
      <p className="text-[11px] text-flo-ink/45 md:col-span-2">
        Quality first — uploads go to Supabase Storage as-is (up to ~500&nbsp;MB).
        Existing static files are not recompressed.
      </p>
    </form>
  );
}
