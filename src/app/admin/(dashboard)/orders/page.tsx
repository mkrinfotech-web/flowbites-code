import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatInr,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  parseShippingAddress,
  statusTone,
  type OrderStatus,
} from "@/lib/admin-utils";
import { allowedNextStatuses } from "@/lib/order-transitions";
import {
  updateOrderStatusAction,
  verifyOrderAction,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Heart,
  Package,
} from "lucide-react";

const PAGE_SIZE = 50;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Escape LIKE wildcards and strip chars that break PostgREST or() syntax. */
function likeTerm(value: string): string {
  return value
    .replace(/[\\%_]/g, (c) => `\\${c}`)
    .replace(/[,()"]/g, " ")
    .trim();
}

type OrdersSearchParams = {
  status?: string;
  error?: string;
  warning?: string;
  ok?: string;
  q?: string;
  email?: string;
  userId?: string;
  page?: string;
};

function buildHref(
  base: string,
  values: Record<string, string | number | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const q = (params.q ?? "").trim().slice(0, 100);
  const email = (params.email ?? "").trim().slice(0, 200);
  const userId = UUID_RE.test(params.userId ?? "") ? params.userId : undefined;
  const status =
    params.status && ORDER_STATUSES.includes(params.status as OrderStatus)
      ? params.status
      : undefined;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, customer_phone, total_inr, discount_inr, shipping_address, admin_notes, tracking_number, created_at, paid_at, verified_at, is_member_order, includes_flo_circle_join, membership_id, order_items(product_name, quantity, unit_price_inr, line_total_inr)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (userId) query = query.eq("user_id", userId);
  if (email) query = query.ilike("customer_email", likeTerm(email));
  if (q) {
    const term = likeTerm(q);
    if (term) {
      query = query.or(
        `order_number.ilike.%${term}%,customer_email.ilike.%${term}%,customer_name.ilike.%${term}%`,
      );
    }
  }

  const [{ data: orders, error, count }, { count: needsVerify }] = await Promise.all([
    query,
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid"),
  ]);

  const filterValues = {
    status,
    q: q || undefined,
    email: email || undefined,
    userId,
  };
  const exportHref = buildHref("/api/admin/orders/export", filterValues);
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-flo-maroon">Orders</h1>
          <p className="mt-1 text-sm text-flo-ink/60">
            Happy path: paid → verified → processing → shipped → delivered
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(needsVerify ?? 0) > 0 ? (
            <Link
              href="/admin/orders?status=paid"
              className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-900"
            >
              <CheckCircle2 className="h-4 w-4" />
              {needsVerify} awaiting verify
            </Link>
          ) : null}
          <a
            href={exportHref}
            className="inline-flex items-center gap-2 rounded-full bg-flo-maroon px-4 py-2.5 text-sm font-bold text-white"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>
      </div>

      <form
        method="get"
        action="/admin/orders"
        className="mt-4 flex flex-wrap items-center gap-2"
      >
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {email ? <input type="hidden" name="email" value={email} /> : null}
        {userId ? <input type="hidden" name="userId" value={userId} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search order #, email or name"
          className="h-10 w-72 max-w-full rounded-full border border-flo-maroon/15 bg-white px-4 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-full bg-flo-maroon px-4 text-sm font-bold text-white"
        >
          Search
        </button>
        {q || email || userId ? (
          <Link
            href={buildHref("/admin/orders", { status })}
            className="text-xs font-bold text-flo-pink hover:underline"
          >
            Clear filters
          </Link>
        ) : null}
      </form>
      {email || userId ? (
        <p className="mt-2 text-xs text-flo-ink/60">
          Showing orders for {email ? `email ${email}` : `user ${userId}`}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip
          href={buildHref("/admin/orders", { ...filterValues, status: undefined })}
          active={!status}
          label="All"
        />
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={buildHref("/admin/orders", { ...filterValues, status: s })}
            active={status === s}
            label={ORDER_STATUS_LABELS[s]}
          />
        ))}
      </div>

      {params.error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          Could not update order: {params.error}
        </p>
      ) : null}

      {params.warning ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {params.warning}
        </p>
      ) : null}
      {params.ok ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Order marked {params.ok}.
        </p>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error.message}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {(orders ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-flo-maroon/20 bg-white/50 p-10 text-center text-flo-ink/50">
            No orders match this filter.
          </div>
        ) : (
          (orders ?? []).map((order) => {
            const status = order.status as OrderStatus;
            const nextStatuses = allowedNextStatuses(status);
            const showJoin =
              order.includes_flo_circle_join || Boolean(order.membership_id);
            const address = parseShippingAddress(order.shipping_address);

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="group inline-flex items-center gap-1 text-lg font-extrabold text-flo-maroon hover:text-flo-pink"
                      >
                        {order.order_number}
                        <ChevronRight className="h-4 w-4 opacity-40 transition group-hover:opacity-100" />
                      </Link>
                      {order.includes_flo_circle_join ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-flo-pink/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-flo-pink">
                          <Heart className="h-3 w-3" /> Flo Circle join
                        </span>
                      ) : order.is_member_order || showJoin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-flo-maroon/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-flo-maroon">
                          <Heart className="h-3 w-3" /> Member order
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-flo-ink/70">
                      {order.customer_name || "—"} · {order.customer_email}
                      {order.customer_phone ? ` · ${order.customer_phone}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-flo-ink/50">
                      {new Date(order.created_at).toLocaleString("en-IN")}
                      {order.paid_at
                        ? ` · paid ${new Date(order.paid_at).toLocaleString("en-IN")}`
                        : ""}
                      {order.verified_at
                        ? ` · verified ${new Date(order.verified_at).toLocaleString("en-IN")}`
                        : ""}
                    </p>
                    {address ? (
                      <p className="mt-2 text-xs text-flo-ink/60">
                        {[
                          address.line1,
                          address.line2,
                          address.city,
                          address.state,
                          address.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${statusTone(order.status)}`}
                    >
                      {ORDER_STATUS_LABELS[status] ?? order.status}
                    </span>
                    <p className="mt-2 text-lg font-bold text-flo-maroon">
                      {formatInr(order.total_inr)}
                    </p>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="mt-2 inline-block text-xs font-bold text-flo-pink hover:underline"
                    >
                      Open detail →
                    </Link>
                  </div>
                </div>

                {Array.isArray(order.order_items) &&
                order.order_items.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-flo-ink/80">
                    {order.order_items.map(
                      (
                        item: {
                          product_name: string;
                          quantity: number;
                          line_total_inr: number;
                        },
                        idx: number,
                      ) => (
                        <li key={idx}>
                          {item.quantity}× {item.product_name} —{" "}
                          {formatInr(item.line_total_inr)}
                        </li>
                      ),
                    )}
                  </ul>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-flo-maroon/10 pt-4">
                  {status === "paid" ? (
                    <QuickAction
                      orderId={order.id}
                      action="verify"
                      label="Verify order"
                      tone="primary"
                    />
                  ) : null}
                  {status === "verified" ? (
                    <QuickAction
                      orderId={order.id}
                      action="process"
                      label="Start processing"
                      tone="secondary"
                    />
                  ) : null}
                  {status === "processing" ? (
                    <QuickAction
                      orderId={order.id}
                      action="ship"
                      label="Mark shipped"
                      tone="secondary"
                      trackingNumber={order.tracking_number}
                      requireTracking
                    />
                  ) : null}
                  {status === "shipped" ? (
                    <QuickAction
                      orderId={order.id}
                      action="deliver"
                      label="Mark delivered"
                      tone="secondary"
                    />
                  ) : null}
                  {![
                    "delivered",
                    "cancelled",
                    "failed",
                    "refunded",
                    "shipped",
                  ].includes(status) ? (
                    <QuickAction
                      orderId={order.id}
                      action="cancel"
                      label="Cancel"
                      tone="danger"
                      confirm
                    />
                  ) : null}
                </div>

                <form
                  action={updateOrderStatusAction}
                  className="mt-4 grid gap-3 border-t border-flo-maroon/10 pt-4 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  <label className="text-xs font-bold uppercase text-flo-maroon/60">
                    Status
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
                    >
                      {nextStatuses.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold uppercase text-flo-maroon/60">
                    Tracking
                    <input
                      name="trackingNumber"
                      defaultValue={order.tracking_number ?? ""}
                      placeholder="Required to ship"
                      className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-bold uppercase text-flo-maroon/60">
                    Notes
                    <input
                      name="adminNotes"
                      defaultValue={order.admin_notes ?? ""}
                      placeholder="Internal note"
                      className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 self-end rounded-full bg-flo-pink px-5 py-2.5 text-sm font-bold text-white"
                  >
                    <Package className="h-4 w-4" /> Save
                  </button>
                </form>
              </article>
            );
          })
        )}
      </div>

      {totalCount > PAGE_SIZE ? (
        <nav className="mt-6 flex items-center justify-between text-sm">
          <span className="text-flo-ink/60">
            Page {page} of {totalPages} · {totalCount} orders
          </span>
          <span className="flex gap-2">
            {page > 1 ? (
              <Link
                href={buildHref("/admin/orders", { ...filterValues, page: page - 1 })}
                className="rounded-full bg-white/70 px-4 py-2 font-bold text-flo-maroon hover:bg-white"
              >
                ← Prev
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={buildHref("/admin/orders", { ...filterValues, page: page + 1 })}
                className="rounded-full bg-white/70 px-4 py-2 font-bold text-flo-maroon hover:bg-white"
              >
                Next →
              </Link>
            ) : null}
          </span>
        </nav>
      ) : null}
    </div>
  );
}

