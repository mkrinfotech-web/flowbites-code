import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { subscriptionActionSchema } from "@/lib/validations";
import { addDays } from "@/lib/flo-circle";

export async function POST(req: Request) {
  try {
    const parsed = subscriptionActionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { subscriptionId, action, productId, quantity, cancelReason } =
      parsed.data;

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

    const { data: sub } = await admin
      .from("flo_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const allowedFrom: Record<string, string[]> = {
      skip: ["active"],
      pause: ["active"],
      resume: ["paused"],
      cancel: ["active", "paused", "skipped"],
      swap: ["active", "paused"],
    };
    const currentStatus = String(sub.status ?? "");
    if (!allowedFrom[action]?.includes(currentStatus)) {
      return NextResponse.json(
        { error: `Cannot ${action} a subscription that is ${currentStatus}.` },
        { status: 409 },
      );
    }

    if (action === "skip") {
      const base = sub.next_ship_at
        ? new Date(sub.next_ship_at)
        : new Date();
      const next = addDays(base, sub.cadence_days);
      await admin
        .from("flo_subscriptions")
        .update({
          status: "skipped",
          skip_until: next.toISOString(),
          next_ship_at: next.toISOString(),
        })
        .eq("id", subscriptionId);
      // Flip back to active for next cycle display
      await admin
        .from("flo_subscriptions")
        .update({ status: "active" })
        .eq("id", subscriptionId);
      return NextResponse.json({ ok: true, nextShipAt: next.toISOString() });
    }

    if (action === "pause") {
      await admin
        .from("flo_subscriptions")
        .update({
          status: "paused",
          paused_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);
      return NextResponse.json({ ok: true, status: "paused" });
    }

    if (action === "resume") {
      const next = addDays(new Date(), sub.cadence_days);
      await admin
        .from("flo_subscriptions")
        .update({
          status: "active",
          paused_at: null,
          next_ship_at: next.toISOString(),
        })
        .eq("id", subscriptionId);
      return NextResponse.json({ ok: true, status: "active" });
    }

    if (action === "cancel") {
      await admin
        .from("flo_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: cancelReason ?? null,
        })
        .eq("id", subscriptionId);
      await admin.from("flo_support_tickets").insert({
        user_id: user.id,
        category: "cancel_sub",
        reason_code: cancelReason ?? "other",
        message: `Subscription ${subscriptionId} cancelled`,
      });
      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    if (action === "swap") {
      if (!productId) {
        return NextResponse.json(
          { error: "productId required" },
          { status: 400 },
        );
      }
      const { data: product } = await admin
        .from("products")
        .select("id, price_inr")
        .eq("id", productId)
        .eq("is_active", true)
        .maybeSingle();
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }
      await admin
        .from("flo_subscription_items")
        .delete()
        .eq("subscription_id", subscriptionId);
      await admin.from("flo_subscription_items").insert({
        subscription_id: subscriptionId,
        product_id: product.id,
        quantity: quantity ?? 1,
        unit_price_inr: product.price_inr,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
