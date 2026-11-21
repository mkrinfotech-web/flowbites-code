"use client";

import { upsertPostAction } from "@/app/admin/cms-actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";

export function PostEditorForm({
  post,
}: {
  post?: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body_md: string;
    cover_image_path: string | null;
    seo_title: string | null;
    seo_description: string | null;
    is_published: boolean;
  } | null;
}) {
  return (
    <form action={upsertPostAction} className="space-y-4">
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Title
          <input
            name="title"
            required
            defaultValue={post?.title ?? ""}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Slug
          <input
            name="slug"
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            defaultValue={post?.slug ?? ""}
            placeholder="period-week-snacks"
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60 md:col-span-2">
          Excerpt
          <input
            name="excerpt"
            defaultValue={post?.excerpt ?? ""}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>

        <div className="md:col-span-2">
          <ImageUploadField
            name="coverImagePath"
            label="Featured / cover image"
            defaultValue={post?.cover_image_path ?? ""}
            bucket="media"
            folder="posts"
          />
        </div>

        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          SEO title
          <input
            name="seoTitle"
            defaultValue={post?.seo_title ?? ""}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          SEO description
          <input
            name="seoDescription"
            defaultValue={post?.seo_description ?? ""}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <label className="block text-xs font-bold uppercase text-flo-maroon/60">
        Body (Markdown)
        <textarea
          name="bodyMd"
          rows={16}
          defaultValue={post?.body_md ?? ""}
          className="mt-1 w-full rounded-2xl border border-flo-maroon/15 bg-white px-3 py-3 font-mono text-sm leading-relaxed"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-flo-maroon">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={post?.is_published ?? false}
          className="size-4 rounded border-flo-maroon/30"
        />
        Published
      </label>

      <button
        type="submit"
        className="rounded-full bg-flo-pink px-6 py-2.5 text-sm font-bold text-white"
      >
        Save post
      </button>
    </form>
  );
}
