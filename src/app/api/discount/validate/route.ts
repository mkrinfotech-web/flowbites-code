import { NextResponse } from "next/server";
import { lookupValidDiscountCode } from "@/lib/discount-codes";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateDiscountSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = validateDiscountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, error: "Enter a valid discount code." },
        { status: 400 },
      );
    }

    const { code, sessionId } = parsed.data;
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        {
          valid: false,
          error: "Discount validation is unavailable right now.",
        },
        { status: 503 },
      );
    }

    const validated = await lookupValidDiscountCode(admin, code, sessionId);
    if (!validated) {
      return NextResponse.json(
        {
          valid: false,
          error: "This code is invalid, expired, or already used.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      valid: true,
      code: validated.code,
      percentOff: validated.percentOff,
      kind: validated.kind,
      lovedName: validated.lovedName,
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Could not validate code." },
      { status: 500 },
    );
  }
}
