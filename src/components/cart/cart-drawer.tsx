"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ProductRichAccordion } from "@/components/product/product-rich-accordion";
import { useCartStore } from "@/lib/cart-store";
import { PRODUCTS, type Product } from "@/lib/data";
import {
  FLO_CIRCLE_INTRO_DAYS,
  FLO_CIRCLE_INTRO_FEE_INR,
} from "@/lib/flo-circle";
import { formatInr, getOrCreateSessionId } from "@/lib/utils";

const FEATURED =
  PRODUCTS.find((p) => p.cornerRibbon === "Best seller") ?? PRODUCTS[0];

function discountLabel(discount: {
  kind?: "love_score" | "manual";
  lovedName?: string;
} | null) {
  if (!discount) return "";
  if (discount.kind === "manual") return "Coupon";
  if (discount.lovedName) return "Love Score";
  return discount.kind === "love_score" ? "Love Score" : "Code";
}

function CouponField() {
  const discount = useCartStore((s) => s.discount);
  const setDiscount = useCartStore((s) => s.setDiscount);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (discount?.code) setCode(discount.code);
  }, [discount?.code]);

  async function applyCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 3) {
      setError("Enter a discount code.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          sessionId: getOrCreateSessionId(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.valid) {
        setError(data?.error || "This code couldn’t be applied.");
        return;
      }
      setDiscount({
        code: data.code,
        percentOff: data.percentOff,
        lovedName: data.lovedName || "",
        kind: data.kind === "manual" ? "manual" : "love_score",
      });
      setCode(data.code);
    } catch {
      setError("Could not validate code. Try again.");
    } finally {
      setPending(false);
    }
  }

  function clearCode() {
    setDiscount(null);
    setCode("");
    setError(null);
  }

  if (discount) {
    return (
      <div className="rounded-2xl bg-flo-blush/70 px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-flo-maroon/50">
              Applied {discountLabel(discount)}
            </p>
            <p className="mt-0.5 truncate font-bold text-flo-maroon">
              {discount.code}
              <span className="ml-1.5 font-semibold text-flo-pink">
                · {discount.percentOff}% off
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={clearCode}
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-flo-maroon/60 transition hover:bg-white hover:text-flo-pink"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={applyCode} className="space-y-2">
      <label
        htmlFor="cart-coupon"
        className="text-xs font-bold uppercase tracking-wider text-flo-maroon/50"
      >
        Discount code
      </label>
      <div className="flex gap-2">
        <input
          id="cart-coupon"
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Enter code"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-flo-maroon placeholder:normal-case placeholder:tracking-normal placeholder:text-flo-maroon/35 focus:border-flo-pink focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-flo-maroon px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50 active:scale-95"
        >
          {pending ? "…" : "Apply"}
        </button>
      </div>
      {error ? (
        <p className="text-xs font-semibold text-flo-pink" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function EmptyCartFeatured({
  onAdd,
  onClose,
}: {
  onAdd: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <p className="text-center text-sm text-flo-maroon/70">
        Your cart is empty — start with our Best Seller.
      </p>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="relative h-40 bg-flo-cream">
          <span className="absolute left-3 top-3 z-10 rounded-full bg-flo-brown px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Best seller
          </span>
          <Image
            src={FEATURED.imagePath}
            alt={FEATURED.name}
            fill
            className="object-contain p-4"
            sizes="360px"
          />
        </div>
        <div className="space-y-3 p-4">
          <div>
            <p className="text-xs font-bold text-flo-maroon/60">
              {FEATURED.packLabel}
            </p>
            <Link
              href={`/product/${FEATURED.slug}`}
              onClick={onClose}
              className="text-lg font-bold text-flo-maroon hover:text-flo-pink"
            >
              {FEATURED.name}
            </Link>
            <p className="mt-1 text-sm font-semibold text-flo-pink">
              {FEATURED.tagline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-flo-maroon/75">
              {FEATURED.description}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-flo-maroon/50">
              Ingredients
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {FEATURED.ingredients?.map((ing) => (
                <li
                  key={ing}
                  className="rounded-full bg-flo-blush px-2.5 py-1 text-[11px] font-medium text-flo-maroon"
                >
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xl font-bold text-flo-pink">
              {formatInr(FEATURED.priceInr)}
            </p>
            <button
              type="button"
              onClick={onAdd}
              className="rounded-full bg-flo-brown px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
            >
              Add to cart
            </button>
          </div>

          <Link
            href="/#bestsellers"
            onClick={onClose}
            className="block text-center text-sm font-semibold text-flo-maroon/70 underline-offset-2 hover:text-flo-brown hover:underline"
          >
            Or browse all Best Sellers →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function SingleProductDetails({
  productId,
}: {
  productId: string;
}) {
  const fallback = PRODUCTS.find((p) => p.id === productId);
  const [product, setProduct] = useState<Product | undefined>(fallback);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) return;
        const data = (await res.json()) as { products?: Product[] };
        const live = data.products?.find((p) => p.id === productId);
        if (!cancelled && live) setProduct(live);
      } catch {
        /* keep static fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!product?.content) return null;

  return (
    <div className="mt-4 space-y-2">
      {product.tagline ? (
        <p className="px-0.5 text-sm font-semibold text-flo-pink">
          {product.tagline}
        </p>
      ) : null}
      <ProductRichAccordion content={product.content} variant="cart" />
    </div>
  );
}

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const addProduct = useCartStore((s) => s.addProduct);
  const discount = useCartStore((s) => s.discount);
  const joinFloCircle = useCartStore((s) => s.joinFloCircle);
  const setJoinFloCircle = useCartStore((s) => s.setJoinFloCircle);
  const applyMemberDiscount = useCartStore((s) => s.applyMemberDiscount);
  const isActiveMember = useCartStore((s) => s.isActiveMember);
  const setApplyMemberDiscount = useCartStore((s) => s.setApplyMemberDiscount);
  const setIsActiveMember = useCartStore((s) => s.setIsActiveMember);
  const appliedPercent = useCartStore((s) => s.appliedPercent());
  const subtotal = useCartStore((s) => s.subtotal());
  const discountAmount = useCartStore((s) => s.discountAmount());
  const membershipFee = useCartStore((s) => s.membershipFee());
  const total = useCartStore((s) => s.total());
  const isSingleUnitCart = useCartStore((s) => s.isSingleUnitCart());

  useEffect(() => {
    if (!isOpen) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeCart]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/flo-circle/me");
        if (!res.ok) {
          if (!cancelled) {
            setIsActiveMember(false);
            setApplyMemberDiscount(false);
          }
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const active = data?.membership?.status === "active";
        setIsActiveMember(Boolean(active));
        setApplyMemberDiscount(Boolean(data?.memberDiscountEligible));
      } catch {
        if (!cancelled) {
          setIsActiveMember(false);
          setApplyMemberDiscount(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, setApplyMemberDiscount, setIsActiveMember]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart overlay"
            className="fixed inset-0 z-[60] bg-flo-maroon/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            className="fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-md flex-col bg-flo-soft shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            style={{ transformOrigin: "center right" }}
          >
            <div
              className="flex items-center justify-between border-b border-flo-maroon/10 px-5 pb-4"
              style={{
                paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))",
              }}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-5 text-flo-brown" />
                <h2
                  id="cart-drawer-title"
                  className="text-lg font-bold text-flo-maroon"
                >
                  Your Cart
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="rounded-full p-2 transition hover:bg-flo-cream active:scale-95"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <EmptyCartFeatured
                  onAdd={() => addProduct(FEATURED)}
                  onClose={closeCart}
                />
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li
                      key={item.productId}
                      className="rounded-2xl bg-white p-3 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-flo-cream"
                        >
                          <Image
                            src={item.imagePath}
                            alt={item.name}
                            fill
                            className="object-contain p-1"
                          />
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/product/${item.slug}`}
                              onClick={closeCart}
                              className="font-bold text-flo-maroon hover:text-flo-pink"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              aria-label={`Remove ${item.name} from cart`}
                              className="text-flo-maroon/40 transition hover:text-flo-pink"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-flo-pink">
                            {formatInr(item.priceInr)}
                          </p>
                          <div className="mt-auto flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="rounded-full bg-flo-cream p-1 transition hover:bg-flo-brown hover:text-white"
                              onClick={() =>
                                setQuantity(item.productId, item.quantity - 1)
                              }
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span
                              className="w-6 text-center text-sm font-bold"
                              aria-label={`Quantity: ${item.quantity}`}
                            >
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              className="rounded-full bg-flo-cream p-1 transition hover:bg-flo-brown hover:text-white"
                              onClick={() =>
                                setQuantity(item.productId, item.quantity + 1)
                              }
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {isSingleUnitCart ? (
                        <SingleProductDetails productId={item.productId} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className="space-y-3 border-t border-flo-maroon/10 bg-white px-5 pt-4"
              style={{
                paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
              }}
            >
              <CouponField />

              {!isActiveMember ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-flo-blush/80 px-3.5 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={joinFloCircle}
                    onChange={(e) => setJoinFloCircle(e.target.checked)}
                    className="mt-0.5 accent-flo-brown"
                  />
                  <span>
                    <span className="font-bold text-flo-maroon">
                      Join Flo Circle · {formatInr(FLO_CIRCLE_INTRO_FEE_INR)}
                    </span>
                    <span className="block text-xs text-flo-maroon/60">
                      {FLO_CIRCLE_INTRO_DAYS / 30} months of membership · no
                      account needed now
                    </span>
                  </span>
                </label>
              ) : (
                <p className="rounded-2xl bg-flo-blush/80 px-3.5 py-3 text-sm font-semibold text-flo-maroon">
                  Flo Circle member
                  {applyMemberDiscount
                    ? " · 20% pricing on this order"
                    : " · member pricing per your plan rule"}
                </p>
              )}
              <div className="flex justify-between gap-4 text-sm">
                <span>Subtotal</span>
                <span className="shrink-0 font-semibold">
                  {formatInr(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between gap-4 text-sm text-flo-pink">
                  <span className="min-w-0 pr-2">
                    Best discount ({appliedPercent}%
                    {discount ? ` · ${discountLabel(discount)}` : ""}
                    {applyMemberDiscount ? ` · Flo Circle` : ""})
                  </span>
                  <span className="shrink-0 font-semibold">
                    −{formatInr(discountAmount)}
                  </span>
                </div>
              )}
              {membershipFee > 0 && (
                <div className="flex justify-between gap-4 text-sm text-flo-maroon/80">
                  <span>Flo Circle intro</span>
                  <span className="shrink-0 font-semibold">
                    {formatInr(membershipFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4 text-base font-bold text-flo-maroon">
                <span>Total</span>
                <span className="shrink-0">{formatInr(total)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className={`flex h-12 items-center justify-center rounded-full bg-flo-brown text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98] ${
                  items.length === 0 ? "pointer-events-none opacity-40" : ""
                }`}
              >
                Checkout
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
