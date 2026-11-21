import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatInr } from "@/lib/utils";
import { BUSINESS_ADDRESS } from "@/lib/site";
import { PrintInvoiceButton } from "./print-button";

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export default async function OrderInvoicePage({
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
      "id, order_number, status, total_inr, subtotal_inr, discount_inr, discount_percent, discount_source, created_at, paid_at, customer_name, customer_email, customer_phone, shipping_address, user_id, razorpay_payment_id, order_items(product_name, quantity, unit_price_inr, line_total_inr)",
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

  const address = (order.shipping_address ?? {}) as Address;
  const items = (order.order_items ?? []) as {
    product_name: string;
    quantity: number;
    unit_price_inr: number;
    line_total_inr: number;
  }[];

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print, .invoice-print * { visibility: visible !important; }
          .invoice-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 24px !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center gap-3">
          <Link
            href={`/account/orders/${order.id}`}
            className="text-sm font-bold text-flo-pink"
          >
            ← Back to order
          </Link>
          <PrintInvoiceButton />
        </div>

        <article className="invoice-print rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-flo-maroon/10 pb-5">
            <div>
              <p className="font-script text-3xl text-flo-pink">FloBites</p>
              <p className="mt-1 text-sm text-flo-maroon/70">
                {BUSINESS_ADDRESS.brandName}
              </p>
              {BUSINESS_ADDRESS.lines.slice(1).map((line) => (
                <p key={line} className="text-xs text-flo-maroon/55">
                  {line}
                </p>
              ))}
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold text-flo-maroon">Invoice</h1>
              <p className="font-mono text-sm font-semibold text-flo-maroon">
                {order.order_number}
              </p>
              <p className="mt-1 text-xs capitalize text-flo-maroon/55">
                Status: {order.status}
              </p>
            </div>
          </header>

          <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-flo-maroon/45">
                Bill to
              </p>
              <p className="mt-1 font-semibold text-flo-maroon">
                {order.customer_name}
              </p>
              <p className="text-flo-maroon/70">{order.customer_email}</p>
              {order.customer_phone && (
                <p className="text-flo-maroon/70">{order.customer_phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-flo-maroon/45">
                Ship to
              </p>
              {address.line1 || address.city ? (
                <p className="mt-1 text-flo-maroon/80">
                  {[address.line1, address.line2].filter(Boolean).join(", ")}
                  <br />
                  {[address.city, address.state, address.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : (
                <p className="mt-1 text-flo-maroon/55">—</p>
              )}
              <p className="mt-3 text-xs text-flo-maroon/55">
                Placed{" "}
                {new Date(order.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {order.paid_at
                  ? ` · Paid ${new Date(order.paid_at).toLocaleDateString("en-IN")}`
                  : ""}
              </p>
              {order.razorpay_payment_id && (
                <p className="text-xs text-flo-maroon/45">
                  Payment: {order.razorpay_payment_id}
                </p>
              )}
            </div>
          </div>

          <table className="mt-6 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-flo-maroon/15 text-xs uppercase tracking-wide text-flo-maroon/50">
                <th className="py-2 font-bold">Item</th>
                <th className="py-2 font-bold">Qty</th>
                <th className="py-2 font-bold">Price</th>
                <th className="py-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={`${item.product_name}-${i}`}
                  className="border-b border-flo-maroon/8"
                >
                  <td className="py-2.5 text-flo-maroon">{item.product_name}</td>
                  <td className="py-2.5 text-flo-maroon/70">{item.quantity}</td>
                  <td className="py-2.5 text-flo-maroon/70">
                    {formatInr(item.unit_price_inr)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-flo-maroon">
                    {formatInr(item.line_total_inr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
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
            <div className="flex justify-between border-t border-flo-maroon/10 pt-2 text-base font-bold text-flo-maroon">
              <span>Total</span>
              <span>{formatInr(order.total_inr)}</span>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-flo-maroon/45">
            Thank you for choosing FloBites — soft fuel for your cycle.
          </p>
        </article>
      </div>
    </>
  );
}
