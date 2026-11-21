"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("number")?.trim() || "";
  const order = searchParams.get("order") ?? "";
  const confirming = searchParams.get("confirming") === "1";
  const isDemo = searchParams.get("demo") === "1";
  const joinedCircle = searchParams.get("circle") === "1";
  const email = searchParams.get("email")?.trim() || "";
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) setLoggedIn(Boolean(user));
      } catch {
        if (!cancelled) setLoggedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const trackParams = new URLSearchParams();
  if (email) trackParams.set("email", email);
  if (orderNumber) trackParams.set("orderNumber", orderNumber);
  const trackQs = trackParams.toString();
  const trackHref = trackQs ? `/track?${trackQs}` : "/track";

  const forgotHref = email
    ? `/account/forgot?email=${encodeURIComponent(email)}`
    : "/account/forgot";

  return (
    <div className="page-under-header container-flo py-12 text-center md:py-20">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-sm sm:p-10">
        <p className="font-script text-4xl text-flo-pink">Thank you!</p>
        <h1 className="mt-3 text-3xl font-bold text-flo-maroon">
          Order confirmed
        </h1>
        <p className="mt-3 text-flo-ink/70">
          Order number:{" "}
          <span className="font-semibold text-flo-ink">
            {orderNumber || order || "—"}
          </span>
        </p>
        {confirming ? (
          <p className="mt-4 rounded-xl bg-flo-blush px-4 py-3 text-sm text-flo-maroon">
            We received your payment and are confirming it. You&apos;ll get an
            email shortly — you can also track your order anytime.
          </p>
        ) : null}
        {isDemo ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Demo checkout (dev only) — Razorpay keys were not configured. This
            path is blocked in production.
          </p>
        ) : null}

        {joinedCircle && !loggedIn ? (
          <p className="mt-4 rounded-xl bg-flo-blush px-4 py-3 text-sm text-flo-maroon">
            Welcome to Flo Circle
            {email ? (
              <>
                {" "}
                — we&apos;ll use <span className="font-semibold">{email}</span>
              </>
            ) : null}
            . To track your Flo Circle anytime, use Forgot password with this
            email.
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3">
          {loggedIn ? (
            <Link
              href="/account/orders"
              className="inline-flex h-12 items-center justify-center rounded-full bg-flo-brown px-6 text-sm font-bold text-white transition hover:brightness-110"
            >
              View your orders
            </Link>
          ) : (
            <>
              {joinedCircle ? (
                <Link
                  href={forgotHref}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-flo-brown px-6 text-sm font-bold text-white transition hover:brightness-110"
                >
                  Set a password (Forgot password)
                </Link>
              ) : null}
              <Link
                href={`/account/login?next=${encodeURIComponent("/account/orders")}${email ? `&email=${encodeURIComponent(email)}` : ""}`}
                className="inline-flex h-12 items-center justify-center rounded-full bg-flo-soft px-6 text-sm font-bold text-flo-maroon transition hover:bg-flo-blush"
              >
                Sign in to track orders
              </Link>
              <Link
                href={trackHref}
                className="inline-flex h-11 items-center justify-center text-sm font-semibold text-flo-maroon/70 hover:text-flo-pink"
              >
                Guest track (email + order #)
              </Link>
            </>
          )}
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center text-sm font-semibold text-flo-maroon/70 hover:text-flo-pink"
          >
            Back to FloBites
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container-flo py-24 text-center text-flo-ink/60">
          Loading…
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
