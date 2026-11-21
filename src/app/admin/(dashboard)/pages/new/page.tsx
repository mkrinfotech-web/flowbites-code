import Link from "next/link";
import { PageEditorForm } from "@/components/admin/page-editor-form";

export default function AdminNewPage() {
  return (
    <div>
      <Link
        href="/admin/pages"
        className="text-sm font-semibold text-flo-pink hover:underline"
      >
        ← Back to pages
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold text-flo-maroon">New page</h1>
      <div className="mt-6 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
        <PageEditorForm />
      </div>
    </div>
  );
}
