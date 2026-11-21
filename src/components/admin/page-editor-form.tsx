import { upsertPageAction } from "@/app/admin/actions";

const PAGE_TYPES = [
  "policy",
  "landing",
  "about",
  "contact",
  "ingredient",
  "custom",
] as const;

export function PageEditorForm({
  page,
}: {
  page?: {
    id: string;
    slug: string;
    title: string;
    type: string;
    body_md: string;
    seo_title: string | null;
    seo_description: string | null;
    is_published: boolean;
    sort_order: number;
  } | null;
}) {
  return (
    <form action={upsertPageAction} className="space-y-4">
      {page?.id ? <input type="hidden" name="id" value={page.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Title
          <input
            name="title"
            required
            defaultValue={page?.title ?? ""}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Slug
          <input
            name="slug"
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            defaultValue={page?.slug ?? ""}
            placeholder="privacy"
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Type
          <select
            name="type"
            defaultValue={page?.type ?? "policy"}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm capitalize"
          >
            {PAGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Sort order
          <input
            name="sortOrder"
            type="number"
            defaultValue={page?.sort_order ?? 0}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          SEO title
          <input
            name="seoTitle"
            defaultValue={page?.seo_title ?? ""}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          SEO description
          <input
            name="seoDescription"
            defaultValue={page?.seo_description ?? ""}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <label className="block text-xs font-bold uppercase text-flo-maroon/60">
        Body (Markdown)
        <textarea
          name="bodyMd"
          rows={18}
          defaultValue={page?.body_md ?? ""}
          className="mt-1 w-full rounded-2xl border border-flo-maroon/15 bg-white px-3 py-3 font-mono text-sm leading-relaxed"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-flo-maroon">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={page?.is_published ?? false}
          className="h-4 w-4 accent-flo-pink"
        />
        Published on storefront
      </label>

      <button
        type="submit"
        className="rounded-full bg-flo-pink px-6 py-3 text-sm font-bold text-white"
      >
        Save page
      </button>
    </form>
  );
}
