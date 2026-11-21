import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateReturnStatusAction } from "@/app/admin/support-actions";

// Values from supabase/migrations/015_customer_account_ops.sql CHECK constraints.
const STATUSES = [
  "open",
  "in_progress",
  "approved",
  "rejected",
  "refunded",
  "closed",
] as const;

const REASON_LABELS: Record<string, string> = {
  damaged: "Damaged",
  wrong_item: "Wrong item",
  quality: "Quality",
  changed_mind: "Changed mind",
  other: "Other",
};

type OrderRef = {
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
};

function label(s: string) {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function tone(status: string) {
  switch (status) {
    case "approved":
    case "refunded":
      return "bg-emerald-100 text-emerald-800";
    case "open":
      return "bg-amber-100 text-amber-900";
    case "in_progress":
      return "bg-sky-100 text-sky-800";
    case "rejected":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-flo-blush text-flo-maroon";
  }
}

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("return_requests")
    .select(
      "id, order_id, user_id, reason, message, status, created_at, updated_at, orders(order_number, customer_name, customer_email)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.status && (STATUSES as readonly string[]).includes(params.status)) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    order_id: string;
    reason: string;
    message: string;
    status: string;
    created_at: string;
    orders: OrderRef | OrderRef[] | null;
  }>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-flo-maroon">Returns</h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Customer return requests, newest first.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip href="/admin/returns" active={!params.status} label="All" />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={`/admin/returns?status=${s}`}
            active={params.status === s}
            label={label(s)}
          />
        ))}
      </div>

      {params.error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          Could not update return:{" "}
          {params.error === "invalid" ? "invalid request." : params.error}
        </p>
      ) : null}
      {params.saved ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Return updated.
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error.message}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-flo-maroon/20 bg-white/50 p-10 text-center text-flo-ink/50">
            No return requests match this filter.
          </div>
        ) : (
          rows.map((r) => {
            const order = Array.isArray(r.orders) ? r.orders[0] : r.orders;
            return (
              <article
                key={r.id}
                className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/orders/${r.order_id}`}
                      className="text-lg font-extrabold text-flo-maroon hover:text-flo-pink"
                    >
                      {order?.order_number ?? "Order"}
                    </Link>
                    <p className="text-sm text-flo-ink/70">
                      {order?.customer_name || "—"}
                      {order?.customer_email ? ` · ${order.customer_email}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-flo-ink/50">
                      {new Date(r.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${tone(r.status)}`}
                  >
                    {label(r.status)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold text-flo-maroon">
                  {REASON_LABELS[r.reason] ?? r.reason}
                </p>
                {r.message ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-flo-ink/80">
                    {r.message}
                  </p>
                ) : null}

                <form
                  action={updateReturnStatusAction}
                  className="mt-4 flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="rounded-xl border border-flo-maroon/15 bg-white px-3 py-2 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full bg-flo-maroon px-4 py-2 text-xs font-bold text-white"
                  >
                    Update status
                  </button>
                </form>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
        active
          ? "bg-flo-pink text-white"
          : "bg-white/70 text-flo-maroon hover:bg-white"
      }`}
    >
      {label}
    </Link>
  );
}
