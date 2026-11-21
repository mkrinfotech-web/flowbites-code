import { NextResponse } from "next/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";

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
  if (!client) return NextResponse.json({ events: [] });
  const { data } = await client
    .from("flo_events")
    .select("*")
    .eq("is_published", true)
    .gte("event_at", new Date().toISOString())
    .order("event_at");
  return NextResponse.json({ events: data ?? [] });
}
