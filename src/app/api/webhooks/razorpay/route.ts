import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  activateMembership,
  applyPaidOrderSideEffects,
  updateMembershipByRazorpaySub,
} from "@/lib/flo-circle-server";

type RzPayload = {
  event: string;
  payload: {
    payment?: { entity?: { order_id?: string; id?: string } };
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        notes?: Record<string, string>;
        current_end?: number;
      };
    };
  };
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  // Demo webhook only when explicitly opted in AND no webhook secret is set.
  // Never enabled by default.
  const allowDemo =
    process.env.RAZORPAY_ALLOW_DEMO_WEBHOOK === "1" &&
    !process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!allowDemo) {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  let event: RzPayload;
  try {
    event = JSON.parse(rawBody) as RzPayload;
  } catch {
    return NextResponse.json({ error: "Malformed body" }, { status: 400 });
  }
  if (!event || typeof event !== "object" || !event.event) {
    return NextResponse.json({ error: "Malformed body" }, { status: 400 });
  }
  event.payload = event.payload ?? {};
  const admin = getSupabaseAdmin();

  if (event.event === "payment.failed") {
    const failedRzOrderId = event.payload.payment?.entity?.order_id;
    if (admin && failedRzOrderId) {
      await admin
        .from("orders")
        .update({ status: "failed" })
        .eq("razorpay_order_id", failedRzOrderId)
        .eq("status", "pending");
    }
  }

  if (event.event === "payment.captured") {
    const razorpayOrderId = event.payload.payment?.entity?.order_id;
    const paymentId = event.payload.payment?.entity?.id;
    if (admin && razorpayOrderId) {
      // Mark paid if pending (or failed: Razorpay lets customers retry on the same order)
      await admin
        .from("orders")
        .update({
          status: "paid",
          razorpay_payment_id: paymentId,
          paid_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", razorpayOrderId)
        .in("status", ["pending", "failed"]);

      const { data: order } = await admin
        .from("orders")
        .select(
          "id, status, user_id, discount_inr, discount_source, membership_id, discount_code_id",
        )
        .eq("razorpay_order_id", razorpayOrderId)
        .maybeSingle();

      if (
        order &&
        (order.status === "paid" ||
          order.status === "verified" ||
          order.status === "processing" ||
          order.status === "shipped" ||
          order.status === "delivered")
      ) {
        await applyPaidOrderSideEffects(order);
      }
    }
  }

  const subEntity = event.payload.subscription?.entity;
  const rzSubId = subEntity?.id;
  const notes = subEntity?.notes ?? {};
  const membershipId = notes.flo_membership_id;
  const userId = notes.flo_user_id;
  const kind = notes.flo_kind;

  if (rzSubId && admin) {
    if (
      event.event === "subscription.activated" ||
      event.event === "subscription.authenticated"
    ) {
      if (kind === "membership" && membershipId && userId) {
        const { data: m } = await admin
          .from("flo_circle_memberships")
          .select("*, flo_circle_plans(duration_days)")
          .eq("id", membershipId)
          .maybeSingle();
        const duration =
          (m?.flo_circle_plans as { duration_days?: number } | null)
            ?.duration_days ?? 30;
        await activateMembership({
          membershipId,
          userId,
          durationDays: duration,
          razorpaySubscriptionId: rzSubId,
        });
      } else {
        await updateMembershipByRazorpaySub(rzSubId, {
          status: "active",
          razorpay_subscription_id: rzSubId,
        });
      }
    }

    if (event.event === "subscription.charged") {
      await updateMembershipByRazorpaySub(rzSubId, { status: "active" });
      if (subEntity?.current_end && membershipId) {
        await admin
          .from("flo_circle_memberships")
          .update({
            ends_at: new Date(subEntity.current_end * 1000).toISOString(),
          })
          .eq("id", membershipId);
      }
    }

    if (
      event.event === "subscription.pending" ||
      event.event === "subscription.halted"
    ) {
      await updateMembershipByRazorpaySub(rzSubId, { status: "past_due" });
    }

    if (event.event === "subscription.cancelled") {
      await updateMembershipByRazorpaySub(rzSubId, {
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      });
    }

    if (event.event === "subscription.paused") {
      await updateMembershipByRazorpaySub(rzSubId, {
        status: "paused",
        paused_at: new Date().toISOString(),
      });
    }

    if (event.event === "subscription.resumed") {
      await updateMembershipByRazorpaySub(rzSubId, {
        status: "active",
        paused_at: null,
      });
    }
  }

  return NextResponse.json({ received: true });
}
