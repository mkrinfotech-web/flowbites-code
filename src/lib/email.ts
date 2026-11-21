import { Resend } from "resend";
import { DEFAULT_SITE_ORIGIN, emailFrom, emailReplyTo } from "@/lib/site";

export type SendEmailResult =
  | { ok: true; id?: string; skipped?: boolean }
  | { ok: false; error: string; skipped?: boolean };

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || DEFAULT_SITE_ORIGIN
  );
}

function outboundEmailHeaders() {
  return {
    from: emailFrom(),
    replyTo: emailReplyTo(),
  };
}

/** Soft-retail welcome email — text + HTML. Silent when RESEND_API_KEY is missing. */
export async function sendFloCircleWelcomeEmail(params: {
  to: string;
  fullName?: string | null;
  memberId?: string | null;
}): Promise<SendEmailResult> {
  const to = params.to.trim();
  if (!to) {
    return { ok: false, error: "Missing recipient email" };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY missing — skipping Flo Circle welcome email",
    );
    return { ok: true, skipped: true };
  }

  const name = (params.fullName || to.split("@")[0] || "friend").trim();
  const base = appBaseUrl();
  const accountUrl = `${base}/account`;
  const shopUrl = `${base}/`;
  const memberLine = params.memberId
    ? `Your member ID is ${params.memberId}.`
    : "";

  const subject = "Welcome to Flo Circle ✨";
  const text = [
    `Hi ${name},`,
    "",
    "Welcome to Flo Circle — you're in.",
    "",
    "As a member you get:",
    "• 20% off shop orders (best-of-one with Love Score / coupons)",
    "• Priority packing on member orders",
    "• Welcome gift queue + member perks",
    "• Early access to events & launches",
    "",
    memberLine,
    "",
    `Manage membership: ${accountUrl}`,
    `Shop FloBites: ${shopUrl}`,
    "",
    "With soft care,",
    "The Hormone Hood · FloBites",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const html = buildWelcomeHtml({
    name,
    memberId: params.memberId,
    accountUrl,
    shopUrl,
  });

  try {
    const { data, error } = await resend.emails.send({
      ...outboundEmailHeaders(),
      to: [to],
      subject,
      text,
      html,
    });

    if (error) {
      console.error("[email] Resend welcome failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[email] Resend welcome threw:", message);
    return { ok: false, error: message };
  }
}

function buildWelcomeHtml(params: {
  name: string;
  memberId?: string | null;
  accountUrl: string;
  shopUrl: string;
}) {
  const safeName = escapeHtml(params.name);
  const memberBlock = params.memberId
    ? `<p style="margin:0 0 20px;font-size:14px;color:#7a4a58;">Member ID · <strong style="color:#5c1a2e;">${escapeHtml(params.memberId)}</strong></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to Flo Circle</title>
</head>
<body style="margin:0;padding:0;background:#fdf6f3;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(92,26,46,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#5c1a2e 0%,#c45c7a 100%);padding:36px 32px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:28px;letter-spacing:0.02em;color:#fff5f8;">Flo Circle</p>
              <p style="margin:10px 0 0;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,245,248,0.85);">The Hormone Hood</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 8px;font-size:15px;color:#7a4a58;">Hi ${safeName},</p>
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#5c1a2e;font-weight:700;">Welcome — you're in.</h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4a3038;">
                Soft retail care for your cycle weeks. Your membership is active and ready whenever you shop.
              </p>
              ${memberBlock}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f3;border-radius:16px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#c45c7a;font-weight:700;">Member perks</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#5c1a2e;">✦ 20% off shop orders</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#5c1a2e;">✦ Priority packing</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#5c1a2e;">✦ Welcome gift in the queue</p>
                    <p style="margin:0;font-size:15px;color:#5c1a2e;">✦ Events &amp; early launches</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                <tr>
                  <td style="border-radius:999px;background:#c45c7a;">
                    <a href="${params.accountUrl}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Open your account</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;text-align:center;font-size:13px;">
                <a href="${params.shopUrl}" style="color:#c45c7a;text-decoration:underline;">Shop FloBites</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9a7a84;">
                With soft care,<br />The Hormone Hood · FloBites
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Soft-retail order confirmation — silent when RESEND_API_KEY is missing. */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  totalInr: number;
  items: Array<{
    productName: string;
    quantity: number;
    lineTotalInr: number;
  }>;
  shippingAddress?: {
    line1?: string;
    line2?: string | null;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
}): Promise<SendEmailResult> {
  const to = params.to.trim();
  if (!to) {
    return { ok: false, error: "Missing recipient email" };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY missing — skipping order confirmation email",
    );
    return { ok: true, skipped: true };
  }

  const name = (
    params.customerName ||
    to.split("@")[0] ||
    "friend"
  ).trim();
  const base = appBaseUrl();
  const ordersUrl = `${base}/account/orders`;
  const shopUrl = `${base}/`;
  const totalLabel = formatInrPlain(params.totalInr);

  const itemLines = params.items
    .map(
      (i) =>
        `• ${i.productName} × ${i.quantity} — ${formatInrPlain(i.lineTotalInr)}`,
    )
    .join("\n");

  const addr = params.shippingAddress;
  const addressLines = addr
    ? [
        addr.line1,
        addr.line2,
        [addr.city, addr.state, addr.pincode].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const subject = `Order confirmed · ${params.orderNumber}`;
  const text = [
    `Hi ${name},`,
    "",
    "Thank you — your FloBites order is confirmed.",
    "",
    `Order ${params.orderNumber}`,
    itemLines,
    "",
    `Total: ${totalLabel}`,
    addressLines ? `\nShip to:\n${addressLines}` : "",
    "",
    `View orders: ${ordersUrl}`,
    `Shop again: ${shopUrl}`,
    "",
    "With soft care,",
    "The Hormone Hood · FloBites",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const html = buildOrderConfirmationHtml({
    name,
    orderNumber: params.orderNumber,
    totalLabel,
    items: params.items,
    addressLines,
    ordersUrl,
    shopUrl,
  });

  try {
    const { data, error } = await resend.emails.send({
      ...outboundEmailHeaders(),
      to: [to],
      subject,
      text,
      html,
    });

    if (error) {
      console.error("[email] Resend order confirmation failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[email] Resend order confirmation threw:", message);
    return { ok: false, error: message };
  }
}

function formatInrPlain(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildOrderConfirmationHtml(params: {
  name: string;
  orderNumber: string;
  totalLabel: string;
  items: Array<{
    productName: string;
    quantity: number;
    lineTotalInr: number;
  }>;
  addressLines: string;
  ordersUrl: string;
  shopUrl: string;
}) {
  const safeName = escapeHtml(params.name);
  const itemRows = params.items
    .map(
      (i) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(92,26,46,0.08);font-size:14px;color:#5c1a2e;">
                    ${escapeHtml(i.productName)}
                    <span style="color:#9a7a84;"> × ${i.quantity}</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(92,26,46,0.08);font-size:14px;color:#5c1a2e;text-align:right;white-space:nowrap;">
                    ${escapeHtml(formatInrPlain(i.lineTotalInr))}
                  </td>
                </tr>`,
    )
    .join("");

  const addressBlock = params.addressLines
    ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.55;color:#7a4a58;white-space:pre-line;">Ship to<br /><span style="color:#5c1a2e;">${escapeHtml(params.addressLines)}</span></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order confirmed</title>
</head>
<body style="margin:0;padding:0;background:#fdf6f3;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(92,26,46,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#5c1a2e 0%,#c45c7a 100%);padding:36px 32px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:28px;letter-spacing:0.02em;color:#fff5f8;">FloBites</p>
              <p style="margin:10px 0 0;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,245,248,0.85);">Order confirmed</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 8px;font-size:15px;color:#7a4a58;">Hi ${safeName},</p>
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#5c1a2e;font-weight:700;">Thank you — you're set.</h1>
              <p style="margin:0 0 8px;font-size:14px;color:#7a4a58;">
                Order <strong style="color:#5c1a2e;">${escapeHtml(params.orderNumber)}</strong>
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;">
                ${itemRows}
                <tr>
                  <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#5c1a2e;">Total</td>
                  <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#c45c7a;text-align:right;">${escapeHtml(params.totalLabel)}</td>
                </tr>
              </table>
              ${addressBlock}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 12px;">
                <tr>
                  <td style="border-radius:999px;background:#c45c7a;">
                    <a href="${params.ordersUrl}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">View your orders</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;text-align:center;font-size:13px;">
                <a href="${params.shopUrl}" style="color:#c45c7a;text-decoration:underline;">Shop FloBites</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9a7a84;">
                With soft care,<br />The Hormone Hood · FloBites
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Soft-retail shipped notice — silent when RESEND_API_KEY is missing. */
export async function sendOrderShippedEmail(params: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  trackingNumber?: string | null;
}): Promise<SendEmailResult> {
  return sendOrderStatusEmail({
    kind: "shipped",
    ...params,
  });
}

