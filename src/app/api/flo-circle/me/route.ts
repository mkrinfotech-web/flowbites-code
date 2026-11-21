import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  countPaidOrders,
  ensureMemberProfile,
  getMemberDiscountTiming,
} from "@/lib/flo-circle-server";
import { shouldApplyMemberDiscount } from "@/lib/flo-circle";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
  await ensureMemberProfile(user);
  const { data: profile } = await admin
    .from("member_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const { data: membership } = await admin
    .from("flo_circle_memberships")
    .select("*, flo_circle_plans(name, price_inr, slug, duration_days)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: subscriptions } = await admin
    .from("flo_subscriptions")
    .select("*, flo_subscription_items(*, products(name, slug))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const { data: defaultAddress } = await admin
    .from("member_addresses")
    .select("line1, line2, city, state, pincode, label")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  const isActiveMember = membership?.status === "active";
  const timing = await getMemberDiscountTiming();
  const paidOrderCount = await countPaidOrders(user.id);
  const memberDiscountEligible =
    Boolean(isActiveMember) &&
    shouldApplyMemberDiscount(timing, paidOrderCount);

  return NextResponse.json({
    profile,
    membership,
    subscriptions,
    address: defaultAddress,
    defaultAddress,
    discountTiming: timing,
    paidOrderCount,
    memberDiscountEligible,
  });
}
