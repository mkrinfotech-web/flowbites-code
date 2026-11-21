"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/data";
import {
  FLO_CIRCLE_INTRO_FEE_INR,
  FLO_CIRCLE_PERCENT,
} from "@/lib/flo-circle";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceInr: number;
  imagePath: string;
  quantity: number;
};

type Discount = {
  code: string;
  percentOff: number;
  lovedName: string;
  /** love_score from Love Score; manual from promo coupon */
  kind?: "love_score" | "manual";
} | null;

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  discount: Discount;
  /** Default checked — ₹1 intro join at checkout */
  joinFloCircle: boolean;
  floCirclePlanId: string | null;
  /**
   * Server/timing may grant 20% on this order (active member + rule).
   * Join alone does NOT force 20% (default timing = second_order).
   */
  applyMemberDiscount: boolean;
  /** When true, join checkbox is cosmetic / hidden fee */
  isActiveMember: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addProduct: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: Discount) => void;
  setJoinFloCircle: (v: boolean) => void;
  setFloCirclePlanId: (id: string | null) => void;
  setApplyMemberDiscount: (v: boolean) => void;
  setIsActiveMember: (v: boolean) => void;
  clearCart: () => void;
  subtotal: () => number;
  discountAmount: () => number;
  appliedPercent: () => number;
  membershipFee: () => number;
  total: () => number;
  itemCount: () => number;
  /** Exactly one distinct product with qty === 1 */
  isSingleUnitCart: () => boolean;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      discount: null,
      joinFloCircle: true,
      floCirclePlanId: null,
      applyMemberDiscount: false,
      isActiveMember: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      addProduct: (product, qty = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          const items = existing
            ? state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: Math.min(20, i.quantity + qty) }
                  : i,
              )
            : [
                ...state.items,
                {
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  priceInr: product.priceInr,
                  imagePath: product.imagePath,
                  quantity: qty,
                },
              ];
          return { items, isOpen: true };
        });
      },
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(0, Math.min(20, quantity)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      setDiscount: (discount) => set({ discount }),
      setJoinFloCircle: (joinFloCircle) => set({ joinFloCircle }),
      setFloCirclePlanId: (floCirclePlanId) => set({ floCirclePlanId }),
      setApplyMemberDiscount: (applyMemberDiscount) =>
        set({ applyMemberDiscount }),
      setIsActiveMember: (isActiveMember) =>
        set({
          isActiveMember,
          ...(isActiveMember ? { joinFloCircle: false } : {}),
        }),
      clearCart: () =>
        set({
          items: [],
          discount: null,
          joinFloCircle: !get().isActiveMember,
          applyMemberDiscount: false,
        }),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.priceInr * i.quantity, 0),
      appliedPercent: () => {
        const { discount, applyMemberDiscount } = get();
        const candidates = [
          applyMemberDiscount ? FLO_CIRCLE_PERCENT : 0,
          discount?.percentOff ?? 0,
        ];
        return Math.max(...candidates, 0);
      },
      discountAmount: () => {
        const pct = get().appliedPercent();
        if (!pct) return 0;
        return Math.round((get().subtotal() * pct) / 100);
      },
      membershipFee: () => {
        const { joinFloCircle, isActiveMember } = get();
        return joinFloCircle && !isActiveMember
          ? FLO_CIRCLE_INTRO_FEE_INR
          : 0;
      },
      total: () =>
        Math.max(
          0,
          get().subtotal() - get().discountAmount() + get().membershipFee(),
        ),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      isSingleUnitCart: () => {
        const { items } = get();
        return items.length === 1 && items[0]!.quantity === 1;
      },
    }),
    { name: "flo-cart-v3" },
  ),
);
