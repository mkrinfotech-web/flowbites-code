import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { linkGuestOrdersForUser } from "@/lib/flo-circle-server";
import { customerOrdersOrFilter } from "@/lib/customer-orders";
import { formatInr } from "@/lib/utils";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();
  if (!user || !admin) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-flo-maroon/70">Couldn’t load orders.</p>
      </div>
    );
  }

  await linkGuestOrdersForUser(user.id, user.email);

  const { data: orders, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, total_inr, created_at, is_priority, discount_source, discount_percent, tracking_number",
    )
    .or(customerOrdersOrFilter(user.id, user.email))
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Your orders</h1>
      <p className="mt-1 text-sm text-flo-maroon/60">
        Packs you’ve ordered — including guest checkouts on this email.
      </p>

      {error && (
        <p className="mt-4 rounded-2xl bg-flo-blush px-4 py-3 text-sm text-flo-maroon">
          Something went wrong loading orders. Try again shortly.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {(orders ?? []).map((o) => (
          <li key={o.id}>
            <Link
              href={`/account/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3.5 shadow-sm transition hover:shadow-md active:scale-[0.99]"
            >
              <div className="min-w-0">
                <p className="font-bold text-flo-maroon">{o.order_number}</p>
                <p className="text-xs text-flo-maroon/50">
                  {new Date(o.created_at).toLocaleDateString("en-IN")} ·{" "}
                  <span className="capitalize">{o.status}</span>
                  {o.discount_percent
                    ? ` · ${o.discount_percent}% ${o.discount_source ?? ""}`
                    : ""}
                  {o.tracking_number ? ` · Track ${o.tracking_number}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {o.is_priority && (
                  <span className="rounded-full bg-flo-pink/15 px-2 py-0.5 text-[10px] font-bold uppercase text-flo-pink">
                    Priority
                  </span>
                )}
                <span className="font-bold text-flo-maroon">
                  {formatInr(o.total_inr)}
                </span>
                <ChevronRight className="h-4 w-4 text-flo-maroon/35" />
              </div>
            </Link>
          </li>
        ))}
        {!orders?.length && !error && (
          <li className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-flo-maroon/60">No orders yet.</p>
            <Link
              href="/#bestsellers"
              className="mt-4 inline-flex h-11 items-center rounded-full bg-flo-brown px-5 text-sm font-bold text-white"
            >
              Shop FloBites
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