function QuickAction({
  orderId,
  action,
  label,
  tone,
  confirm,
  trackingNumber,
  requireTracking,
}: {
  orderId: string;
  action: "verify" | "process" | "ship" | "deliver" | "cancel";
  label: string;
  tone: "primary" | "secondary" | "danger";
  confirm?: boolean;
  trackingNumber?: string | null;
  requireTracking?: boolean;
}) {
  const className =
    tone === "primary"
      ? "bg-flo-maroon text-white"
      : tone === "danger"
        ? "bg-rose-100 text-rose-800"
        : "bg-flo-soft text-flo-maroon";

  const button = confirm ? (
    <ConfirmSubmitButton
      confirmMessage="Cancel this order? This cannot be undone from the happy path."
      className={`rounded-full px-4 py-2 text-xs font-bold ${className}`}
    >
      {label}
    </ConfirmSubmitButton>
  ) : (
    <button
      type="submit"
      className={`rounded-full px-4 py-2 text-xs font-bold ${className}`}
    >
      {label}
    </button>
  );

  return (
    <form
      action={verifyOrderAction}
      className="inline-flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="action" value={action} />
      {requireTracking ? (
        <input
          name="trackingNumber"
          defaultValue={trackingNumber ?? ""}
          placeholder="AWB / tracking"
          required
          className="h-8 rounded-full border border-flo-maroon/15 bg-white px-3 text-xs"
        />
      ) : null}
      {button}
    </form>
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
