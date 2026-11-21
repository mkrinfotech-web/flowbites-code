import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/home/site-footer";
import { getPublishedPosts } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Blog · FloBites",
  description: "Tips, snacks, and stories for those days — from FloBites.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <div className="page-under-header bg-[linear-gradient(180deg,#fef3f0,#f9dbd0)]">
        <div className="container-flo max-w-3xl py-10 md:py-14">
          <Link
            href="/"
            className="text-sm font-semibold text-flo-pink hover:underline"
          >
            ← FloBites home
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-flo-maroon md:text-4xl">
            FloBites Blog
          </h1>
          <p className="mt-2 text-flo-ink/70">
            Tips, rituals, and snack talk for those days.
          </p>

          {posts.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-dashed border-flo-maroon/20 bg-white/60 px-5 py-10 text-center text-sm text-flo-ink/55">
              No published posts yet. Check back soon.
            </p>
          ) : (
            <ul className="mt-10 space-y-4">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <h2 className="text-lg font-bold text-flo-maroon">
                      {post.title}
                    </h2>
                    {post.excerpt ? (
                      <p className="mt-1 text-sm text-flo-ink/70">
                        {post.excerpt}
                      </p>
                    ) : null}
                    {post.published_at ? (
                      <p className="mt-2 text-xs text-flo-ink/45">
                        {new Date(post.published_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
