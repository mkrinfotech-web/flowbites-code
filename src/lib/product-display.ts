import type { Product } from "@/lib/data";

/** Shelf art used on Best Sellers / PDP / wishlist */
export const PRODUCT_DISPLAY_IMAGES: Record<string, string> = {
  "the-flo-edition": "/images/products/editions/the-flo-edition.jpeg",
  "the-extra-flo-edition": "/images/products/editions/the-extra-flo-edition.jpeg",
  "the-super-flo-edition": "/images/products/editions/the-super-flo-edition.jpeg",
  "the-secret-flo-edition":
    "/images/products/editions/the-secret-flo-edition.jpeg?v=swap",
  "the-flo-plus-edition": "/images/products/editions/the-flo-plus-edition.jpeg",
  "the-extra-flo-plus-edition":
    "/images/products/editions/the-extra-flo-plus-edition.jpeg",
  "the-super-flo-plus-edition":
    "/images/products/editions/the-super-flo-plus-edition.jpeg",
  "the-secret-flo-plus-edition":
    "/images/products/editions/the-secret-flo-plus-edition.jpeg?v=swap",
};

export function displayImageFor(product: Pick<Product, "slug" | "imagePath">): string {
  return PRODUCT_DISPLAY_IMAGES[product.slug] ?? product.imagePath;
}
