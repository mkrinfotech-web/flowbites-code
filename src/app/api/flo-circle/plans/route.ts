import { NextResponse } from "next/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";
import { FLO_CIRCLE_BENEFITS } from "@/lib/flo-circle";

function getReadableClient() {
  const admin = getSupabaseAdmin();
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createAnonClient(url, key);
}

export async function GET() {
  const client = getReadableClient();
  if (!client) {
    return NextResponse.json({
      plans: [],
      benefits: FLO_CIRCLE_BENEFITS,
      demo: true,
    });
  }
  const { data: plans } = await client
    .from("flo_circle_plans")
    .select(
      "id, slug, name, description, duration_days, price_inr, is_active, sort_order, perks, razorpay_plan_id",
    )
    .eq("is_active", true)
    .order("sort_order");
  return NextResponse.json({
    plans: plans ?? [],
    benefits: FLO_CIRCLE_BENEFITS,
    razorpayConfigured: Boolean(
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET,
    ),
  });
}
