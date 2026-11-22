import Link from "next/link";
import { notFound } from "next/navigation";
import { PostEditorForm } from "@/components/admin/post-editor-form";
import { createClient } from "@/lib/supabase/server";
import { deletePostAction } from "@/app/admin/cms-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, slug, title, excerpt, body_md, cover_image_path, seo_title, seo_description, is_published, published_at, category, tags, author_name",
    )
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <div>
      <Link
        href="/admin/posts"
        className="text-sm font-semibold text-flo-pink hover:underline"
      >
        ← Back to posts
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold text-flo-maroon">
        Edit · {post.title}
      </h1>
      <p className="mt-1 text-sm text-flo-ink/50">
        Live URL: /blog/{post.slug}
      </p>
      <div className="mt-6 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
        <PostEditorForm post={post} />
      </div>
      <form action={deletePostAction} className="mt-4">
        <input type="hidden" name="id" value={post.id} />
        <input type="hidden" name="slug" value={post.slug} />
        <ConfirmSubmitButton
          confirmMessage={`Delete post “${post.title}”?`}
          className="rounded-full bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700"
        >
          Delete post
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
