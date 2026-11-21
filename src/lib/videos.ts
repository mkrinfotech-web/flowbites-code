import { assets } from "@/lib/assets";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import type {
  CarouselVideo,
  StoryVideoClip,
  VideoPlacement,
} from "@/lib/video-types";

export type {
  CarouselVideo,
  StoryVideoClip,
  VideoPlacement,
} from "@/lib/video-types";
export { VIDEOS_BUCKET } from "@/lib/video-types";

function matchesPlacement(
  placement: VideoPlacement,
  target: "stories" | "showcase",
) {
  return placement === target || placement === "both";
}

async function queryActiveVideos(): Promise<CarouselVideo[]> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data } = await admin
      .from("videos")
      .select(
        "id, title, url, poster, storage_path, poster_storage_path, placement, sort_order, is_active, created_at",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data as CarouselVideo[] | null) ?? [];
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("videos")
      .select(
        "id, title, url, poster, storage_path, poster_storage_path, placement, sort_order, is_active, created_at",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data as CarouselVideo[] | null) ?? [];
  } catch {
    return [];
  }
}

/** Active stories carousel clips; falls back to static assets when empty. */
export async function getStoriesVideos(): Promise<StoryVideoClip[]> {
  const rows = (await queryActiveVideos()).filter((v) =>
    matchesPlacement(v.placement, "stories"),
  );
  if (rows.length === 0) {
    return assets.testimonials.map((t) => ({
      src: t.src,
      poster: t.poster,
    }));
  }
  return rows.map((v, i) => ({
    src: v.url,
    poster:
      v.poster ||
      assets.testimonials[i % assets.testimonials.length]?.poster ||
      "",
    title: v.title || undefined,
  }));
}

/** Active showcase strip URLs; falls back to static assets when empty. */
export async function getShowcaseVideos(): Promise<string[]> {
  const rows = (await queryActiveVideos()).filter((v) =>
    matchesPlacement(v.placement, "showcase"),
  );
  if (rows.length === 0) return [...assets.showcase];
  return rows.map((v) => v.url);
}

export async function listAdminVideos(): Promise<CarouselVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select(
      "id, title, url, poster, storage_path, poster_storage_path, placement, sort_order, is_active, created_at",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as CarouselVideo[] | null) ?? [];
}
