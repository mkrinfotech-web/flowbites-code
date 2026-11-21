import { NextResponse } from "next/server";
import { getActiveFaqs } from "@/lib/cms";

export async function GET() {
  const faqs = await getActiveFaqs();
  return NextResponse.json({ faqs });
}
