import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coverUrl, formatPostDate } from "@/components/blog/cover-url";
import { PostCard } from "@/components/blog/post-card";
import { BlogProductCard } from "@/components/blog/product-card";
import { SiteFooter } from "@/components/home/site-footer";
import { categoryLabel, readingMinutes, splitProductCards } from "@/lib/blog";
import { getPublishedPostBySlug, getRelatedPosts } from "@/lib/cms";
import { renderMarkdown } from "@/lib/markdown";
import { getProductBySlug } from "@/lib/products";
import { siteOrigin } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: "Not found" };
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || undefined;
  const image = coverUrl(post.cover_image_path);
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : undefined,
      tags: post.tags.length ? post.tags : undefined,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const segments = splitProductCards(renderMarkdown(post.body_md || ""));
  const productSlugs = [
    ...new Set(
      segments.flatMap((s) => (s.type === "product" ? [s.slug] : [])),
    ),
  ];
  const [related, products] = await Promise.all([
    getRelatedPosts(post, 3),
    Promise.all(productSlugs.map((s) => getProductBySlug(s))),
  ]);
  const productMap = new Map(
    productSlugs.flatMap((s, i) => {
      const p = products[i];
      return p ? [[s, p] as const] : [];
    }),
  );

  const cover = coverUrl(post.cover_image_path);
  const label = categoryLabel(post.category);
  const date = formatPostDate(post.published_at ?? post.created_at);
  const origin = siteOrigin();
  const url = `${origin}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: url,
    image: cover ? [cover.startsWith("/") ? `${origin}${cover}` : cover] : undefined,
    author: { "@type": "Person", name: post.author_name || "The Hormone Hood" },
    publisher: {
      "@type": "Organization",
      name: "The Hormone Hood",
      url: origin,
      logo: { "@type": "ImageObject", url: `${origin}/images/logo.png` },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="page-under-header bg-[linear-gradient(180deg,#fef3f0,#f9dbd0)]">
        <article className="container-flo max-w-3xl py-10 md:py-14">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-flo-pink"
          >
            <Link href="/blog" className="hover:underline">
              Blog
            </Link>
            {label && post.category ? (
              <>
                <span aria-hidden className="text-flo-ink/40">
                  ›
                </span>
                <Link
                  href={`/blog?category=${post.category}`}
                  className="hover:underline"
                >
                  {label}
                </Link>
              </>
            ) : null}
          </nav>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-flo-maroon md:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm text-flo-ink/60">
            {post.author_name ? <>By {post.author_name} · </> : null}
            {date}
            {date ? " · " : ""}
            {readingMinutes(post.body_md)} min read
          </p>

          {cover ? (
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-3xl bg-flo-blush">
              <Image
                src={cover}
                alt={post.title}
                fill
                unoptimized
                priority
                className="object-cover"
                sizes="(min-width: 768px) 768px, 100vw"
              />
            </div>
          ) : null}

          <div className="prose-flo mt-8">
            {segments.map((seg, i) => {
              if (seg.type === "html") {
                return (
                  <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
                );
              }
              const product = productMap.get(seg.slug);
              return product ? (
                <BlogProductCard key={i} product={product} />
              ) : null;
            })}
          </div>

          {post.tags.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <li key={t}>
                  <Link
                    href={`/blog?tag=${encodeURIComponent(t)}`}
                    className="rounded-full border border-flo-brown/25 bg-white px-3 py-1 text-xs font-semibold text-flo-brown hover:border-flo-brown"
                  >
                    #{t}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-10 rounded-3xl bg-flo-brown p-6 text-center text-white md:p-8">
            <p className="font-script text-xl text-flo-yellow">
              Made for those days
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">Shop FloBites</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-flo-soft/85">
              Dark chocolate snacks with familiar ingredients, made for how you
              feel.
            </p>
            <Link
              href="/#bestsellers"
              className="mt-5 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-bold text-flo-brown transition hover:brightness-95"
            >
              Shop FloBites
            </Link>
          </div>
        </article>

        {related.length > 0 ? (
          <section className="container-flo pb-14 md:pb-20">
            <h2 className="text-2xl font-extrabold text-flo-maroon">
              Keep reading
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <SiteFooter />
    </>
  );
}
