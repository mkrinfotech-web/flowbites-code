import Link from "next/link";
import {
  Crown,
  Heart,
  LifeBuoy,
  Package,
  Truck,
  User,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  ensureMemberProfile,
  linkGuestOrdersForUser,
} from "@/lib/flo-circle-server";
import { daysRemaining } from "@/lib/flo-circle";
import { customerOrdersOrFilter } from "@/lib/customer-orders";
import { formatInr } from "@/lib/utils";

export default async function AccountHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();
  if (!user || !admin) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-flo-maroon/70">Couldn’t load your account.</p>
        <Link href="/account/login" className="mt-3 inline-block font-bold text-flo-pink">
          Sign in again
        </Link>
      </div>
    );
  }

  await ensureMemberProfile(user);
  await linkGuestOrdersForUser(user.id, user.email);

  const [
    { data: profile },
    { data: membership },
    { data: savings },
    { data: gifts },
    { data: recentOrders },
  ] = await Promise.all([
    admin.from("member_profiles").select("*").eq("id", user.id).maybeSingle(),
    admin
      .from("flo_circle_memberships")
      .select("*, flo_circle_plans(name, price_inr)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("flo_savings_ledger").select("amount_inr").eq("user_id", user.id),
    admin
      .from("flo_gifts")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["queued", "assigned", "shipped"]),
    admin
      .from("orders")
      .select(
        "id, order_number, status, total_inr, created_at, is_priority, discount_percent",
      )
      .or(customerOrdersOrFilter(user.id, user.email))
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const saved = (savings ?? []).reduce((s, r) => s + r.amount_inr, 0);
  const days = daysRemaining(membership?.ends_at);
  const status = membership?.status ?? "none";
  const firstName =
    profile?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  const quickLinks = [
    { href: "/account/orders", label: "Orders", icon: Package, hint: "Track packs" },
    {
      href: "/account/wishlist",
      label: "Wishlist",
      icon: Heart,
      hint: "Saved packs",
    },
    {
      href: "/account/membership",
      label: "Membership",
      icon: Crown,
      hint: "Flo Circle",
    },
    {
      href: "/account/subscriptions",
      label: "Auto-delivery",
      icon: Truck,
      hint: "Subscriptions",
    },
    {
      href: "/account/profile",
      label: "Profile",
      icon: User,
      hint: "Name & address",
    },
    {
      href: "/account/support",
      label: "Support",
      icon: LifeBuoy,
      hint: "We’re here",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="font-script text-2xl text-flo-pink">Hi {firstName}</p>
        <h1 className="text-2xl font-bold text-flo-maroon md:text-3xl">
          Your FloBites account
        </h1>
        <p className="mt-1 text-sm text-flo-maroon/60">
          Member ID ·{" "}
          <span className="font-mono font-semibold text-flo-pink">
            {profile?.member_id ?? "—"}
          </span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Status",
            value: status,
            href: "/account/membership",
          },
          {
            label: "Days left",
            value: days == null ? "—" : String(days),
            href: "/account/membership",
          },
          {
            label: "Saved",
            value: formatInr(saved),
            href: "/account/savings",
          },
          {
            label: "Gifts open",
            value: String(gifts?.length ?? 0),
            href: "/account/gifts",
          },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-3xl bg-white/90 p-5 shadow-sm transition hover:shadow-md active:scale-[0.99]"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-flo-maroon/50">
              {c.label}
            </p>
            <p className="mt-2 text-xl font-bold capitalize text-flo-maroon">
              {c.value}
            </p>
          </Link>
        ))}
      </div>

      {!membership || membership.status !== "active" ? (
        <div className="rounded-3xl bg-flo-blush p-6">
          <h2 className="font-bold text-flo-maroon">Join Flo Circle</h2>
          <p className="mt-1 text-sm text-flo-maroon/70">
            Unlock 20% off, gifts, events, and early access.
          </p>
          <Link
            href="/account/membership"
            className="mt-4 inline-flex h-11 items-center rounded-full bg-flo-brown px-6 text-sm font-bold text-white"
          >
            Join
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-flo-maroon">
            {(membership.flo_circle_plans as { name?: string } | null)?.name ??
              "Membership"}{" "}
            · Active
          </h2>
          <p className="mt-1 text-sm text-flo-maroon/65">
            {days != null ? `${days} days left · ` : ""}
            Renews / ends{" "}
            {membership.ends_at
              ? new Date(membership.ends_at).toLocaleDateString("en-IN")
              : "—"}
          </p>
          <Link
            href="/account/membership"
            className="mt-3 inline-flex text-sm font-bold text-flo-pink"
          >
            Manage membership →
          </Link>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-flo-maroon">Recent orders</h2>
          <Link
            href="/account/orders"
            className="text-sm font-bold text-flo-pink"
          >
            See all
          </Link>
        </div>
        {(recentOrders ?? []).length ? (
          <ul className="space-y-2">
            {recentOrders!.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm transition hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-flo-maroon">{o.order_number}</p>
                    <p className="text-xs text-flo-maroon/50">
                      {new Date(o.created_at).toLocaleDateString("en-IN")} ·{" "}
                      {o.status}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {o.is_priority && (
                      <span className="rounded-full bg-flo-pink/15 px-2 py-0.5 text-[10px] font-bold uppercase text-flo-pink">
                        Priority
                      </span>
                    )}
                    <span className="font-bold text-flo-maroon">
                      {formatInr(o.total_inr)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-flo-maroon/40" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-flo-maroon/60">No orders yet.</p>
            <Link
              href="/#bestsellers"
              className="mt-3 inline-flex h-11 items-center rounded-full bg-flo-brown px-5 text-sm font-bold text-white"
            >
              Shop FloBites
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-flo-maroon">Quick links</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {quickLinks.map(({ href, label, icon: Icon, hint }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm transition hover:shadow-md active:scale-[0.99]"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-flo-blush">
                <Icon className="h-4 w-4 text-flo-pink" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-flo-maroon">{label}</span>
                <span className="block text-xs text-flo-maroon/50">{hint}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-flo-maroon/30" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
