import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Clock,
  FileText,
  IndianRupee,
  Heart,
  Undo2,
  LifeBuoy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  formatInr,
  ORDER_NEEDS_ATTENTION,
  ORDER_REVENUE_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  statusTone,
  type OrderStatus,
} from "@/lib/admin-utils";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    { count: ordersToday },
    { count: pendingCount },
    { count: paidAwaiting },
    { count: productCount },
    { count: pageCount },
    { count: floActive },
    { count: openReturns },
    { count: openTickets },
    { data: revenueRows },
    { data: statusRows },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ORDER_NEEDS_ATTENTION),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("pages").select("*", { count: "exact", head: true }),
    supabase
      .from("flo_circle_memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("return_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("flo_support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("orders")
      .select("total_inr")
      .in("status", ORDER_REVENUE_STATUSES),
    supabase.from("orders").select("status"),
    supabase
      .from("orders")
      .select("id, order_number, status, total_inr, customer_email, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const revenueSum = (revenueRows ?? []).reduce(
    (sum, row) => sum + (Number(row.total_inr) || 0),
    0,
  );

  const statusCounts: Record<string, number> = {};
  for (const s of ORDER_STATUSES) statusCounts[s] = 0;
  for (const row of statusRows ?? []) {
    const st = String(row.status || "");
    if (st) statusCounts[st] = (statusCounts[st] ?? 0) + 1;
  }
  const statusEntries = ORDER_STATUSES.map((s) => ({
    status: s,
    count: statusCounts[s] ?? 0,
  })).filter((e) => e.count > 0);

  const cards = [
    {
      label: "Revenue (paid+)",
      value: formatInr(revenueSum),
      icon: IndianRupee,
      href: "/admin/orders",
      numeric: false,
    },
    {
      label: "Orders today",
      value: ordersToday ?? 0,
      icon: ShoppingBag,
      href: "/admin/orders",
      numeric: true,
    },
    {
      label: "Paid — await verify",
      value: paidAwaiting ?? 0,
      icon: Clock,
      href: "/admin/orders?status=paid",
      numeric: true,
    },
    {
      label: "In fulfillment queue",
      value: pendingCount ?? 0,
      icon: Package,
      href: "/admin/orders",
      numeric: true,
    },
    {
      label: "Flo Circle active",
      value: floActive ?? 0,
      icon: Heart,
      href: "/admin/flo-circle",
      numeric: true,
    },
    {
      label: "Open returns",
      value: openReturns ?? 0,
      icon: Undo2,
      href: "/admin/returns?status=open",
      numeric: true,
    },
    {
      label: "Open tickets",
      value: openTickets ?? 0,
      icon: LifeBuoy,
      href: "/admin/support?status=open",
      numeric: true,
    },
    {
      label: "Products",
      value: productCount ?? 0,
      icon: Package,
      href: "/admin/products",
      numeric: true,
    },
    {
      label: "CMS pages",
      value: pageCount ?? 0,
      icon: FileText,
      href: "/admin/pages",
      numeric: true,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-flo-maroon md:text-3xl">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Live ops snapshot for FloBites
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href, numeric }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-flo-maroon/10 bg-white/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-flo-maroon/60">
                {label}
              </p>
              <Icon className="h-4 w-4 text-flo-pink" />
            </div>
            <p
              className={`mt-3 font-extrabold text-flo-maroon ${
                numeric ? "text-3xl" : "text-2xl"
              }`}
            >
              {value}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-flo-maroon/10 bg-white/70 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-flo-maroon">Orders by status</h2>
        {statusEntries.length === 0 ? (
          <p className="mt-4 text-sm text-flo-ink/50">No orders yet.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {statusEntries.map(({ status, count }) => (
              <Link
                key={status}
                href={`/admin/orders?status=${status}`}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${statusTone(status)}`}
              >
                {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
                <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px]">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-flo-maroon/10 bg-white/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-flo-maroon">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-flo-pink hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-flo-maroon/50">
              <tr>
                <th className="pb-2 font-semibold">Order</th>
                <th className="pb-2 font-semibold">Customer</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Total</th>
                <th className="pb-2 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-flo-maroon/5">
              {(recentOrders ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-flo-ink/50">
                    No orders yet — checkout will show up here.
                  </td>
                </tr>
              ) : (
                (recentOrders ?? []).map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 font-semibold text-flo-maroon">
                      {o.order_number}
                    </td>
                    <td className="py-3">{o.customer_email}</td>
                    <td className="py-3 capitalize">{o.status}</td>
                    <td className="py-3">{formatInr(o.total_inr)}</td>
                    <td className="py-3 text-flo-ink/60">
                      {new Date(o.created_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
