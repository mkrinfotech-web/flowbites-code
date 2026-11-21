"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import {
  FLO_CIRCLE_INTRO_DAYS,
  FLO_CIRCLE_INTRO_FEE_INR,
} from "@/lib/flo-circle";
import { formatInr, getOrCreateSessionId } from "@/lib/utils";
import { PAYMENTS_UNAVAILABLE_MESSAGE } from "@/lib/razorpay-client";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const discount = useCartStore((s) => s.discount);
  const joinFloCircle = useCartStore((s) => s.joinFloCircle);
  const floCirclePlanId = useCartStore((s) => s.floCirclePlanId);
  const setJoinFloCircle = useCartStore((s) => s.setJoinFloCircle);
  const setApplyMemberDiscount = useCartStore((s) => s.setApplyMemberDiscount);
  const setIsActiveMember = useCartStore((s) => s.setIsActiveMember);
  const applyMemberDiscount = useCartStore((s) => s.applyMemberDiscount);
  const isActiveMember = useCartStore((s) => s.isActiveMember);
  const subtotal = useCartStore((s) => s.subtotal());
  const discountAmount = useCartStore((s) => s.discountAmount());
  const appliedPercent = useCartStore((s) => s.appliedPercent());
  const membershipFee = useCartStore((s) => s.membershipFee());
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);

  const paidRef = useRef(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentsUnavailable, setPaymentsUnavailable] = useState(false);
  const [demoNotice, setDemoNotice] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [prefilled, setPrefilled] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Member discount preview + checkout prefill from profile / default address
  useEffect(() => {
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

        if (!prefilled) {
          const profile = data?.profile;
          const address = data?.address ?? data?.defaultAddress;
          setForm((f) => ({
            name: f.name || profile?.full_name || "",
            email: f.email || profile?.email || "",
            phone: f.phone || profile?.phone || "",
            line1: f.line1 || address?.line1 || "",
            line2: f.line2 || address?.line2 || "",
            city: f.city || address?.city || "",
            state: f.state || address?.state || "",
            pincode: f.pincode || address?.pincode || "",
          }));
          setPrefilled(true);
        }
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
  }, [prefilled, setApplyMemberDiscount, setIsActiveMember]);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email address.";
    if (!/^\d{10}$/.test(form.phone.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "")))
      errs.phone = "Enter a 10-digit phone number.";
    if (form.line1.trim().length < 3) errs.line1 = "Enter your address.";
    if (form.city.trim().length < 2) errs.city = "Enter your city.";
    if (form.state.trim().length < 2) errs.state = "Enter your state.";
    if (!/^\d{6}$/.test(form.pincode.trim()))
      errs.pincode = "Enter a 6-digit PIN code.";
    return errs;
  }

  function pay() {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Please fix the highlighted fields and try again.");
      return;
    }
    setError(null);
    setPaymentsUnavailable(false);
    setDemoNotice(false);
    paidRef.current = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/checkout/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""),
            address: {
              line1: form.line1.trim(),
              line2: form.line2.trim() || undefined,
              city: form.city.trim(),
              state: form.state.trim(),
              pincode: form.pincode.trim(),
            },
            items: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
            discountCode: discount?.code,
            sessionId: getOrCreateSessionId(),
            joinFloCircle,
            floCirclePlanId: floCirclePlanId || undefined,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.code === "PAYMENTS_UNAVAILABLE" || res.status === 503) {
            setPaymentsUnavailable(true);
            setError(data.error ?? PAYMENTS_UNAVAILABLE_MESSAGE);
            return;
          }
          if (data.code === "INSUFFICIENT_STOCK") {
            setError(data.error ?? "Some items are out of stock.");
            return;
          }
          setError(data.error ?? "Could not create order");
          return;
        }

        const successQs = new URLSearchParams({ order: String(data.orderId) });
        if (data.orderNumber) {
          successQs.set("number", String(data.orderNumber));
        }
        if (data.includesFloCircleJoin || data.guestFloCircleClaim) {
          successQs.set("circle", "1");
        }
        if (form.email.trim()) {
          successQs.set("email", form.email.trim());
        }

        // Dev/demo only — never silent; production returns 503 instead
        if (data.demo) {
          setDemoNotice(true);
          clearCart();
          successQs.set("demo", "1");
          router.push(`/checkout/success?${successQs.toString()}`);
          return;
        }

        if (!window.Razorpay) {
          setError("Payment failed to load. Refresh and try again.");
          return;
        }

        const rzp = new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: "INR",
          name: "FloBites",
          description: "Snacks for those days",
          order_id: data.razorpayOrderId,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone,
          },
          modal: {
            ondismiss: () => {
              if (paidRef.current) return;
              setPaymentOpen(false);
              setError(
                (prev) => prev ?? "Payment was cancelled — you can try again.",
              );
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            paidRef.current = true;
            try {
              const verify = await fetch("/api/checkout/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: data.orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              if (!verify.ok) throw new Error("verify failed");
            } catch {
              // Money was captured; the webhook completes the order server-side.
              successQs.set("confirming", "1");
            }
            clearCart();
            router.push(`/checkout/success?${successQs.toString()}`);
          },
          theme: { color: "#551313" },
        });
        rzp.on("payment.failed", (raw: unknown) => {
          const resp = raw as { error?: { description?: string } };
          setError(
            resp?.error?.description
              ? `Payment failed: ${resp.error.description}. You can try again.`
              : "Payment failed — you can try again.",
          );
        });
        setPaymentOpen(true);
        rzp.open();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="page-under-header container-flo py-16 text-center md:py-20">
        <h1 className="text-3xl font-bold text-flo-maroon">Your cart is empty</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-flo-maroon/65">
          Add a Best Seller to continue. Checkout payments run through Razorpay
          once you&apos;re ready to pay.
        </p>
        <Link
          href="/#bestsellers"
          className="mt-6 inline-flex rounded-full bg-flo-brown px-6 py-3 font-bold text-white transition hover:brightness-110"
        >
          Shop Best Sellers
        </Link>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="page-under-header bg-flo-cream py-10 md:py-14">
        <div className="container-flo grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <h1 className="text-2xl font-bold text-flo-maroon md:text-3xl">
              Checkout
            </h1>
            <p className="mt-1 text-sm text-flo-maroon/60">
              Secure payment via Razorpay · discounts use best-of-one stacking
            </p>

            <div className="mt-5">
              {!isActiveMember ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-flo-blush px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={joinFloCircle}
                    onChange={(e) => setJoinFloCircle(e.target.checked)}
                    className="mt-0.5 accent-flo-pink"
                  />
                  <span>
                    <span className="font-bold text-flo-maroon">
                      Join Flo Circle · {formatInr(FLO_CIRCLE_INTRO_FEE_INR)}
                    </span>
                    <span className="block text-xs text-flo-maroon/65">
                      {Math.round(FLO_CIRCLE_INTRO_DAYS / 30)} months of
                      membership added to this order. No account needed now.{" "}
                      <Link href="/flo-circle" className="underline">
                        Learn more
                      </Link>
                    </span>
                  </span>
                </label>
              ) : (
                <p className="rounded-2xl bg-flo-blush px-4 py-3 text-sm font-semibold text-flo-maroon">
                  Flo Circle member
                  {applyMemberDiscount
                    ? " · 20% pricing applies on this order"
                    : " · member pricing follows admin timing rule"}
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["name", "Full name", "text"],
                  ["email", "Email", "email"],
                  ["phone", "Phone", "tel"],
                  ["line1", "Address line 1", "text"],
                  ["line2", "Address line 2 (optional)", "text"],
                  ["city", "City", "text"],
                  ["state", "State", "text"],
                  ["pincode", "PIN code", "text"],
                ] as const
              ).map(([field, label, type]) => (
                <label
                  key={field}
                  className={`block text-sm font-medium ${
                    field === "line1" || field === "line2" ? "sm:col-span-2" : ""
                  }`}
                >
                  {label}
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(e) => update(field, e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base outline-none transition focus:border-flo-pink"
                    required={field !== "line2"}
                    aria-invalid={Boolean(fieldErrors[field])}
                    inputMode={
                      field === "phone" || field === "pincode"
                        ? "numeric"
                        : undefined
                    }
                  />
                  {fieldErrors[field] && (
                    <span className="mt-1 block text-xs font-normal text-flo-pink">
                      {fieldErrors[field]}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {error && (
              <p
                className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                  paymentsUnavailable
                    ? "bg-flo-blush text-flo-maroon"
                    : "bg-flo-pink/10 text-flo-pink"
                }`}
                role="alert"
              >
                {error}
              </p>
            )}

            {demoNotice && (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Demo checkout (dev only) — Razorpay keys are not configured.
              </p>
            )}

            <button
              type="button"
              disabled={pending || paymentOpen}
              onClick={pay}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-flo-brown text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              {pending || paymentOpen ? "Processing…" : `Pay ${formatInr(total)}`}
            </button>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-bold text-flo-maroon">Order summary</h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="relative size-14 overflow-hidden rounded-xl bg-flo-cream">
                    <Image
                      src={item.imagePath}
                      alt={item.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">
                      {item.name} × {item.quantity}
                    </p>
                    <p className="text-flo-pink">
                      {formatInr(item.priceInr * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-flo-maroon/10 pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatInr(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-flo-pink">
                  <span>
                    Best discount ({appliedPercent}%
                    {applyMemberDiscount ? " · Flo Circle" : ""})
                  </span>
                  <span>−{formatInr(discountAmount)}</span>
                </div>
              )}
              {membershipFee > 0 && (
                <div className="flex justify-between text-flo-maroon/80">
                  <span>Flo Circle intro</span>
                  <span>{formatInr(membershipFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-flo-maroon">
                <span>Total</span>
                <span>{formatInr(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
