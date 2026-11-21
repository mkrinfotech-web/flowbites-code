import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/home/site-footer";
import { renderMarkdown } from "@/lib/admin-utils";
import { getPublishedPostBySlug } from "@/lib/cms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || undefined,
      url: `/blog/${post.slug}`,
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.body_md || "");

  return (
    <>
      <div className="page-under-header bg-[linear-gradient(180deg,#fef3f0,#f9dbd0)]">
        <article className="container-flo max-w-3xl py-10 md:py-14">
          <Link
            href="/blog"
            className="text-sm font-semibold text-flo-pink hover:underline"
          >
            ← All posts
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-flo-maroon md:text-4xl">
            {post.title}
          </h1>
          {post.published_at ? (
            <p className="mt-2 text-sm text-flo-ink/50">
              {new Date(post.published_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          ) : null}
          <div
            className="prose-flo mt-8"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </div>
      <SiteFooter />
    </>
  );
}
