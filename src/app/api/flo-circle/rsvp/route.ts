import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rsvpSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const parsed = rsvpSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

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

    const { data: event } = await admin
      .from("flo_events")
      .select("*")
      .eq("id", parsed.data.eventId)
      .eq("is_published", true)
      .maybeSingle();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let status = parsed.data.status;
    if (status === "going" && event.max_rsvp) {
      const { count } = await admin
        .from("flo_event_rsvps")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("status", "going");
      if ((count ?? 0) >= event.max_rsvp) status = "waitlist";
    }

    await admin.from("flo_event_rsvps").upsert(
      {
        event_id: event.id,
        user_id: user.id,
        status,
      },
      { onConflict: "event_id,user_id" },
    );

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
