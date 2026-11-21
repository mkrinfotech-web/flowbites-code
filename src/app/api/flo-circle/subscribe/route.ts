import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { subscribeSchema } from "@/lib/validations";
import {
  ensureMemberProfile,
  getActiveMembership,
} from "@/lib/flo-circle-server";
import { addDays, SUBSCRIBE_SAVE_PERCENT } from "@/lib/flo-circle";

export async function POST(req: Request) {
  try {
    const parsed = subscribeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in required", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    await ensureMemberProfile(user);
    const membership = await getActiveMembership(user.id);

    const { data: product } = await admin
      .from("products")
      .select("id, name, price_inr")
      .eq("id", parsed.data.productId)
      .eq("is_active", true)
      .maybeSingle();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const subId = crypto.randomUUID();
    const nextShip = addDays(new Date(), parsed.data.cadenceDays);

    await admin.from("flo_subscriptions").insert({
      id: subId,
      user_id: user.id,
      membership_id: membership?.id ?? null,
      status: "active",
      cadence_days: parsed.data.cadenceDays,
      next_ship_at: nextShip.toISOString(),
      shipping_address_id: parsed.data.addressId ?? null,
      discount_percent: SUBSCRIBE_SAVE_PERCENT,
    });

    await admin.from("flo_subscription_items").insert({
      subscription_id: subId,
      product_id: product.id,
      quantity: parsed.data.quantity,
      unit_price_inr: product.price_inr,
    });

    return NextResponse.json({
      subscriptionId: subId,
      demo: !isRazorpayConfigured(),
      nextShipAt: nextShip.toISOString(),
      message: isRazorpayConfigured()
        ? "Auto-delivery started. Charged on each ship cycle via linked billing when Razorpay plan is connected."
        : "Demo auto-delivery activated locally. Add Razorpay keys + plan linkage for live recurring charges.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
