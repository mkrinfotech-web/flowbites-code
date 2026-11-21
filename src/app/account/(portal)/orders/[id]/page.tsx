import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatInr } from "@/lib/utils";
import {
  CancelOrderForm,
  ReturnRequestForm,
} from "./order-actions-ui";

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

const CANCELABLE = new Set(["pending", "paid", "verified"]);
const RETURNABLE = new Set(["shipped", "delivered"]);

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();
  if (!user || !admin) notFound();

  const email = user.email ?? "";
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, order_number, status, total_inr, subtotal_inr, discount_inr, created_at, paid_at, shipped_at, is_priority, is_member_order, discount_source, discount_percent, tracking_number, customer_name, customer_email, customer_phone, shipping_address, user_id, cancel_reason, order_items(product_name, quantity, unit_price_inr, line_total_inr)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const owns =
    order.user_id === user.id ||
    (email &&
      typeof order.customer_email === "string" &&
      order.customer_email.toLowerCase() === email.toLowerCase());

  if (!owns) notFound();

  const { data: returnReq } = await admin
    .from("return_requests")
    .select("id, status")
    .eq("order_id", order.id)
    .maybeSingle();

  const address = (order.shipping_address ?? {}) as Address;
  const items = (order.order_items ?? []) as {
    product_name: string;
    quantity: number;
    unit_price_inr: number;
    line_total_inr: number;
  }[];

  const canCancel = CANCELABLE.has(order.status);
  const canReturn = RETURNABLE.has(order.status);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/account/orders"
          className="text-sm font-bold text-flo-pink"
        >
          ← All orders
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-flo-maroon">
          {order.order_number}
        </h1>
        <p className="mt-1 text-sm text-flo-maroon/60">
          Placed{" "}
          {new Date(order.created_at).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-flo-blush px-3 py-1 text-xs font-bold capitalize text-flo-maroon">
          {order.status}
        </span>
        {order.is_priority && (
          <span className="rounded-full bg-flo-pink/15 px-3 py-1 text-xs font-bold uppercase text-flo-pink">
            Flo Circle priority
          </span>
        )}
        {order.is_member_order && !order.is_priority && (
          <span className="rounded-full bg-flo-pink/10 px-3 py-1 text-xs font-bold text-flo-pink">
            Member order
          </span>
        )}
      </div>

      {order.status === "cancelled" && order.cancel_reason && (
        <p className="rounded-2xl bg-flo-blush/80 px-4 py-3 text-sm text-flo-maroon">
          Cancelled: {order.cancel_reason}
        </p>
      )}

      {order.tracking_number && (
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-flo-maroon/50">
            Tracking
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-flo-maroon">
            {order.tracking_number}
          </p>
          {order.shipped_at && (
            <p className="mt-1 text-xs text-flo-maroon/50">
              Shipped{" "}
              {new Date(order.shipped_at).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold text-flo-maroon">Items</h2>
        <ul className="mt-3 divide-y divide-flo-maroon/10">
          {items.map((item, i) => (
            <li
              key={`${item.product_name}-${i}`}
              className="flex justify-between gap-3 py-3 text-sm"
            >
              <span className="text-flo-maroon">
                {item.product_name}{" "}
                <span className="text-flo-maroon/50">× {item.quantity}</span>
              </span>
              <span className="shrink-0 font-semibold text-flo-maroon">
                {formatInr(item.line_total_inr)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-flo-maroon/10 pt-3 text-sm">
          <div className="flex justify-between text-flo-maroon/70">
            <span>Subtotal</span>
            <span>{formatInr(order.subtotal_inr)}</span>
          </div>
          {order.discount_inr > 0 && (
            <div className="flex justify-between text-flo-pink">
              <span>
                Discount
                {order.discount_percent
                  ? ` (${order.discount_percent}%${order.discount_source ? ` · ${order.discount_source}` : ""})`
                  : ""}
              </span>
              <span>−{formatInr(order.discount_inr)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-flo-maroon">
            <span>Total</span>
            <span>{formatInr(order.total_inr)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold text-flo-maroon">Shipping</h2>
        <p className="mt-2 text-sm text-flo-maroon">{order.customer_name}</p>
        <p className="text-sm text-flo-maroon/70">{order.customer_email}</p>
        {order.customer_phone && (
          <p className="text-sm text-flo-maroon/70">{order.customer_phone}</p>
        )}
        {(address.line1 || address.city) && (
          <p className="mt-2 text-sm text-flo-maroon/80">
            {[address.line1, address.line2].filter(Boolean).join(", ")}
            <br />
            {[address.city, address.state, address.pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>

      {canReturn && (
        <ReturnRequestForm
          orderId={order.id}
          existingStatus={returnReq?.status ?? null}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/account/orders/${order.id}/invoice`}
          className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-flo-maroon shadow-sm"
        >
          Invoice
        </Link>
        <Link
          href="/account/support"
          className="inline-flex h-11 items-center rounded-full bg-flo-soft px-5 text-sm font-bold text-flo-maroon"
        >
          Need help?
        </Link>
        <Link
          href="/#bestsellers"
          className="inline-flex h-11 items-center rounded-full bg-flo-brown px-5 text-sm font-bold text-white"
        >
          Shop again
        </Link>
        {canCancel && <CancelOrderForm orderId={order.id} />}
      </div>
    </div>
  );
}
