import Link from "next/link";
import { notFound } from "next/navigation";
import { PageEditorForm } from "@/components/admin/page-editor-form";
import { createClient } from "@/lib/supabase/server";

export default async function AdminEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select(
      "id, slug, title, type, body_md, seo_title, seo_description, is_published, sort_order",
    )
    .eq("id", id)
    .maybeSingle();

  if (!page) notFound();

  return (
    <div>
      <Link
        href="/admin/pages"
        className="text-sm font-semibold text-flo-pink hover:underline"
      >
        ← Back to pages
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold text-flo-maroon">
        Edit · {page.title}
      </h1>
      <p className="mt-1 text-sm text-flo-ink/50">
        Live URL: /{page.slug}
      </p>
      <div className="mt-6 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
        <PageEditorForm page={page} />
      </div>
    </div>
  );
}
