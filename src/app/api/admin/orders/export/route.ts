import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/admin-auth";
import {
  csvEscape,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/admin-utils";

const querySchema = z.object({
  status: z
    .enum([
      "pending",
      "paid",
      "verified",
      "processing",
      "shipped",
      "delivered",
      "failed",
      "refunded",
      "cancelled",
    ])
    .optional(),
  q: z.string().trim().max(100).optional(),
  email: z.string().trim().max(200).optional(),
});

function likeTerm(value: string): string {
  return value
    .replace(/[\\%_]/g, (c) => `\\${c}`)
    .replace(/[,()"]/g, " ")
    .trim();
}

export async function GET(request: Request) {
  try {
    const { supabase } = await requireStaff();
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      status: url.searchParams.get("status") || undefined,
      q: url.searchParams.get("q") || undefined,
      email: url.searchParams.get("email") || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    let query = supabase
      .from("orders")
      .select(
        "order_number, status, customer_name, customer_email, customer_phone, total_inr, subtotal_inr, discount_inr, membership_fee_inr, tracking_number, created_at, paid_at, includes_flo_circle_join, is_member_order",
      )
      .order("created_at", { ascending: false })
      .limit(2000);

    if (
      parsed.data.status &&
      ORDER_STATUSES.includes(parsed.data.status as OrderStatus)
    ) {
      query = query.eq("status", parsed.data.status);
    }

    const userId = url.searchParams.get("userId") || "";
    if (/^[0-9a-f-]{36}$/i.test(userId)) query = query.eq("user_id", userId);
    if (parsed.data.email) {
      query = query.ilike("customer_email", likeTerm(parsed.data.email));
    }
    if (parsed.data.q) {
      const term = likeTerm(parsed.data.q);
      if (term) {
        query = query.or(
          `order_number.ilike.%${term}%,customer_email.ilike.%${term}%,customer_name.ilike.%${term}%`,
        );
      }
    }

    const { data: orders, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const header = [
      "order_number",
      "status",
      "customer_name",
      "customer_email",
      "customer_phone",
      "subtotal_inr",
      "discount_inr",
      "membership_fee_inr",
      "total_inr",
      "created_at",
      "paid_at",
      "tracking_number",
      "flo_circle_join",
      "member_order",
    ].join(",");

    const rows = (orders ?? []).map((o) =>
      [
        csvEscape(o.order_number),
        csvEscape(o.status),
        csvEscape(o.customer_name),
        csvEscape(o.customer_email),
        csvEscape(o.customer_phone),
        csvEscape(o.subtotal_inr),
        csvEscape(o.discount_inr),
        csvEscape(o.membership_fee_inr ?? 0),
        csvEscape(o.total_inr),
        csvEscape(o.created_at),
        csvEscape(o.paid_at),
        csvEscape(o.tracking_number),
        o.includes_flo_circle_join ? "yes" : "no",
        o.is_member_order ? "yes" : "no",
      ].join(","),
    );

    const csv = [header, ...rows].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    const statusSuffix = parsed.data.status ? `-${parsed.data.status}` : "";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="flobites-orders${statusSuffix}-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
