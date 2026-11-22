import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/blog/post-card";
import { SiteFooter } from "@/components/home/site-footer";
import { BLOG_CATEGORIES, categoryLabel, isBlogCategory } from "@/lib/blog";
import { getPublishedPosts } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Blog · FloBites",
  description:
    "Cycle care, nutrition, recipes and wellness tips for those days, from FloBites by The Hormone Hood.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "FloBites Blog",
    description:
      "Cycle care, nutrition, recipes and wellness tips for those days.",
    url: "/blog",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "FloBites Blog" },
};

type SearchParams = Promise<{ category?: string; tag?: string }>;

function chipClass(active: boolean) {
  return `rounded-full px-4 py-2 text-[13px] font-bold transition ${
    active
      ? "bg-flo-brown text-white shadow-sm"
      : "border border-flo-brown/35 bg-white text-flo-brown hover:border-flo-brown"
  }`;
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const category = isBlogCategory(sp.category) ? sp.category : undefined;
  const tag = sp.tag?.trim().toLowerCase().slice(0, 40) || undefined;
  const posts = await getPublishedPosts({ category, tag });
  const filtered = Boolean(category || tag);

  return (
    <>
      <div className="page-under-header bg-[linear-gradient(180deg,#fef3f0,#f9dbd0)]">
        <div className="container-flo py-10 md:py-14">
          <header className="mx-auto max-w-2xl text-center">
            <p className="font-script text-2xl text-flo-pink">The FloBites Blog</p>
            <h1 className="mt-2 text-3xl font-extrabold text-flo-maroon md:text-5xl">
              Tips, rituals and snack talk for those days
            </h1>
            <p className="mt-3 text-flo-ink/70">
              Cycle care, nutrition and easy recipes from The Hormone Hood.
            </p>
          </header>

          <nav
            aria-label="Blog categories"
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            <Link href="/blog" className={chipClass(!category)}>
              All
            </Link>
            {BLOG_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/blog?category=${c.slug}`}
                className={chipClass(category === c.slug)}
              >
                {c.label}
              </Link>
            ))}
          </nav>

          {tag ? (
            <p className="mt-4 text-center text-sm text-flo-ink/70">
              Showing posts tagged{" "}
              <span className="font-bold text-flo-maroon">#{tag}</span>
              {category ? ` in ${categoryLabel(category)}` : ""}.{" "}
              <Link
                href={category ? `/blog?category=${category}` : "/blog"}
                className="font-semibold text-flo-pink hover:underline"
              >
                Clear filter
              </Link>
            </p>
          ) : null}

          {posts.length === 0 ? (
            <div className="mx-auto mt-10 max-w-md rounded-3xl border border-dashed border-flo-maroon/20 bg-white/60 px-6 py-12 text-center">
              <p className="text-lg font-bold text-flo-maroon">
                {filtered
                  ? "No articles match this filter"
                  : "New articles coming soon"}
              </p>
              <p className="mt-2 text-sm text-flo-ink/60">
                {filtered
                  ? "Try another category or clear the filter."
                  : "We are writing something good. In the meantime, meet the snacks."}
              </p>
              <Link
                href={filtered ? "/blog" : "/#bestsellers"}
                className="mt-5 inline-flex rounded-full bg-flo-brown px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              >
                {filtered ? "View all articles" : "Shop FloBites"}
              </Link>
            </div>
          ) : (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} />
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
