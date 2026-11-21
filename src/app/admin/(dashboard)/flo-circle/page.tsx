import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatInr } from "@/lib/utils";
import { Heart, Users } from "lucide-react";

const LINKS = [
  { href: "/admin/flo-circle/plans", label: "Plans" },
  { href: "/admin/flo-circle/members", label: "Members" },
  { href: "/admin/flo-circle/subscriptions", label: "Subscriptions" },
  { href: "/admin/flo-circle/gifts", label: "Gifts queue" },
  { href: "/admin/flo-circle/events", label: "Events & launches" },
];

export default async function FloCircleAdminPage() {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const week = new Date();
  week.setDate(week.getDate() + 7);

  const [
    { count: activeCount },
    { count: totalJoined },
    { count: joins30 },
    { data: activeMemberships },
    { count: cancelled30 },
    { count: shipmentsDue },
    { data: stack },
  ] = await Promise.all([
    supabase
      .from("flo_circle_memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("flo_circle_memberships")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "paused", "past_due", "cancelled", "expired"]),
    supabase
      .from("flo_circle_memberships")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since.toISOString()),
    supabase
      .from("flo_circle_memberships")
      .select("flo_circle_plans(price_inr, duration_days)")
      .eq("status", "active"),
    supabase
      .from("flo_circle_memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("cancelled_at", since.toISOString()),
    supabase
      .from("flo_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .lte("next_ship_at", week.toISOString()),
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "discount_stack_mode")
      .maybeSingle(),
  ]);

  let mrr = 0;
  for (const m of activeMemberships ?? []) {
    const plan = m.flo_circle_plans as {
      price_inr?: number;
      duration_days?: number;
    } | null;
    if (!plan?.price_inr || !plan.duration_days) continue;
    mrr += (plan.price_inr * 30) / plan.duration_days;
  }

  const startActive = (activeCount ?? 0) + (cancelled30 ?? 0);
  const churn =
    startActive > 0
      ? Math.round(((cancelled30 ?? 0) / startActive) * 1000) / 10
      : 0;

  const stackMode = String(stack?.value ?? "best_of_one").replace(/"/g, "");
  const joined = totalJoined ?? 0;
  const active = activeCount ?? 0;
  const newJoins = joins30 ?? 0;
  const mrrRounded = Math.round(mrr);

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Flo Circle</h1>
      <p className="mt-1 text-sm text-flo-maroon/60">
        Soft retail ops · stack mode{" "}
        <span className="font-semibold text-flo-pink">{stackMode}</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="overflow-hidden rounded-3xl border border-flo-pink/20 bg-gradient-to-br from-flo-maroon to-[#c45c7a] p-6 text-white shadow-md">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/75">
            <Users className="h-4 w-4" /> Active members
          </p>
          <p className="mt-3 font-extrabold leading-none tracking-tight text-5xl sm:text-6xl">
            {active}
          </p>
          <p className="mt-3 text-sm text-white/85">
            Paying / unlocked now · discount on
          </p>
        </div>
        <div className="rounded-3xl border border-flo-maroon/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-flo-maroon/50">
            MRR (est.)
          </p>
          <p className="mt-3 font-extrabold leading-none tracking-tight text-4xl text-flo-maroon sm:text-5xl">
            {formatInr(mrrRounded)}
          </p>
          <p className="mt-3 text-sm text-flo-ink/60">
            Active plan price normalized to 30 days
          </p>
        </div>
        <div className="rounded-3xl border border-flo-maroon/10 bg-white p-6 shadow-sm">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-flo-maroon/50">
            <Heart className="h-3.5 w-3.5 text-flo-pink" /> Joins
          </p>
          <p className="mt-3 font-extrabold leading-none tracking-tight text-4xl text-flo-maroon sm:text-5xl">
            {newJoins}
          </p>
          <p className="mt-3 text-sm text-flo-ink/60">
            Last 30 days · {joined} all-time records
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: "Churn 30d",
            value: `${churn}%`,
            hint: `${cancelled30 ?? 0} cancelled`,
          },
          {
            label: "Shipments due 7d",
            value: String(shipmentsDue ?? 0),
            hint: "Active auto-delivery",
          },
          {
            label: "Lifetime joins",
            value: String(joined),
            hint: "All statuses incl. cancelled",
          },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl bg-white/80 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-flo-maroon/50">
              {c.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-flo-maroon">{c.value}</p>
            <p className="mt-1 text-xs text-flo-ink/50">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/admin/flo-circle/members"
          className="inline-flex items-center gap-2 rounded-full bg-flo-pink px-5 py-2.5 text-sm font-bold text-white"
        >
          <Heart className="h-4 w-4" /> View members
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full bg-flo-maroon px-5 py-2.5 text-sm font-bold text-white"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
