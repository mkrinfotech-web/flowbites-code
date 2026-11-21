import Image from "next/image";
import {
  deleteVideoAction,
  reorderVideoAction,
  toggleVideoActiveAction,
} from "@/app/admin/video-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import type { CarouselVideo } from "@/lib/video-types";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

const PLACEMENT_LABEL: Record<CarouselVideo["placement"], string> = {
  stories: "Stories",
  showcase: "Showcase",
  both: "Both",
};

export function VideoList({ videos }: { videos: CarouselVideo[] }) {
  if (videos.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-flo-maroon/20 bg-white/50 px-4 py-8 text-center text-sm text-flo-ink/50">
        No videos in the library yet. Use{" "}
        <span className="font-semibold text-flo-maroon">
          Import from public/
        </span>{" "}
        to pull in the live Stories + Showcase clips, or upload new files above.
      </p>
    );
  }

  return (
    <ul className="mt-4 grid gap-3">
      {videos.map((v, i) => (
        <li
          key={v.id}
          className="grid gap-4 rounded-2xl border border-flo-maroon/10 bg-white/75 p-4 shadow-sm sm:grid-cols-[96px_1fr_auto]"
        >
          <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-xl bg-flo-blush">
            {v.poster ? (
              <Image
                src={v.poster}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <video
                src={v.url}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-bold text-flo-maroon">
              {v.title || "Untitled"}
            </p>
            <p className="mt-0.5 text-xs text-flo-ink/50">
              {PLACEMENT_LABEL[v.placement]} · sort {v.sort_order}
              {v.is_active ? " · live" : " · hidden"}
            </p>
            <p className="mt-1 truncate text-[11px] text-flo-ink/40">{v.url}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <form action={reorderVideoAction}>
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="direction" value="up" />
              <button
                type="submit"
                disabled={i === 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-flo-maroon/15 bg-white text-flo-maroon disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
            <form action={reorderVideoAction}>
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="direction" value="down" />
              <button
                type="submit"
                disabled={i === videos.length - 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-flo-maroon/15 bg-white text-flo-maroon disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </form>
            <form action={toggleVideoActiveAction}>
              <input type="hidden" name="id" value={v.id} />
              <input
                type="hidden"
                name="isActive"
                value={v.is_active ? "false" : "true"}
              />
              <button
                type="submit"
                className={`rounded-full px-3 py-2 text-xs font-bold ${
                  v.is_active
                    ? "bg-flo-pink/15 text-flo-maroon"
                    : "bg-flo-maroon/10 text-flo-maroon/70"
                }`}
              >
                {v.is_active ? "Deactivate" : "Activate"}
              </button>
            </form>
            <form action={deleteVideoAction}>
              <input type="hidden" name="id" value={v.id} />
              <ConfirmSubmitButton
                confirmMessage={`Delete video “${v.title || "Untitled"}”? This removes the file from storage.`}
                className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                aria-label="Delete video"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
