import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { guestTrackOrderSchema } from "@/lib/validations";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limited = rateLimit(clientKeyFromHeaders(req.headers, "track"), {
      limit: 8,
      windowMs: 60_000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many lookups — try again in a moment." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const parsed = guestTrackOrderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email and order number." },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const email = parsed.data.email.toLowerCase();
    const orderNumber = parsed.data.orderNumber.trim().toUpperCase();

    const { data: order, error } = await admin
      .from("orders")
      .select(
        "order_number, status, created_at, paid_at, shipped_at, tracking_number, total_inr, customer_name",
      )
      .eq("order_number", orderNumber)
      // ilike for case-insensitivity, but escape LIKE wildcards so % and _ are literal
      .ilike("customer_email", email.replace(/[\\%_]/g, "\\$&"))
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Couldn’t look up that order." }, { status: 500 });
    }

    // Soft retail: same vague message whether missing or email mismatch
    if (!order) {
      return NextResponse.json(
        {
          error:
            "We couldn’t find a pack with that email and order number. Double-check and try again.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      order: {
        orderNumber: order.order_number,
        status: order.status,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        shippedAt: order.shipped_at,
        trackingNumber: order.tracking_number,
        totalInr: order.total_inr,
        customerName: order.customer_name,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
