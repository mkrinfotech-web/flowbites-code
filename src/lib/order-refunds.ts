import { getSupabaseAdmin } from "@/lib/supabase";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";

/** Order statuses in which money has been captured and a refund is meaningful. */
export const REFUNDABLE_STATUSES = [
  "paid",
  "verified",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type RefundResult = {
  ok: boolean;
  refundId?: string;
  /** Amount refunded in this call or already refunded earlier (INR). */
  amountInr?: number;
  /** True when Razorpay already held a full refund for this payment (nothing new sent). */
  alreadyRefunded?: boolean;
  /** True when the order has no Razorpay payment (e.g. demo order): nothing to refund. */
  noPayment?: boolean;
  error?: string;
};

function describeRazorpayError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as {
      error?: { description?: string };
      message?: string;
    };
    if (e.error?.description) return e.error.description;
    if (e.message) return e.message;
  }
  return "Razorpay refund failed";
}

/**
 * Refund the captured Razorpay payment of an order (remaining balance if
 * partially refunded already). Never fakes success: when the order has a payment
 * but Razorpay is not configured / errors, `ok` is false.
 */
export async function refundOrderPayment(orderId: string): Promise<RefundResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "Admin client unavailable" };

  const { data: order, error: loadErr } = await admin
    .from("orders")
    .select(
      "id, order_number, status, total_inr, razorpay_payment_id, customer_email",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (loadErr || !order) {
    return { ok: false, error: loadErr?.message || "Order not found" };
  }

  const paymentId = (order.razorpay_payment_id as string | null)?.trim();
  if (!paymentId) {
    return { ok: true, noPayment: true };
  }

  const status = order.status as string;
  if (
    status !== "refunded" &&
    !(REFUNDABLE_STATUSES as readonly string[]).includes(status)
  ) {
    return {
      ok: false,
      error: `Order is "${status}" — only paid orders can be refunded.`,
    };
  }

  if (!isRazorpayConfigured()) {
    return {
      ok: false,
      error:
        "Razorpay is not configured on this server — refund the payment from the Razorpay dashboard.",
    };
  }
  const razorpay = getRazorpay();
  if (!razorpay) {
    return { ok: false, error: "Razorpay client unavailable" };
  }

  const totalPaise = Math.round(Number(order.total_inr) * 100);
  if (!Number.isFinite(totalPaise) || totalPaise <= 0) {
    return { ok: false, error: "Order total is invalid — cannot refund." };
  }

  try {
    const existing = await razorpay.payments.fetchMultipleRefund(paymentId, {
      count: 100,
    });
    const live = (existing.items ?? []).filter((r) => r.status !== "failed");
    const refundedPaise = live.reduce((sum, r) => sum + (r.amount ?? 0), 0);

    if (refundedPaise >= totalPaise) {
      return {
        ok: true,
        alreadyRefunded: true,
        refundId: live[0]?.id,
        amountInr: refundedPaise / 100,
      };
    }

    const remaining = totalPaise - refundedPaise;
    const refund = await razorpay.payments.refund(paymentId, {
      amount: remaining,
      speed: "normal",
      notes: {
        order_id: order.id as string,
        order_number: order.order_number as string,
        reason: "Order refunded from admin",
      },
    });
    return { ok: true, refundId: refund.id, amountInr: remaining / 100 };
  } catch (err) {
    console.error("[refund] Razorpay refund failed", orderId, err);
    return { ok: false, error: describeRazorpayError(err) };
  }
}

export type RefundSummary = {
  configured: boolean;
  refunds: {
    id: string;
    amountInr: number;
    status: string;
    createdAt: string;
  }[];
  error?: string;
};

