import Link from "next/link";
import { Plus } from "lucide-react";
import { categoryLabel } from "@/lib/blog";
import { createClient } from "@/lib/supabase/server";
import { deletePostAction } from "@/app/admin/cms-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: queryError } = await searchParams;
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id, slug, title, is_published, published_at, updated_at, created_at, category, author_name",
    )
    .order("updated_at", { ascending: false });

  const tableMissing =
    error?.message?.toLowerCase().includes("does not exist") ||
    error?.code === "42P01" ||
    error?.code === "PGRST205";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-flo-maroon">Blog posts</h1>
          <p className="mt-1 text-sm text-flo-ink/60">
            Title, slug, body, publish, and SEO — live at /blog
          </p>
        </div>
        {!tableMissing ? (
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-full bg-flo-pink px-4 py-2.5 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" /> New post
          </Link>
        ) : null}
      </div>

      {(queryError || (error && !tableMissing)) && (
        <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {queryError === "invalid"
            ? "Check title, slug, and body fields."
            : queryError || error?.message}
        </p>
      )}

      {tableMissing ? (
        <p className="mt-6 rounded-2xl border border-dashed border-flo-maroon/20 bg-white/50 px-4 py-10 text-center text-sm text-flo-ink/60">
          Posts table is not available in this database yet. Apply the CMS
          migration (<code className="text-flo-maroon">002_cms_admin.sql</code>
          ) to enable blog CRUD.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-flo-maroon/10 bg-white/75 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-flo-blush/60 text-xs uppercase tracking-wide text-flo-maroon/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-flo-maroon/5">
              {(posts ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-flo-ink/50"
                  >
                    No posts yet.
                  </td>
                </tr>
              ) : (
                (posts ?? []).map((post) => {
                  const publishedAt = post.published_at
                    ? new Date(post.published_at)
                    : null;
                  const scheduled =
                    post.is_published &&
                    publishedAt !== null &&
                    publishedAt.getTime() > Date.now();
                  const statusLabel = !post.is_published
                    ? "Draft"
                    : scheduled
                      ? "Scheduled"
                      : "Published";
                  const statusClass = !post.is_published
                    ? "bg-amber-100 text-amber-900"
                    : scheduled
                      ? "bg-sky-100 text-sky-800"
                      : "bg-emerald-100 text-emerald-800";
                  return (
                  <tr key={post.id} className="hover:bg-flo-soft/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="font-bold text-flo-maroon hover:text-flo-pink"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-flo-ink/70">
                      /blog/{post.slug}
                    </td>
                    <td className="px-4 py-3 text-flo-ink/70">
                      {categoryLabel(post.category) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-flo-ink/70">
                      {post.author_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                      {post.is_published && publishedAt ? (
                        <span className="ml-2 text-xs text-flo-ink/50">
                          {publishedAt.toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: scheduled ? "short" : undefined,
                            timeZone: "Asia/Kolkata",
                          })}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-flo-ink/50">
                      {new Date(post.updated_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deletePostAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <input type="hidden" name="slug" value={post.slug} />
                        <ConfirmSubmitButton
                          confirmMessage={`Delete post “${post.title}”?`}
                          className="text-xs font-bold text-rose-600 hover:underline"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
