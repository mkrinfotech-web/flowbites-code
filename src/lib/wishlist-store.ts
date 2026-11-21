"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/data";

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  packLabel: string;
  priceInr: number;
  imagePath: string;
  badge: string;
  shelfColor: string;
  ingredients?: string[];
};

type WishlistState = {
  items: WishlistItem[];
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
  count: () => number;
  toProduct: (item: WishlistItem) => Product;
};

function toWishlistItem(product: Product): WishlistItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    packLabel: product.packLabel,
    priceInr: product.priceInr,
    imagePath: product.imagePath,
    badge: product.badge,
    shelfColor: product.shelfColor,
    ingredients: product.ingredients,
  };
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) => {
        set((state) => {
          const exists = state.items.some((i) => i.productId === product.id);
          if (exists) {
            return {
              items: state.items.filter((i) => i.productId !== product.id),
            };
          }
          return { items: [...state.items, toWishlistItem(product)] };
        });
      },
      remove: (productId) =>
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
        })),
      has: (productId) => get().items.some((i) => i.productId === productId),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
      toProduct: (item) => ({
        id: item.productId,
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        packLabel: item.packLabel,
        priceInr: item.priceInr,
        imagePath: item.imagePath,
        badge: item.badge,
        shelfColor: item.shelfColor,
        ingredients: item.ingredients,
      }),
    }),
    { name: "flo-wishlist-v1" },
  ),
);
