"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CANCEL_REASONS, daysRemaining } from "@/lib/flo-circle";

type Sub = {
  id: string;
  status: string;
  cadence_days: number;
  next_ship_at: string | null;
  flo_subscription_items: {
    products: { name: string } | null;
    quantity: number;
  }[];
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    const res = await fetch("/api/flo-circle/me");
    if (res.ok) {
      const d = await res.json();
      setSubs(d.subscriptions ?? []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function act(subscriptionId: string, action: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await fetch("/api/flo-circle/subscription/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          action,
          cancelReason: reason || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMsg(d.error ?? "Failed");
        return;
      }
      setMsg("Updated");
      await load();
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Auto-delivery</h1>
      <p className="mt-1 text-sm text-flo-maroon/60">
        Skip, pause, or cancel anytime. Flo Circle members keep 20% off.
      </p>
      {!subs.length ? (
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-flo-maroon/70">No auto-delivery yet.</p>
          <Link
            href="/#bestsellers"
            className="mt-4 inline-flex text-sm font-bold text-flo-pink"
          >
            Shop FloBites →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {subs.map((s) => (
            <li key={s.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-flo-pink">
                {s.status}
              </p>
              <p className="font-bold text-flo-maroon">
                {s.flo_subscription_items?.[0]?.products?.name ?? "Box"} ×{" "}
                {s.flo_subscription_items?.[0]?.quantity ?? 1}
              </p>
              <p className="text-sm text-flo-maroon/60">
                Every {s.cadence_days} days · next ship{" "}
                {s.next_ship_at
                  ? new Date(s.next_ship_at).toLocaleDateString("en-IN")
                  : "—"}{" "}
                (
                {daysRemaining(s.next_ship_at) != null
                  ? `${daysRemaining(s.next_ship_at)}d`
                  : "—"}
                )
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["skip", "pause", "resume"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    disabled={pending}
                    onClick={() => act(s.id, a)}
                    className="rounded-full bg-flo-soft px-3 py-1.5 text-xs font-bold capitalize text-flo-maroon"
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-9 rounded-xl border border-flo-maroon/15 bg-flo-soft px-2 text-xs"
                >
                  <option value="">Cancel reason</option>
                  {CANCEL_REASONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending || !reason}
                  onClick={() => act(s.id, "cancel")}
                  className="rounded-full bg-flo-maroon px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="mt-3 text-sm text-flo-pink">{msg}</p>}
    </div>
  );
}
