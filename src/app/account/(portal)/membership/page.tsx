"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CANCEL_REASONS,
  FLO_CIRCLE_INTRO_PLAN_SLUG,
} from "@/lib/flo-circle";
import { formatInr } from "@/lib/utils";
import {
  openRazorpaySubscription,
  PAYMENTS_UNAVAILABLE_MESSAGE,
} from "@/lib/razorpay-client";

type Membership = {
  id: string;
  status: string;
  ends_at: string | null;
  flo_circle_plans: { name: string; price_inr: number } | null;
};

type Plan = {
  id: string;
  name: string;
  price_inr: number;
  slug: string;
  duration_days?: number;
};

export default function MembershipPage() {
  const router = useRouter();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const res = await fetch("/api/flo-circle/me");
    if (res.ok) {
      const d = await res.json();
      setMembership(d.membership);
    } else {
      setMembership(null);
    }
    const p = await fetch("/api/flo-circle/plans").then((r) => r.json());
    setPlans(p.plans ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  const joinPlans = plans.filter((p) => p.slug !== FLO_CIRCLE_INTRO_PLAN_SLUG);

  async function openSubscriptionCheckout(data: {
    razorpaySubscriptionId?: string;
    keyId?: string;
    amount?: number;
    planName?: string;
  }) {
    if (!data.razorpaySubscriptionId || !data.keyId) {
      setMsg("Payment setup incomplete. Please try again.");
      return;
    }

    const opened = await openRazorpaySubscription({
      keyId: data.keyId,
      subscriptionId: data.razorpaySubscriptionId,
      planName: data.planName,
      amountPaise: data.amount,
      onSuccess: async () => {
        setMsg(
          "Payment received — membership updates in a moment.",
        );
        await refresh();
      },
      onDismiss: () => {
        setMsg("Checkout closed — you can try again when ready.");
      },
    });

    if (!opened.ok) {
      setMsg(opened.error);
    }
  }

  function joinPlan(planId: string) {
    setMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/flo-circle/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        });
        const d = await res.json();

        if (!res.ok) {
          if (d.code === "AUTH_REQUIRED") {
            setMsg("Sign in required — redirecting…");
            router.push(
              `/account/login?next=${encodeURIComponent("/account/membership")}`,
            );
            return;
          }
          if (d.code === "PAYMENTS_UNAVAILABLE" || res.status === 503) {
            setMsg(PAYMENTS_UNAVAILABLE_MESSAGE);
            return;
          }
          setMsg(d.error ?? "Could not join");
          return;
        }

        if (d.demo) {
          setMsg(
            d.message ??
              "Demo membership activated (dev only).",
          );
          await refresh();
          return;
        }

        await openSubscriptionCheckout(d);
      } catch {
        setMsg("Something went wrong. Please try again.");
      }
    });
  }

  function act(
    action: "pause" | "resume" | "cancel" | "change_plan",
    planId?: string,
  ) {
    if (!membership) return;
    setMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/flo-circle/membership/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            membershipId: membership.id,
            action,
            planId,
            cancelReason: reason || undefined,
          }),
        });
        const d = await res.json();
        if (!res.ok) {
          if (d.code === "PAYMENTS_UNAVAILABLE" || res.status === 503) {
            setMsg(PAYMENTS_UNAVAILABLE_MESSAGE);
            return;
          }
          setMsg(d.error ?? "Failed");
          return;
        }

        if (action === "change_plan") {
          if (d.demo) {
            setMsg(
              d.message ?? "Demo plan change applied (dev only).",
            );
            await refresh();
            return;
          }
          if (d.razorpaySubscriptionId && d.keyId) {
            setMsg("Confirm payment to finish your plan change…");
            await openSubscriptionCheckout(d);
            return;
          }
        }

        setMsg(`Updated · ${d.status ?? action}`);
        await refresh();
      } catch {
        setMsg("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Membership</h1>
      {!membership ||
      !["active", "paused", "past_due", "pending"].includes(
        membership.status,
      ) ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-flo-maroon/70">No membership yet.</p>
            <p className="mt-2 text-sm text-flo-maroon/60">
              Join Flo Circle with Razorpay, or start from cart for ₹1 · 6
              months.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/flo-circle"
                className="inline-flex h-11 items-center rounded-full border border-flo-maroon/20 bg-white px-5 text-sm font-bold text-flo-maroon"
              >
                See benefits
              </Link>
              <Link
                href="/#bestsellers"
                className="inline-flex h-11 items-center rounded-full border border-flo-maroon/20 bg-white px-5 text-sm font-bold text-flo-maroon"
              >
                Shop &amp; join from cart
              </Link>
            </div>
          </div>

          {joinPlans.length > 0 && (
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-bold text-flo-maroon">Join Flo Circle</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {joinPlans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={pending}
                    onClick={() => joinPlan(p.id)}
                    className="rounded-full bg-flo-pink px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Join {p.name} · {formatInr(p.price_inr)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase text-flo-pink">
              {membership.status}
            </p>
            <h2 className="text-xl font-bold text-flo-maroon">
              {membership.flo_circle_plans?.name ?? "Plan"}
            </h2>
            <p className="mt-1 text-sm text-flo-maroon/60">
              Ends / renews{" "}
              {membership.ends_at
                ? new Date(membership.ends_at).toLocaleDateString("en-IN")
                : "—"}
            </p>
            {membership.status === "pending" && (
              <p className="mt-3 text-sm text-flo-maroon/70">
                Payment pending — complete Razorpay checkout if it was
                interrupted, or pick a plan below to start again.
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {membership.status === "active" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act("pause")}
                  className="rounded-full bg-flo-soft px-4 py-2 text-xs font-bold text-flo-maroon"
                >
                  Pause
                </button>
              )}
              {membership.status === "paused" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act("resume")}
                  className="rounded-full bg-flo-pink px-4 py-2 text-xs font-bold text-white"
                >
                  Resume
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="font-bold text-flo-maroon">Change plan</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {joinPlans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={pending}
                  onClick={() => act("change_plan", p.id)}
                  className="rounded-full border border-flo-maroon/15 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                >
                  {p.name} · {formatInr(p.price_inr)}
                </button>
              ))}
            </div>
          </div>

          {membership.status !== "pending" && (
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-bold text-flo-maroon">Cancel</h3>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-3 h-10 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-sm"
              >
                <option value="">Select reason</option>
                {CANCEL_REASONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending || !reason}
                onClick={() => act("cancel")}
                className="mt-3 rounded-full bg-flo-maroon px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                Cancel membership
              </button>
            </div>
          )}
        </div>
      )}
      {msg && <p className="mt-4 text-sm text-flo-pink">{msg}</p>}
    </div>
  );
}
