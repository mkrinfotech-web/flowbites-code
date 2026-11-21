"use client";

import { Heart } from "lucide-react";
import type { Product } from "@/lib/data";
import { useWishlistStore } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";

export function WishlistButton({
  product,
  className,
  size = "md",
}: {
  product: Product;
  className?: string;
  size?: "sm" | "md";
}) {
  const saved = useWishlistStore((s) => s.has(product.id));
  const toggle = useWishlistStore((s) => s.toggle);

  const iconClass = size === "sm" ? "size-4" : "size-5";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
      }}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      aria-pressed={saved}
      className={cn(
        "rounded-full bg-white/90 p-2 text-flo-maroon shadow-sm transition hover:bg-white hover:text-flo-pink active:scale-95",
        saved && "text-flo-pink",
        className,
      )}
    >
      <Heart
        className={iconClass}
        fill={saved ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}
