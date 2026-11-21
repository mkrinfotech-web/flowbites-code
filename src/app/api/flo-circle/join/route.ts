import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";
import { floJoinSchema } from "@/lib/validations";
import {
  activateMembership,
  ensureMemberProfile,
} from "@/lib/flo-circle-server";
import {
  allowDemoCheckout,
  PAYMENTS_UNAVAILABLE_MESSAGE,
} from "@/lib/payments-env";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = floJoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to join Flo Circle", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 },
      );
    }

    await ensureMemberProfile(user);

    const { data: plan } = await admin
      .from("flo_circle_plans")
      .select("*")
      .eq("id", parsed.data.planId)
      .eq("is_active", true)
      .maybeSingle();
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const { data: existing } = await admin
      .from("flo_circle_memberships")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "paused", "past_due", "pending"])
      .maybeSingle();
    if (existing?.status === "active") {
      return NextResponse.json(
        { error: "You already have an active membership" },
        { status: 400 },
      );
    }
    if (existing?.status === "pending") {
      return NextResponse.json(
        {
          error:
            "You already have a pending membership payment. Finish checkout or wait a moment and try again.",
        },
        { status: 400 },
      );
    }

    const canLiveBill =
      isRazorpayConfigured() && Boolean(plan.razorpay_plan_id);

    if (!canLiveBill) {
      if (!allowDemoCheckout()) {
        return NextResponse.json(
          {
            error: PAYMENTS_UNAVAILABLE_MESSAGE,
            code: "PAYMENTS_UNAVAILABLE",
          },
          { status: 503 },
        );
      }

      const membershipId = crypto.randomUUID();
      await admin.from("flo_circle_memberships").insert({
        id: membershipId,
        user_id: user.id,
        plan_id: plan.id,
        status: "pending",
      });
      await activateMembership({
        membershipId,
        userId: user.id,
        durationDays: plan.duration_days,
      });
      return NextResponse.json({
        demo: true,
        membershipId,
        message: plan.razorpay_plan_id
          ? "Demo billing — Razorpay keys missing; membership activated locally."
          : "Demo billing — link a Razorpay plan id in admin for live charges; membership activated locally.",
      });
    }

    const membershipId = crypto.randomUUID();
    await admin.from("flo_circle_memberships").insert({
      id: membershipId,
      user_id: user.id,
      plan_id: plan.id,
      status: "pending",
    });

    const razorpay = getRazorpay()!;
    const totalCount = Math.max(1, Math.ceil(plan.duration_days / 30));
    const sub = await razorpay.subscriptions.create({
      plan_id: plan.razorpay_plan_id,
      total_count: totalCount,
      customer_notify: 1,
      notes: {
        flo_membership_id: membershipId,
        flo_user_id: user.id,
        flo_kind: "membership",
      },
    });

    await admin
      .from("flo_circle_memberships")
      .update({ razorpay_subscription_id: sub.id })
      .eq("id", membershipId);

    return NextResponse.json({
      membershipId,
      razorpaySubscriptionId: sub.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: plan.price_inr * 100,
      planName: plan.name,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
