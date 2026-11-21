import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deletePageAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export default async function AdminPagesListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const canDelete = me?.role === "admin";

  const { data: pages, error } = await supabase
    .from("pages")
    .select(
      "id, slug, title, type, is_published, updated_at, sort_order",
    )
    .order("sort_order", { ascending: true });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-flo-maroon">CMS Pages</h1>
          <p className="mt-1 text-sm text-flo-ink/60">
            Policies, about, contact, and custom pages
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 rounded-full bg-flo-pink px-4 py-2.5 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" /> New page
        </Link>
      </div>

      {params.error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </p>
      ) : null}
      {params.ok === "deleted" ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Page deleted.
        </p>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error.message}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-flo-maroon/10 bg-white/75 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-flo-blush/60 text-xs uppercase tracking-wide text-flo-maroon/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              {canDelete ? (
                <th className="px-4 py-3 font-semibold">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-flo-maroon/5">
            {(pages ?? []).map((page) => (
              <tr key={page.id} className="hover:bg-flo-soft/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pages/${page.id}`}
                    className="font-bold text-flo-maroon hover:text-flo-pink"
                  >
                    {page.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-flo-ink/70">/{page.slug}</td>
                <td className="px-4 py-3 capitalize">{page.type}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      page.is_published
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {page.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-flo-ink/50">
                  {new Date(page.updated_at).toLocaleDateString("en-IN")}
                </td>
                {canDelete ? (
                  <td className="px-4 py-3">
                    <form action={deletePageAction}>
                      <input type="hidden" name="id" value={page.id} />
                      <ConfirmSubmitButton
                        confirmMessage={`Delete page “${page.title}”? This cannot be undone.`}
                        className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
