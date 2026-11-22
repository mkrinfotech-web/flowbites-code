import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/home/site-footer";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { renderMarkdown } from "@/lib/admin-utils";

type PageRow = {
  slug: string;
  title: string;
  body_md: string;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
};

async function getPublishedPage(slug: string): Promise<PageRow | null> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data } = await admin
      .from("pages")
      .select("slug, title, body_md, seo_title, seo_description, is_published")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    return data;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pages")
      .select("slug, title, body_md, seo_title, seo_description, is_published")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return { title: "Not found" };
  return {
    title: page.seo_title || page.title,
    description: page.seo_description || undefined,
    alternates: {
      canonical: `/${page.slug}`,
    },
    openGraph: {
      title: page.seo_title || page.title,
      description: page.seo_description || undefined,
      url: `/${page.slug}`,
      type: "website",
    },
  };
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Reserve app routes that are not CMS
  const reserved = new Set([
    "admin",
    "api",
    "checkout",
    "blog",
    "ingredients",
    "product",
    "account",
    "flo-circle",
    "_next",
  ]);
  if (reserved.has(slug)) notFound();

  const page = await getPublishedPage(slug);
  if (!page) notFound();

  const html = renderMarkdown(page.body_md || "", { allowH1: true });

  return (
    <>
      <div className="page-under-header bg-[linear-gradient(180deg,#fef3f0,#f9dbd0)]">
        <article className="container-flo max-w-3xl py-10 md:py-14">
          <Link
            href="/"
            className="text-sm font-semibold text-flo-pink hover:underline"
          >
            ← FloBites home
          </Link>
          <div
            className="prose-flo mt-6"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </div>
      <SiteFooter />
    </>
  );
}
