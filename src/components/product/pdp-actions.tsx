"use client";

import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/data";
import { useCartStore } from "@/lib/cart-store";
import { WishlistButton } from "@/components/product/wishlist-button";
import { formatInr } from "@/lib/utils";

export function PdpActions({ product }: { product: Product }) {
  const addProduct = useCartStore((s) => s.addProduct);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-3xl font-bold text-flo-pink md:text-4xl">
        {formatInr(product.priceInr)}
      </p>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
        <WishlistButton product={product} />
        <button
          type="button"
          onClick={() => addProduct(product)}
          className="inline-flex items-center gap-2 rounded-full bg-flo-brown px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
        >
          <ShoppingBag className="size-4" />
          Add to cart
        </button>
      </div>
    </div>
  );
}
