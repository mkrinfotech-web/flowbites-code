import { NextResponse } from "next/server";
import { loveScoreSchema } from "@/lib/validations";
import { computeLoveScore, makeDiscountCode } from "@/lib/love-score";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loveScoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid name. Use 2–40 characters." },
        { status: 400 },
      );
    }

    const { name, sessionId } = parsed.data;
    const percentOff = computeLoveScore(name);
    const code = makeDiscountCode(name, percentOff);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("discount_codes").upsert(
        {
          code,
          loved_name: name.trim(),
          percent_off: percentOff,
          session_id: sessionId,
          expires_at: expiresAt,
        },
        { onConflict: "code" },
      );
    }

    return NextResponse.json({
      code,
      percentOff,
      lovedName: name.trim(),
      expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
