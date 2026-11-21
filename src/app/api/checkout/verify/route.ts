import { NextResponse } from "next/server";
import { verifyPaymentSchema } from "@/lib/validations";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { getSupabaseAdmin } from "@/lib/supabase";
import { applyPaidOrderSideEffects } from "@/lib/flo-circle-server";

const ALREADY_PAID_STATUSES = new Set([
  "paid",
  "verified",
  "processing",
  "shipped",
  "delivered",
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = parsed.data;

    const ok = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!ok) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: order } = await admin
      .from("orders")
      .select(
        "id, status, razorpay_order_id, discount_code_id, user_id, discount_inr, discount_source, membership_id",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      !order.razorpay_order_id ||
      order.razorpay_order_id !== razorpayOrderId
    ) {
      return NextResponse.json(
        { error: "Payment does not match this order" },
        { status: 400 },
      );
    }

    if (ALREADY_PAID_STATUSES.has(order.status)) {
      // Idempotent success — side effects may already have run via webhook
      await applyPaidOrderSideEffects(order);
      return NextResponse.json({ success: true, orderId });
    }

    // "failed" is allowed: a customer can retry and succeed on the same Razorpay order
    if (order.status !== "pending" && order.status !== "failed") {
      return NextResponse.json(
        { error: "Order is not awaiting payment" },
        { status: 400 },
      );
    }

    const { data: updated, error: updateErr } = await admin
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .in("status", ["pending", "failed"])
      .eq("razorpay_order_id", razorpayOrderId)
      .select(
        "id, discount_code_id, user_id, discount_inr, discount_source, membership_id",
      )
      .maybeSingle();

    if (updateErr) {
      console.error(updateErr);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // Race: webhook may have marked paid between our read and update
    if (!updated) {
      const { data: again } = await admin
        .from("orders")
        .select(
          "id, status, discount_code_id, user_id, discount_inr, discount_source, membership_id",
        )
        .eq("id", orderId)
        .maybeSingle();
      if (again && ALREADY_PAID_STATUSES.has(again.status)) {
        await applyPaidOrderSideEffects(again);
        return NextResponse.json({ success: true, orderId });
      }
      return NextResponse.json(
        { error: "Could not confirm payment" },
        { status: 409 },
      );
    }

    await applyPaidOrderSideEffects(updated);

    return NextResponse.json({ success: true, orderId });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
