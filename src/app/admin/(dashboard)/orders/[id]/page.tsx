import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Heart,
  Mail,
  Package,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  buildOrderTimeline,
  formatInr,
  ORDER_STATUS_LABELS,
  parseShippingAddress,
  statusTone,
  type OrderStatus,
} from "@/lib/admin-utils";
import { allowedNextStatuses } from "@/lib/order-transitions";
import {
  refundOrderAction,
  resendOrderConfirmationAction,
  resendOrderStatusEmailAction,
  updateOrderStatusAction,
  verifyOrderAction,
} from "@/app/admin/actions";
import {
  REFUNDABLE_STATUSES,
  getPaymentRefundSummary,
} from "@/lib/order-refunds";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

function flashMessage(ok?: string) {
  switch (ok) {
    case "verify":
      return "Order verified.";
    case "process":
      return "Order moved to processing.";
    case "ship":
      return "Order marked shipped.";
    case "deliver":
      return "Order marked delivered.";
    case "cancel":
      return "Order cancelled.";
    case "saved":
      return "Order saved.";
    case "refunded":
      return "Refund issued to the customer via Razorpay.";
    case "shipped-email-resent":
      return "Shipped email resent.";
    case "delivered-email-resent":
      return "Delivered email resent.";
    case "email-resent":
      return "Confirmation email resent.";
    case "email-already-sent":
      return "Confirmation already sent (idempotent — use force resend).";
    case "email-skipped":
      return "Email skipped — RESEND_API_KEY not configured.";
    default:
      return ok ? `Done: ${ok}.` : null;
  }
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string; warning?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, customer_phone, total_inr, subtotal_inr, discount_inr, discount_percent, discount_source, membership_fee_inr, shipping_address, admin_notes, tracking_number, created_at, paid_at, verified_at, shipped_at, is_member_order, is_priority, includes_flo_circle_join, membership_id, confirmation_email_sent_at, shipped_email_sent_at, delivered_email_sent_at, razorpay_payment_id, razorpay_order_id, order_items(product_name, quantity, unit_price_inr, line_total_inr)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        {error.message}
      </p>
    );
  }
  if (!order) notFound();

  const status = order.status as OrderStatus;
  const nextStatuses = allowedNextStatuses(status);
  const address = parseShippingAddress(order.shipping_address);
  const timeline = buildOrderTimeline(order);
  const returnTo = `/admin/orders/${order.id}`;
  const items = (order.order_items ?? []) as {
    product_name: string;
    quantity: number;
    unit_price_inr: number;
    line_total_inr: number;
  }[];
  const membershipFee = order.membership_fee_inr ?? 0;
  const okMsg = flashMessage(query.ok);
  const canRefund =
    Boolean(order.razorpay_payment_id) &&
    (REFUNDABLE_STATUSES as readonly string[]).includes(status);
  const refundSummary = order.razorpay_payment_id
    ? await getPaymentRefundSummary(order.razorpay_payment_id)
    : null;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm font-semibold text-flo-pink hover:underline"
      >
        ← All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-flo-maroon">
              {order.order_number}
            </h1>
            {order.includes_flo_circle_join ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-flo-pink/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-flo-pink">
                <Heart className="h-3 w-3" /> Flo Circle join
              </span>
            ) : order.is_member_order || order.membership_id ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-flo-maroon/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-flo-maroon">
                <Heart className="h-3 w-3" /> Member order
              </span>
            ) : null}
            {order.is_priority ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-900">
                Priority
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-flo-ink/60">
            Placed{" "}
            {new Date(order.created_at).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusTone(order.status)}`}
          >
            {ORDER_STATUS_LABELS[status] ?? order.status}
          </span>
          <p className="mt-2 text-2xl font-extrabold text-flo-maroon">
            {formatInr(order.total_inr)}
          </p>
        </div>
      </div>

      {query.error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          {query.error}
        </p>
      ) : null}
      {query.warning ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Warning: {query.warning}
        </p>
      ) : null}
      {okMsg ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {okMsg}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-flo-maroon/60">
              Customer
            </h2>
            <p className="mt-2 text-lg font-bold text-flo-maroon">
              {order.customer_name || "—"}
            </p>
            <p className="text-sm text-flo-ink/70">{order.customer_email}</p>
            {order.customer_phone ? (
              <p className="text-sm text-flo-ink/70">{order.customer_phone}</p>
            ) : null}
            {address ? (
              <p className="mt-3 text-sm leading-relaxed text-flo-ink/80">
                {[address.line1, address.line2].filter(Boolean).join(", ")}
                <br />
                {[address.city, address.state, address.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : (
              <p className="mt-3 text-sm text-flo-ink/40">No shipping address</p>
            )}
          </section>

          <section className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-flo-maroon/60">
              Items
            </h2>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-flo-ink/50">No line items</p>
            ) : (
              <ul className="mt-3 divide-y divide-flo-maroon/10">
                {items.map((item, idx) => (
                  <li
                    key={`${item.product_name}-${idx}`}
                    className="flex justify-between gap-3 py-3 text-sm"
                  >
                    <span className="text-flo-ink">
                      {item.product_name}{" "}
                      <span className="text-flo-ink/50">× {item.quantity}</span>
                      <span className="mt-0.5 block text-xs text-flo-ink/40">
                        {formatInr(item.unit_price_inr)} each
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-flo-maroon">
                      {formatInr(item.line_total_inr)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 space-y-1.5 border-t border-flo-maroon/10 pt-3 text-sm">
              <div className="flex justify-between text-flo-ink/70">
                <span>Subtotal</span>
                <span>{formatInr(order.subtotal_inr)}</span>
              </div>
              {(order.discount_inr ?? 0) > 0 ? (
                <div className="flex justify-between text-flo-pink">
                  <span>
                    Discount
                    {order.discount_percent
                      ? ` (${order.discount_percent}%${order.discount_source ? ` · ${order.discount_source}` : ""})`
                      : ""}
                  </span>
                  <span>−{formatInr(order.discount_inr)}</span>
                </div>
              ) : null}
              {membershipFee > 0 ? (
                <div className="flex justify-between text-flo-maroon/80">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-flo-pink" />
                    Flo Circle membership fee
                  </span>
                  <span>{formatInr(membershipFee)}</span>
                </div>
              ) : null}
              <div className="flex justify-between pt-1 text-base font-bold text-flo-maroon">
                <span>Total</span>
                <span>{formatInr(order.total_inr)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-flo-maroon/60">
              Notes & tracking
            </h2>
            <form
              action={updateOrderStatusAction}
              className="mt-4 grid gap-3 md:grid-cols-2"
            >
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="text-xs font-bold uppercase text-flo-maroon/60 md:col-span-2">
                Status
                <select
                  name="status"
                  defaultValue={order.status}
                  className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2.5 text-sm"
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
                  placeholder="AWB / tracking"
                  className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-bold uppercase text-flo-maroon/60 md:col-span-2">
                Admin notes
                <textarea
                  name="adminNotes"
                  defaultValue={order.admin_notes ?? ""}
                  rows={3}
                  placeholder="Internal note"
                  className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2.5 text-sm"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-flo-pink px-5 py-2.5 text-sm font-bold text-white md:col-span-2 md:justify-self-start"
              >
                <Package className="h-4 w-4" /> Save changes
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-flo-maroon/60">
              Status timeline
            </h2>
            <ol className="mt-4 space-y-3">
              {timeline.map((step) => (
                <li key={step.key} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      step.state === "done"
                        ? "bg-emerald-500 text-white"
                        : step.state === "current"
                          ? "bg-flo-pink text-white"
                          : step.state === "skipped"
                            ? "bg-flo-maroon/15 text-flo-maroon/40"
                            : "bg-flo-soft text-flo-maroon/40"
                    }`}
                  >
                    {step.state === "done" ? "✓" : ""}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        step.state === "upcoming" || step.state === "skipped"
                          ? "text-flo-ink/40"
                          : "text-flo-maroon"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.at ? (
                      <p className="text-xs text-flo-ink/50">
                        {new Date(step.at).toLocaleString("en-IN")}
                      </p>
                    ) : step.state === "current" ? (
                      <p className="text-xs text-flo-pink">Current</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-flo-maroon/60">
              Quick actions
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {status === "paid" ? (
                <QuickAction
                  orderId={order.id}
                  returnTo={returnTo}
                  action="verify"
                  label="Verify order"
                  tone="primary"
                />
              ) : null}
              {status === "verified" ? (
                <QuickAction
                  orderId={order.id}
                  returnTo={returnTo}
                  action="process"
                  label="Start processing"
                  tone="secondary"
                />
              ) : null}
              {status === "processing" ? (
                <QuickAction
                  orderId={order.id}
                  returnTo={returnTo}
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
                  returnTo={returnTo}
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
                  returnTo={returnTo}
                  action="cancel"
                  label="Cancel"
                  tone="danger"
                  confirm
                />
              ) : null}
            </div>

            {order.tracking_number ? (
              <div className="mt-4 rounded-xl bg-flo-soft/50 p-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-flo-maroon/50">
                  <Truck className="h-3.5 w-3.5" /> Tracking
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-flo-maroon">
                  {order.tracking_number}
                </p>
              </div>
            ) : null}
          </section>

          {status === "shipped" || status === "delivered" ? (
            <section className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-flo-maroon/60">
                Shipping emails
              </h2>
              <p className="mt-2 text-sm text-flo-ink/60">
                Shipped:{" "}
                {order.shipped_email_sent_at
                  ? new Date(order.shipped_email_sent_at).toLocaleString("en-IN")
                  : "not sent"}
                {status === "delivered" ? (
                  <>
                    <br />
                    Delivered:{" "}
                    {order.delivered_email_sent_at
                      ? new Date(order.delivered_email_sent_at).toLocaleString("en-IN")
                      : "not sent"}
                  </>
                ) : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["shipped", "delivered"] as const)
                  .filter((k) => k === "shipped" || status === "delivered")
                  .map((kind) => (
                    <form key={kind} action={resendOrderStatusEmailAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="kind" value={kind} />
                      <ConfirmSubmitButton
                        confirmMessage={`Resend the ${kind} email to the customer?`}
                        className="inline-flex items-center gap-2 rounded-full bg-flo-maroon px-4 py-2.5 text-sm font-bold text-white"
                      >
                        <Mail className="h-4 w-4" /> Resend {kind} email
                      </ConfirmSubmitButton>
                    </form>
                  ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-flo-maroon/60">
              Confirmation email
            </h2>
            <p className="mt-2 text-sm text-flo-ink/60">
              {order.confirmation_email_sent_at
                ? `Last sent ${new Date(order.confirmation_email_sent_at).toLocaleString("en-IN")}`
                : "Not sent yet"}
            </p>
            <form action={resendOrderConfirmationAction} className="mt-3">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="force" value="true" />
              <ConfirmSubmitButton
                confirmMessage="Resend order confirmation email to the customer?"
                className="inline-flex items-center gap-2 rounded-full bg-flo-maroon px-4 py-2.5 text-sm font-bold text-white"
              >
                <Mail className="h-4 w-4" /> Resend confirmation email
              </ConfirmSubmitButton>
            </form>
          </section>

          {(order.razorpay_payment_id || order.razorpay_order_id) && (
            <section className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-flo-maroon/60">
                Payment
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                {order.razorpay_order_id ? (
                  <div>
                    <dt className="text-xs text-flo-ink/50">Razorpay order</dt>
                    <dd className="font-mono text-flo-maroon">
                      {order.razorpay_order_id}
                    </dd>
                  </div>
                ) : null}
                {order.razorpay_payment_id ? (
                  <div>
                    <dt className="text-xs text-flo-ink/50">Payment</dt>
                    <dd className="inline-flex items-center gap-1.5 font-mono text-flo-maroon">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {order.razorpay_payment_id}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {refundSummary ? (
                <div className="mt-4 border-t border-flo-maroon/10 pt-3">
                  <p className="text-xs font-bold uppercase text-flo-maroon/50">
                    Refunds
                  </p>
                  {!refundSummary.configured ? (
                    <p className="mt-1 text-sm text-amber-800">
                      Razorpay not configured - refund status unavailable.
                    </p>
                  ) : refundSummary.error ? (
                    <p className="mt-1 text-sm text-rose-700">
                      Could not load refunds: {refundSummary.error}
                    </p>
                  ) : refundSummary.refunds.length === 0 ? (
                    <p className="mt-1 text-sm text-flo-ink/60">No refunds yet.</p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-sm">
                      {refundSummary.refunds.map((r) => (
                        <li key={r.id} className="text-flo-maroon">
                          <span className="font-mono">{r.id}</span> -{" "}
                          {formatInr(r.amountInr)} - {r.status} -{" "}
                          {new Date(r.createdAt).toLocaleString("en-IN")}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {canRefund ? (
                <form action={refundOrderAction} className="mt-4">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <ConfirmSubmitButton
                    confirmMessage={`Refund ${formatInr(order.total_inr)} to the customer via Razorpay? This cannot be undone.`}
                    className="rounded-full bg-rose-100 px-4 py-2.5 text-sm font-bold text-rose-800"
                  >
                    Refund to customer
                  </ConfirmSubmitButton>
                  <p className="mt-1 text-xs text-flo-ink/50">
                    Sends a real refund of the order total. Already-refunded
                    payments are not refunded twice.
                  </p>
                </form>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  orderId,
  returnTo,
  action,
  label,
  tone,
  confirm,
  trackingNumber,
  requireTracking,
}: {
  orderId: string;
  returnTo: string;
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
      <input type="hidden" name="returnTo" value={returnTo} />
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
