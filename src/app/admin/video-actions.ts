"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin-auth";
import {
  videoCreateSchema,
  videoReorderSchema,
  videoToggleSchema,
  videoDeleteSchema,
} from "@/lib/validations";
import { VIDEOS_BUCKET } from "@/lib/video-types";
import {
  STATIC_SHOWCASE_VIDEOS,
  STATIC_STORY_VIDEOS,
} from "@/lib/static-media-seed";

function revalidateVideoSurfaces() {
  revalidatePath("/");
  revalidatePath("/admin/videos");
}

export async function createVideoAction(input: {
  title: string;
  url: string;
  poster?: string | null;
  storagePath?: string | null;
  posterStoragePath?: string | null;
  placement: "stories" | "showcase" | "both";
  isActive?: boolean;
  sortOrder?: number;
}): Promise<{ error?: string; id?: string }> {
  const parsed = videoCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid video details." };
  }

  const { supabase, user } = await requireStaff();

  let nextOrder = parsed.data.sortOrder;
  if (nextOrder == null) {
    const { data: maxRow } = await supabase
      .from("videos")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    nextOrder = (maxRow?.sort_order ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("videos")
    .insert({
      title: parsed.data.title,
      url: parsed.data.url,
      poster: parsed.data.poster ?? null,
      storage_path: parsed.data.storagePath ?? null,
      poster_storage_path: parsed.data.posterStoragePath ?? null,
      placement: parsed.data.placement,
      is_active: parsed.data.isActive,
      sort_order: nextOrder,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidateVideoSurfaces();
  return { id: data.id };
}

/**
 * Upsert admin-visible rows for the bundled public/ videos the storefront
 * already plays when the library is empty. Does not re-upload files.
 */
export async function importStaticVideosAction(): Promise<{
  error?: string;
  imported?: number;
  skipped?: number;
}> {
  const { supabase, user } = await requireStaff();
  const seeds = [...STATIC_STORY_VIDEOS, ...STATIC_SHOWCASE_VIDEOS];

  const { data: existing } = await supabase.from("videos").select("url");
  const known = new Set((existing ?? []).map((r) => r.url));

  let imported = 0;
  let skipped = 0;

  for (const seed of seeds) {
    if (known.has(seed.url)) {
      skipped += 1;
      continue;
    }
    const { error } = await supabase.from("videos").insert({
      title: seed.title,
      url: seed.url,
      poster: seed.poster,
      storage_path: null,
      poster_storage_path: null,
      placement: seed.placement,
      is_active: true,
      sort_order: seed.sortOrder,
      created_by: user.id,
    });
    if (error) return { error: error.message, imported, skipped };
    known.add(seed.url);
    imported += 1;
  }

  revalidateVideoSurfaces();
  return { imported, skipped };
}

export async function toggleVideoActiveAction(
  formData: FormData,
): Promise<void> {
  const parsed = videoToggleSchema.safeParse({
    id: formData.get("id"),
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return;

  const { supabase } = await requireStaff();
  await supabase
    .from("videos")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.id);
  revalidateVideoSurfaces();
}

export async function reorderVideoAction(formData: FormData): Promise<void> {
  const parsed = videoReorderSchema.safeParse({
    id: formData.get("id"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return;

  const { supabase } = await requireStaff();
  const { data: current } = await supabase
    .from("videos")
    .select("id, sort_order")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!current) return;

  const { data: siblings } = await supabase
    .from("videos")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  const list = siblings ?? [];
  const idx = list.findIndex((v) => v.id === current.id);
  if (idx < 0) return;

  const swapIdx = parsed.data.direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) return;

  const a = list[idx];
  const b = list[swapIdx];
  await Promise.all([
    supabase.from("videos").update({ sort_order: b.sort_order }).eq("id", a.id),
    supabase.from("videos").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);
  revalidateVideoSurfaces();
}

export async function deleteVideoAction(formData: FormData): Promise<void> {
  const parsed = videoDeleteSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) return;

  const { supabase } = await requireStaff();
  const { data: row } = await supabase
    .from("videos")
    .select("id, storage_path, poster_storage_path")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!row) return;

  const paths = [row.storage_path, row.poster_storage_path].filter(
    (p): p is string => Boolean(p),
  );
  if (paths.length > 0) {
    await supabase.storage.from(VIDEOS_BUCKET).remove(paths);
  }

  await supabase.from("videos").delete().eq("id", parsed.data.id);
  revalidateVideoSurfaces();
}
