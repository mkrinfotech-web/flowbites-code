import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";
import { membershipActionSchema } from "@/lib/validations";
import { activateMembership } from "@/lib/flo-circle-server";
import {
  allowDemoCheckout,
  PAYMENTS_UNAVAILABLE_MESSAGE,
} from "@/lib/payments-env";

export async function POST(req: Request) {
  try {
    const parsed = membershipActionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { membershipId, action, planId, cancelReason } = parsed.data;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: membership } = await admin
      .from("flo_circle_memberships")
      .select("*, flo_circle_plans(*)")
      .eq("id", membershipId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const allowedFrom: Record<string, string[]> = {
      pause: ["active"],
      resume: ["paused"],
      cancel: ["active", "paused", "past_due"],
      change_plan: ["active", "paused", "past_due"],
    };
    const currentStatus = String(membership.status ?? "");
    if (!allowedFrom[action]?.includes(currentStatus)) {
      return NextResponse.json(
        { error: `Cannot ${action} a membership that is ${currentStatus}.` },
        { status: 409 },
      );
    }

    const rzSubId = membership.razorpay_subscription_id as string | null;
    const razorpay = isRazorpayConfigured() ? getRazorpay() : null;

    if (action === "pause") {
      if (razorpay && rzSubId) {
        try {
          await razorpay.subscriptions.pause(rzSubId, {
            pause_at: "now",
          });
        } catch (e) {
          console.error("razorpay pause", e);
        }
      }
      await admin
        .from("flo_circle_memberships")
        .update({
          status: "paused",
          paused_at: new Date().toISOString(),
        })
        .eq("id", membershipId);
      return NextResponse.json({ ok: true, status: "paused" });
    }

    if (action === "resume") {
      if (razorpay && rzSubId) {
        try {
          await razorpay.subscriptions.resume(rzSubId, {
            resume_at: "now",
          });
        } catch (e) {
          console.error("razorpay resume", e);
        }
      }
      await admin
        .from("flo_circle_memberships")
        .update({ status: "active", paused_at: null })
        .eq("id", membershipId);
      return NextResponse.json({ ok: true, status: "active" });
    }

    if (action === "cancel") {
      if (razorpay && rzSubId) {
        try {
          await razorpay.subscriptions.cancel(rzSubId, false);
        } catch (e) {
          console.error("razorpay cancel", e);
        }
      }
      await admin
        .from("flo_circle_memberships")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: cancelReason ?? null,
          auto_renew: false,
        })
        .eq("id", membershipId);
      await admin.from("flo_support_tickets").insert({
        user_id: user.id,
        category: "cancel_membership",
        reason_code: cancelReason ?? "other",
        message: `Membership ${membershipId} cancelled`,
      });
      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    if (action === "change_plan") {
      if (!planId) {
        return NextResponse.json({ error: "planId required" }, { status: 400 });
      }
      const { data: plan } = await admin
        .from("flo_circle_plans")
        .select("*")
        .eq("id", planId)
        .eq("is_active", true)
        .maybeSingle();
      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      const canLiveBill =
        isRazorpayConfigured() && Boolean(plan.razorpay_plan_id);

      // Gate before cancelling the current membership — no silent prod demo
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

        if (razorpay && rzSubId) {
          try {
            await razorpay.subscriptions.cancel(rzSubId, false);
          } catch {
            /* ignore */
          }
        }
        await admin
          .from("flo_circle_memberships")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancel_reason: "change_plan",
          })
          .eq("id", membershipId);

        const newId = crypto.randomUUID();
        await admin.from("flo_circle_memberships").insert({
          id: newId,
          user_id: user.id,
          plan_id: plan.id,
          status: "pending",
        });
        await activateMembership({
          membershipId: newId,
          userId: user.id,
          durationDays: plan.duration_days,
        });
        return NextResponse.json({
          ok: true,
          demo: true,
          membershipId: newId,
          message:
            "Demo billing — plan changed locally (Razorpay not configured).",
        });
      }

      // Cancel old + create new pending with live Razorpay subscription
      if (razorpay && rzSubId) {
        try {
          await razorpay.subscriptions.cancel(rzSubId, false);
        } catch {
          /* ignore */
        }
      }
      await admin
        .from("flo_circle_memberships")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: "change_plan",
        })
        .eq("id", membershipId);

      const newId = crypto.randomUUID();
      await admin.from("flo_circle_memberships").insert({
        id: newId,
        user_id: user.id,
        plan_id: plan.id,
        status: "pending",
      });

      const sub = await razorpay!.subscriptions.create({
        plan_id: plan.razorpay_plan_id,
        total_count: Math.max(1, Math.ceil(plan.duration_days / 30)),
        customer_notify: 1,
        notes: {
          flo_membership_id: newId,
          flo_user_id: user.id,
          flo_kind: "membership",
        },
      });
      await admin
        .from("flo_circle_memberships")
        .update({ razorpay_subscription_id: sub.id })
        .eq("id", newId);

      return NextResponse.json({
        ok: true,
        membershipId: newId,
        razorpaySubscriptionId: sub.id,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: plan.price_inr * 100,
        planName: plan.name,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