/** Soft-retail delivered notice — silent when RESEND_API_KEY is missing. */
export async function sendOrderDeliveredEmail(params: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  trackingNumber?: string | null;
}): Promise<SendEmailResult> {
  return sendOrderStatusEmail({
    kind: "delivered",
    ...params,
  });
}

async function sendOrderStatusEmail(params: {
  kind: "shipped" | "delivered";
  to: string;
  customerName?: string | null;
  orderNumber: string;
  trackingNumber?: string | null;
}): Promise<SendEmailResult> {
  const to = params.to.trim();
  if (!to) {
    return { ok: false, error: "Missing recipient email" };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY missing — skipping order ${params.kind} email`,
    );
    return { ok: true, skipped: true };
  }

  const name = (
    params.customerName ||
    to.split("@")[0] ||
    "friend"
  ).trim();
  const base = appBaseUrl();
  const ordersUrl = `${base}/account/orders`;
  const shopUrl = `${base}/`;
  const tracking = params.trackingNumber?.trim() || "";

  const isShipped = params.kind === "shipped";
  const subject = isShipped
    ? `On its way · ${params.orderNumber}`
    : `Delivered · ${params.orderNumber}`;
  const headline = isShipped
    ? "Your FloBites are on the way."
    : "Your FloBites have arrived.";
  const bodyLine = isShipped
    ? "We've packed your order with soft retail care and handed it to the courier."
    : "We hope your snacks for those days land softly. Shop again whenever you're ready.";

  const text = [
    `Hi ${name},`,
    "",
    headline,
    "",
    `Order ${params.orderNumber}`,
    tracking ? `Tracking: ${tracking}` : "",
    "",
    bodyLine,
    "",
    `View orders: ${ordersUrl}`,
    `Shop again: ${shopUrl}`,
    "",
    "With soft care,",
    "The Hormone Hood · FloBites",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const html = buildOrderStatusHtml({
    kind: params.kind,
    name,
    orderNumber: params.orderNumber,
    tracking,
    headline,
    bodyLine,
    ordersUrl,
    shopUrl,
  });

  try {
    const { data, error } = await resend.emails.send({
      ...outboundEmailHeaders(),
      to: [to],
      subject,
      text,
      html,
    });

    if (error) {
      console.error(`[email] Resend order ${params.kind} failed:`, error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error(`[email] Resend order ${params.kind} threw:`, message);
    return { ok: false, error: message };
  }
}

function buildOrderStatusHtml(params: {
  kind: "shipped" | "delivered";
  name: string;
  orderNumber: string;
  tracking: string;
  headline: string;
  bodyLine: string;
  ordersUrl: string;
  shopUrl: string;
}) {
  const safeName = escapeHtml(params.name);
  const eyebrow =
    params.kind === "shipped" ? "Order shipped" : "Order delivered";
  const trackingBlock = params.tracking
    ? `<p style="margin:16px 0 0;font-size:14px;color:#7a4a58;">Tracking · <strong style="color:#5c1a2e;">${escapeHtml(params.tracking)}</strong></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(eyebrow)}</title>
</head>
<body style="margin:0;padding:0;background:#fdf6f3;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(92,26,46,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#5c1a2e 0%,#c45c7a 100%);padding:36px 32px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:28px;letter-spacing:0.02em;color:#fff5f8;">FloBites</p>
              <p style="margin:10px 0 0;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,245,248,0.85);">${escapeHtml(eyebrow)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 8px;font-size:15px;color:#7a4a58;">Hi ${safeName},</p>
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#5c1a2e;font-weight:700;">${escapeHtml(params.headline)}</h1>
              <p style="margin:0 0 8px;font-size:14px;color:#7a4a58;">
                Order <strong style="color:#5c1a2e;">${escapeHtml(params.orderNumber)}</strong>
              </p>
              ${trackingBlock}
              <p style="margin:20px 0 0;font-size:16px;line-height:1.6;color:#4a3038;">
                ${escapeHtml(params.bodyLine)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 12px;">
                <tr>
                  <td style="border-radius:999px;background:#c45c7a;">
                    <a href="${params.ordersUrl}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">View your orders</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;text-align:center;font-size:13px;">
                <a href="${params.shopUrl}" style="color:#c45c7a;text-decoration:underline;">Shop FloBites</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9a7a84;">
                With soft care,<br />The Hormone Hood · FloBites
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
