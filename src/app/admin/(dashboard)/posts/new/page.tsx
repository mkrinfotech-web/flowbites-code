import Link from "next/link";
import { PostEditorForm } from "@/components/admin/post-editor-form";

export default function AdminNewPostPage() {
  return (
    <div>
      <Link
        href="/admin/posts"
        className="text-sm font-semibold text-flo-pink hover:underline"
      >
        ← Back to posts
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold text-flo-maroon">New post</h1>
      <div className="mt-6 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
        <PostEditorForm />
      </div>
    </div>
  );
}
