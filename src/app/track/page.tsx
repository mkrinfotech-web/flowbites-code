"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { formatInr } from "@/lib/utils";

type TrackedOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  totalInr: number;
  customerName: string | null;
};

const STATUS_COPY: Record<string, string> = {
  pending: "We’re confirming your payment.",
  paid: "Payment received — your pack is in our soft queue.",
  verified: "Order verified — getting ready for packing.",
  processing: "Your pack is being prepared with care.",
  shipped: "On its way to you.",
  delivered: "Delivered — enjoy your FloBites.",
  cancelled: "This order was cancelled.",
  refunded: "Refunded.",
  failed: "Payment didn’t go through.",
};

export default function TrackOrderPage() {
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [pending, startTransition] = useTransition();
  const [prefill, setPrefill] = useState({ email: "", orderNumber: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPrefill({
      email: params.get("email") ?? "",
      orderNumber: params.get("orderNumber") ?? "",
    });
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          orderNumber: fd.get("orderNumber"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrder(null);
        setError(data.error ?? "Couldn’t find that order.");
        return;
      }
      setOrder(data.order as TrackedOrder);
    });
  }

  return (
    <div className="page-under-header min-h-[70vh] bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_55%,#fce8e2_100%)]">
      <div className="container-flo max-w-lg py-12 md:py-16">
        <p className="font-script text-3xl text-flo-pink">FloBites</p>
        <h1 className="mt-1 text-3xl font-bold text-flo-maroon">Track your pack</h1>
        <p className="mt-2 text-sm text-flo-maroon/65">
          Enter the email used at checkout and your order number — no account
          needed.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-medium text-flo-maroon">
            Email
            <input
              name="email"
              type="email"
              key={`email-${prefill.email}`}
              defaultValue={prefill.email}
              required
              autoComplete="email"
              className="mt-1 h-11 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3"
            />
          </label>
          <label className="block text-sm font-medium text-flo-maroon">
            Order number
            <input
              name="orderNumber"
              key={`order-${prefill.orderNumber}`}
              defaultValue={prefill.orderNumber}
              required
              placeholder="e.g. FLO-…"
              className="mt-1 h-11 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 font-mono"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-full bg-flo-brown text-sm font-bold text-white disabled:opacity-60"
          >
            {pending ? "Looking…" : "Track order"}
          </button>
          {error && (
            <p className="rounded-2xl bg-flo-blush px-4 py-3 text-sm text-flo-maroon">
              {error}
            </p>
          )}
        </form>

        {order && (
          <div className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-lg font-bold text-flo-maroon">
                  {order.orderNumber}
                </p>
                <p className="text-xs text-flo-maroon/50">
                  Placed{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
              <span className="rounded-full bg-flo-blush px-3 py-1 text-xs font-bold capitalize text-flo-maroon">
                {order.status}
              </span>
            </div>
            <p className="text-sm text-flo-maroon/75">
              {STATUS_COPY[order.status] ??
                "We’re taking care of your order."}
            </p>
            {order.trackingNumber && (
              <div className="rounded-2xl bg-flo-soft px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-flo-maroon/50">
                  Courier tracking
                </p>
                <p className="mt-1 font-mono font-bold text-flo-maroon">
                  {order.trackingNumber}
                </p>
                {order.shippedAt && (
                  <p className="mt-1 text-xs text-flo-maroon/50">
                    Shipped{" "}
                    {new Date(order.shippedAt).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
            )}
            <p className="text-sm font-semibold text-flo-maroon">
              Total {formatInr(order.totalInr)}
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-flo-maroon/60">
          Have an account?{" "}
          <Link href="/account/orders" className="font-bold text-flo-pink">
            View orders in your account
          </Link>
        </p>
      </div>
    </div>
  );
}