/** Read-only view of Razorpay refunds for a payment (for the admin order page). */
export async function getPaymentRefundSummary(
  paymentId: string,
): Promise<RefundSummary> {
  const razorpay = getRazorpay();
  if (!razorpay) return { configured: false, refunds: [] };
  try {
    const res = await razorpay.payments.fetchMultipleRefund(paymentId, {
      count: 100,
    });
    return {
      configured: true,
      refunds: (res.items ?? []).map((r) => ({
        id: r.id,
        amountInr: (r.amount ?? 0) / 100,
        status: r.status,
        createdAt: new Date(r.created_at * 1000).toISOString(),
      })),
    };
  } catch (err) {
    return {
      configured: true,
      refunds: [],
      error: describeRazorpayError(err),
    };
  }
}

/** Append a timestamped line to orders.admin_notes (admin client; best effort). */
export async function appendOrderAdminNote(
  orderId: string,
  line: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "Admin client unavailable" };
  const { data, error } = await admin
    .from("orders")
    .select("admin_notes")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message || "Order not found" };
  const next = formatAdminNote(data.admin_notes as string | null, line);
  const { error: upErr } = await admin
    .from("orders")
    .update({ admin_notes: next })
    .eq("id", orderId);
  return upErr ? { ok: false, error: upErr.message } : { ok: true };
}

/** Pure helper: existing notes + "[date] line". */
export function formatAdminNote(existing: string | null | undefined, line: string) {
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const entry = `[${stamp} UTC] ${line}`;
  const base = (existing ?? "").trim();
  return base ? `${base}\n${entry}` : entry;
}

/**
 * Put order_items quantities back into products.stock_qty, once.
 * Guard: only the caller that flips stock_decremented_at from non-null to null
 * restores stock, so concurrent / repeated calls cannot double-restore.
 * Per-product update uses optimistic concurrency on stock_qty to avoid racing
 * with checkout decrements (no RPC available without a migration).
 */
export async function restoreStockForOrder(
  orderId: string,
): Promise<{ ok: boolean; restored: boolean; error?: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, restored: false, error: "Admin client unavailable" };

  const { data: claimed, error: claimErr } = await admin
    .from("orders")
    .update({ stock_decremented_at: null })
    .eq("id", orderId)
    .not("stock_decremented_at", "is", null)
    .select("id");

  if (claimErr) return { ok: false, restored: false, error: claimErr.message };
  if (!claimed || claimed.length === 0) return { ok: true, restored: false };

  const { data: items, error: itemsErr } = await admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);
  if (itemsErr) {
    console.error("[stock] restore: could not load items", orderId, itemsErr);
    return { ok: false, restored: false, error: itemsErr.message };
  }

  const totals = new Map<string, number>();
  for (const it of items ?? []) {
    if (!it.product_id) continue;
    totals.set(it.product_id, (totals.get(it.product_id) ?? 0) + Number(it.quantity));
  }

  const failures: string[] = [];
  for (const [productId, qty] of totals) {
    let done = false;
    for (let attempt = 0; attempt < 5 && !done; attempt++) {
      const { data: product, error: readErr } = await admin
        .from("products")
        .select("stock_qty")
        .eq("id", productId)
        .maybeSingle();
      if (readErr || !product || typeof product.stock_qty !== "number") {
        // Product gone or stock not tracked — nothing to restore.
        done = !readErr;
        if (readErr) failures.push(`${productId}: ${readErr.message}`);
        break;
      }
      const { data: updated, error: upErr } = await admin
        .from("products")
        .update({ stock_qty: product.stock_qty + qty })
        .eq("id", productId)
        .eq("stock_qty", product.stock_qty)
        .select("id");
      if (upErr) {
        failures.push(`${productId}: ${upErr.message}`);
        break;
      }
      done = Boolean(updated && updated.length > 0);
    }
    if (!done && !failures.some((f) => f.startsWith(productId))) {
      failures.push(`${productId}: stock changed concurrently`);
    }
  }

  if (failures.length) {
    console.error("[stock] restore incomplete", orderId, failures);
    return {
      ok: false,
      restored: true,
      error: `Stock restore incomplete (${failures.length} product(s)) — check inventory.`,
    };
  }
  return { ok: true, restored: true };
}
