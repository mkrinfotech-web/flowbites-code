"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { cancelOrderSchema, returnRequestSchema } from "@/lib/validations";
import { canTransitionOrderStatus } from "@/lib/order-transitions";
import type { OrderStatus } from "@/lib/admin-utils";
import { appendOrderAdminNote, restoreStockForOrder } from "@/lib/order-refunds";

const CUSTOMER_CANCELABLE: OrderStatus[] = ["pending", "paid", "verified"];
const RETURNABLE: OrderStatus[] = ["shipped", "delivered"];

type CustomerOrderCtx =
  | { ok: true; user: { id: string; email?: string }; admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>; order: { id: string; status: string; user_id: string | null; customer_email: string; order_number: string } }
  | { ok: false; error: string };

async function requireCustomerOrder(orderId: string): Promise<CustomerOrderCtx> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required" };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "Server error" };

  const email = (user.email ?? "").toLowerCase();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, user_id, customer_email, order_number")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { ok: false, error: "Order not found" };

  const owns =
    order.user_id === user.id ||
    (email &&
      typeof order.customer_email === "string" &&
      order.customer_email.toLowerCase() === email);

  if (!owns) return { ok: false, error: "Order not found" };

  return { ok: true, user, admin, order };
}

export async function cancelOrderAction(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = cancelOrderSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: "Invalid cancel request." };

  const ctx = await requireCustomerOrder(parsed.data.orderId);
  if (!ctx.ok) return { error: ctx.error };

  const { admin, order } = ctx;
  const from = order.status as OrderStatus;
  if (!CUSTOMER_CANCELABLE.includes(from)) {
    return {
      error:
        "This pack is already being prepared or on its way — reach out via Support and we’ll help gently.",
    };
  }

  const transition = canTransitionOrderStatus(from, "cancelled");
  if (!transition.ok) return { error: transition.error };

  const { data: updated, error } = await admin
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: parsed.data.reason?.trim() || "Customer cancelled",
    })
    .eq("id", order.id)
    .in("status", CUSTOMER_CANCELABLE)
    .select("id");

  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "This order changed just now — refresh and try again." };
  }

  // Put reserved stock back (guarded by stock_decremented_at, runs once).
  const stock = await restoreStockForOrder(order.id);
  if (!stock.ok) console.error("[cancel] stock restore failed", order.id, stock.error);

  // Paid orders: flag staff that money still has to go back (no auto-refund).
  if (from === "paid" || from === "verified") {
    const note = await appendOrderAdminNote(
      order.id,
      "Customer cancelled after payment — refund needed",
    );
    if (!note.ok) console.error("[cancel] admin note failed", order.id, note.error);
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${order.id}`);
  return { ok: true };
}

export async function requestReturnAction(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = returnRequestSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: "Check your return details and try again." };

  const ctx = await requireCustomerOrder(parsed.data.orderId);
  if (!ctx.ok) return { error: ctx.error };

  const { user, admin, order } = ctx;

  if (!RETURNABLE.includes(order.status as OrderStatus)) {
    return {
      error:
        "Returns open once your pack is shipped or delivered. Need help sooner? Message Support.",
    };
  }

  const { data: existing } = await admin
    .from("return_requests")
    .select("id, status")
    .eq("order_id", order.id)
    .maybeSingle();

  if (existing) {
    return {
      error: `A return request is already ${existing.status}. Our team will follow up softly.`,
    };
  }

  const { error } = await admin.from("return_requests").insert({
    order_id: order.id,
    user_id: user.id,
    reason: parsed.data.reason,
    message: parsed.data.message,
  });

  if (error) return { error: error.message };

  await admin.from("flo_support_tickets").insert({
    user_id: user.id,
    category: "return",
    reason_code: parsed.data.reason,
    message: `Return for ${order.order_number}: ${parsed.data.message}`,
  });

  revalidatePath(`/account/orders/${order.id}`);
  revalidatePath("/account/support");
  return { ok: true };
}
