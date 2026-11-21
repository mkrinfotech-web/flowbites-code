"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { displayImageFor } from "@/lib/product-display";
import { useWishlistStore } from "@/lib/wishlist-store";
import { formatInr } from "@/lib/utils";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const toProduct = useWishlistStore((s) => s.toProduct);
  const addProduct = useCartStore((s) => s.addProduct);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-flo-maroon">
          <Heart className="size-6 text-flo-pink" fill="currentColor" />
          Wishlist
        </h1>
        <p className="mt-1 text-sm text-flo-maroon/65">
          Saved packs — add them to cart whenever you&apos;re ready.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-flo-maroon/70">
            Nothing saved yet. Tap the heart on Best Sellers or a product page.
          </p>
          <Link
            href="/#bestsellers"
            className="mt-4 inline-flex rounded-full bg-flo-brown px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            Browse Best Sellers
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const product = toProduct(item);
            const img = displayImageFor(product);
            return (
              <li
                key={item.productId}
                className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative size-28 shrink-0 overflow-hidden rounded-2xl bg-flo-cream"
                >
                  <Image
                    src={img}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                    sizes="112px"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-bold text-flo-maroon hover:text-flo-pink"
                  >
                    {item.name}
                  </Link>
                  {item.tagline ? (
                    <p className="mt-0.5 text-sm font-semibold text-flo-pink">
                      {item.tagline}
                    </p>
                  ) : null}
                  <p className="mt-2 text-lg font-bold text-flo-maroon">
                    {formatInr(item.priceInr)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-flo-brown px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
                  >
                    <ShoppingBag className="size-3.5" />
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    aria-label={`Remove ${item.name} from wishlist`}
                    className="rounded-full p-2.5 text-flo-maroon/40 transition hover:bg-flo-blush hover:text-flo-pink"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
