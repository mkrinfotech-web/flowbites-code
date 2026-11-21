import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/home/site-footer";
import { PdpActions } from "@/components/product/pdp-actions";
import { ProductRichAccordion } from "@/components/product/product-rich-accordion";
import { displayImageFor } from "@/lib/product-display";
import { getAllProductSlugs, getProductBySlug } from "@/lib/products";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} · FloBites`,
    description: product.description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      url: `/product/${product.slug}`,
      type: "website",
      images: [{ url: displayImageFor(product) }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const img = displayImageFor(product);

  return (
    <>
      <div className="page-under-header bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_55%,#fce8e2_100%)]">
        <div className="container-flo py-8 md:py-14">
          <Link
            href="/#bestsellers"
            className="text-sm font-semibold text-flo-pink hover:underline"
          >
            ← Best Sellers
          </Link>

          <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12 md:items-start">
            <div className="relative overflow-hidden rounded-[28px] bg-white shadow-sm">
              {product.cornerRibbon ? (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-flo-brown px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
                  {product.cornerRibbon}
                </span>
              ) : null}
              <div
                className="relative aspect-square w-full"
                style={{
                  background: `linear-gradient(180deg, #fff 40%, ${product.shelfColor} 100%)`,
                }}
              >
                <Image
                  src={img}
                  alt={product.name}
                  fill
                  priority
                  className="object-contain p-8 drop-shadow-sm"
                  sizes="(max-width: 768px) 100vw, 520px"
                />
              </div>
            </div>

            <div className="space-y-5">
              {product.badge ? (
                <p className="inline-flex rounded-full border border-flo-maroon/20 bg-flo-soft px-3 py-1.5 text-xs font-medium text-flo-brown">
                  {product.badge}
                </p>
              ) : null}

              <div>
                <p className="text-sm font-bold text-flo-maroon/60">
                  {product.packLabel}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-flo-maroon md:text-4xl">
                  {product.name}
                </h1>
                {product.tagline ? (
                  <p className="mt-2 text-lg font-semibold text-flo-pink">
                    {product.tagline}
                  </p>
                ) : null}
              </div>

              {product.content ? (
                <ProductRichAccordion content={product.content} variant="pdp" />
              ) : (
                <p className="text-base leading-relaxed text-flo-maroon/80">
                  {product.description}
                </p>
              )}

              <PdpActions product={product} />

              <p className="text-sm text-flo-maroon/55">
                Made for those days · Not medicine.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
