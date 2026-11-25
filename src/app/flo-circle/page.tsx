"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, Heart, Package, Sparkles, Star, Users } from "lucide-react";
import { FLO_CIRCLE_BENEFITS, FLO_CIRCLE_INTRO_PLAN_SLUG } from "@/lib/flo-circle";
import { useCartStore } from "@/lib/cart-store";
import { SiteFooter } from "@/components/home/site-footer";
import { formatInr } from "@/lib/utils";
import {
  openRazorpaySubscription,
  PAYMENTS_UNAVAILABLE_MESSAGE,
} from "@/lib/razorpay-client";

const ICONS = [Heart, Package, Sparkles, Gift, Star, Users];

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_inr: number;
  duration_days: number;
};

export default function FloCirclePage() {
  const router = useRouter();
  const openCart = useCartStore((s) => s.openCart);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [paymentsUnavailable, setPaymentsUnavailable] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/flo-circle/plans");
        const data = await res.json();
        if (cancelled) return;
        const list = (data.plans ?? []) as Plan[];
        setPlans(
          list.filter((p) => p.slug !== FLO_CIRCLE_INTRO_PLAN_SLUG),
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function joinPlan(planId: string) {
    setMsg(null);
    setPaymentsUnavailable(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/flo-circle/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.code === "AUTH_REQUIRED") {
            setMsg("Sign in to join Flo Circle — redirecting…");
            router.push(
              `/account/login?next=${encodeURIComponent("/flo-circle")}`,
            );
            return;
          }
          if (data.code === "PAYMENTS_UNAVAILABLE" || res.status === 503) {
            setPaymentsUnavailable(true);
            setMsg(PAYMENTS_UNAVAILABLE_MESSAGE);
            return;
          }
          setMsg(data.error ?? "Could not start membership");
          return;
        }

        if (data.demo) {
          setMsg(
            data.message ??
            "Demo membership activated (dev only). Open your portal to manage it.",
          );
          return;
        }

        if (!data.razorpaySubscriptionId || !data.keyId) {
          setMsg("Payment setup incomplete. Please try again.");
          return;
        }

        const opened = await openRazorpaySubscription({
          keyId: data.keyId,
          subscriptionId: data.razorpaySubscriptionId,
          planName: data.planName,
          amountPaise: data.amount,
          onSuccess: () => {
            setMsg(
              "Payment received — membership activates in a moment. Opening your portal…",
            );
            router.push("/account/membership");
          },
          onDismiss: () => {
            setMsg(
              "Checkout closed — finish payment anytime from your account.",
            );
          },
        });

        if (!opened.ok) {
          setMsg(opened.error);
        }
      } catch {
        setMsg("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      <div className="page-under-header bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_40%,#fce8e2_100%)]">
        <div className="container-flo py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="font-script text-4xl text-flo-pink">Flo Circle</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-flo-maroon md:text-5xl">
              Soft retail membership for your cycle weeks
            </h1>
            <p className="mt-4 text-flo-maroon/70">
              Your period's week has perks, Up to 20% off on every order. Priority packing, gifts, early access, and optional auto-delivery — join with Razorpay or start from cart for ₹1 · 6 months.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FLO_CIRCLE_BENEFITS.map((b, i) => {
              const Icon = ICONS[i] ?? Heart;
              return (
                <motion.div
                  key={b.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur"
                >
                  <div className="mb-3 inline-flex rounded-full bg-flo-pink/10 p-2.5 text-flo-pink">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-flo-maroon">{b.title}</h3>
                  <p className="mt-1 text-sm text-flo-maroon/65">{b.body}</p>
                </motion.div>
              );
            })}
          </div>

          {plans.length > 0 && (
            <div className="mt-12">
              <h2 className="text-center text-lg font-bold text-flo-maroon">
                Choose a plan
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col rounded-3xl bg-white/90 p-5 shadow-sm"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-flo-pink">
                      {p.duration_days} days
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-flo-maroon">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-sm text-flo-maroon/60">
                      {p.description}
                    </p>
                    <p className="mt-3 text-xl font-bold text-flo-maroon">
                      {formatInr(p.price_inr)}
                    </p>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => joinPlan(p.id)}
                      className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-flo-brown px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      {pending ? "Starting…" : "Join"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="text-center text-sm font-semibold text-flo-maroon/70">
              Or join from cart · ₹1 · 6 months
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={openCart}
                className="inline-flex h-12 items-center justify-center rounded-full border border-flo-maroon/25 bg-white px-7 text-sm font-bold text-flo-maroon transition hover:border-flo-brown hover:text-flo-brown"
              >
                Open cart to join
              </button>
              <Link
                href="/#bestsellers"
                className="inline-flex h-12 items-center justify-center rounded-full border border-flo-maroon/25 bg-white px-7 text-sm font-bold text-flo-maroon transition hover:border-flo-brown hover:text-flo-brown"
              >
                Shop FloBites
              </Link>
            </div>
          </div>

          {paymentsUnavailable && (
            <p className="mt-6 text-center text-sm text-flo-maroon/80">
              {PAYMENTS_UNAVAILABLE_MESSAGE}
            </p>
          )}
          {msg && !paymentsUnavailable && (
            <p className="mt-6 text-center text-sm text-flo-pink">{msg}</p>
          )}

          <p className="mt-10 text-center text-sm text-flo-maroon/60">
            Already a member?{" "}
            <Link href="/account" className="font-semibold text-flo-pink">
              Open your portal
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
