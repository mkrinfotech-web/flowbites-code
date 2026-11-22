"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/data";
import { displayImageFor } from "@/lib/product-display";
import { formatInr } from "@/lib/utils";

export function BlogProductCard({ product }: { product: Product }) {
  const addProduct = useCartStore((s) => s.addProduct);
  const img = displayImageFor(product);

  return (
    <aside className="not-prose my-8 flex items-center gap-4 rounded-3xl bg-white p-4 shadow-[4px_10px_37px_rgba(0,0,0,0.12)] sm:gap-6 sm:p-5">
      <Link
        href={`/product/${product.slug}`}
        className="relative block size-24 shrink-0 overflow-hidden rounded-2xl sm:size-32"
        style={{ backgroundColor: product.shelfColor }}
        aria-label={`View ${product.name}`}
      >
        <Image
          src={img}
          alt={product.name}
          fill
          className="object-contain p-1"
          sizes="128px"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-xs font-bold text-flo-ink/60">{product.packLabel}</p>
        <Link
          href={`/product/${product.slug}`}
          className="text-lg font-bold leading-tight text-flo-maroon hover:text-flo-pink"
        >
          {product.name}
        </Link>
        {product.tagline ? (
          <p className="line-clamp-2 text-sm text-flo-ink/70">
            {product.tagline}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-xl font-bold text-flo-pink">
            {formatInr(product.priceInr)}
          </span>
          <button
            type="button"
            onClick={() => addProduct(product)}
            className="rounded-full bg-flo-brown px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
          >
            Add to cart
          </button>
        </div>
      </div>
    </aside>
  );
}
