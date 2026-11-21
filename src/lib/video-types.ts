/** Client-safe video types + constants (no next/headers). */

export type VideoPlacement = "stories" | "showcase" | "both";

export type CarouselVideo = {
  id: string;
  title: string;
  url: string;
  poster: string | null;
  storage_path: string | null;
  poster_storage_path: string | null;
  placement: VideoPlacement;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type StoryVideoClip = {
  src: string;
  poster: string;
  title?: string;
};

export const VIDEOS_BUCKET = "videos";
