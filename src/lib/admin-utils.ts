export type StaffRole = "admin" | "staff";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: StaffRole;
  is_active: boolean;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "verified"
  | "processing"
  | "shipped"
  | "delivered"
  | "failed"
  | "refunded"
  | "cancelled";

/** Ops workflow: paid → verified → processing → shipped → delivered */
export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "verified",
  "processing",
  "shipped",
  "delivered",
  "failed",
  "refunded",
  "cancelled",
];

/** Statuses that still need staff action */
export const ORDER_NEEDS_ATTENTION: OrderStatus[] = [
  "pending",
  "paid",
  "verified",
  "processing",
];

/** Count toward revenue (paid and later fulfillment — excludes pending/failed/refunded/cancelled) */
export const ORDER_REVENUE_STATUSES: OrderStatus[] = [
  "paid",
  "verified",
  "processing",
  "shipped",
  "delivered",
];

export const MEDIA_BUCKETS = ["media", "product-images"] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid — needs verify",
  verified: "Verified",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export function formatInr(paiseOrRupees: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paiseOrRupees);
}

export function csvEscape(value: string | number | null | undefined) {
  const v = value == null ? "" : String(value);
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export type ShippingAddress = {
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
};

export function parseShippingAddress(
  value: unknown,
): ShippingAddress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ShippingAddress;
}

/** Happy-path timeline steps for admin order detail (derived from timestamps + status). */
export type OrderTimelineStep = {
  key: string;
  label: string;
  at: string | null;
  state: "done" | "current" | "upcoming" | "skipped";
};

export function buildOrderTimeline(order: {
  status: string;
  created_at: string;
  paid_at?: string | null;
  verified_at?: string | null;
  shipped_at?: string | null;
}): OrderTimelineStep[] {
  const status = order.status as OrderStatus;
  const terminal = ["cancelled", "failed", "refunded"].includes(status);
  const rank: Record<string, number> = {
    pending: 0,
    paid: 1,
    verified: 2,
    processing: 3,
    shipped: 4,
    delivered: 5,
    failed: -1,
    cancelled: -1,
    refunded: -1,
  };
  const current = rank[status] ?? 0;

  const steps: OrderTimelineStep[] = [
    {
      key: "placed",
      label: "Placed",
      at: order.created_at,
      state: "done",
    },
    {
      key: "paid",
      label: "Paid",
      at: order.paid_at ?? null,
      state:
        order.paid_at || current >= 1
          ? "done"
          : status === "pending"
            ? "current"
            : terminal
              ? "skipped"
              : "upcoming",
    },
    {
      key: "verified",
      label: "Verified",
      at: order.verified_at ?? null,
      state:
        order.verified_at || current >= 2
          ? "done"
          : status === "paid"
            ? "current"
            : terminal && current < 2
              ? "skipped"
              : current < 2
                ? "upcoming"
                : "done",
    },
    {
      key: "processing",
      label: "Processing",
      at: null,
      state:
        current >= 3
          ? "done"
          : status === "verified"
            ? "current"
            : terminal && current < 3
              ? "skipped"
              : current < 3
                ? "upcoming"
                : "done",
    },
    {
      key: "shipped",
      label: "Shipped",
      at: order.shipped_at ?? null,
      state:
        order.shipped_at || current >= 4
          ? "done"
          : status === "processing"
            ? "current"
            : terminal && current < 4
              ? "skipped"
              : current < 4
                ? "upcoming"
                : "done",
    },
    {
      key: "delivered",
      label: "Delivered",
      at: null,
      state:
        status === "delivered"
          ? "done"
          : status === "shipped"
            ? "current"
            : terminal
              ? "skipped"
              : "upcoming",
    },
  ];

  if (terminal) {
    steps.push({
      key: status,
      label: ORDER_STATUS_LABELS[status] ?? status,
      at: null,
      state: "current",
    });
  }

  return steps;
}

export function statusTone(status: string) {
  switch (status) {
    case "verified":
    case "delivered":
      return "bg-emerald-100 text-emerald-800";
    case "paid":
      return "bg-amber-100 text-amber-900";
    case "processing":
    case "shipped":
      return "bg-sky-100 text-sky-800";
    case "pending":
      return "bg-amber-100 text-amber-900";
    case "failed":
    case "cancelled":
    case "refunded":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-flo-blush text-flo-maroon";
  }
}

/** Minimal markdown → safe-ish HTML for CMS pages */
export function renderMarkdown(md: string): string {
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const withCode = escaped.replace(
    /```([\s\S]*?)```/g,
    (_, code: string) =>
      `<pre class="overflow-x-auto rounded-xl bg-flo-maroon/5 p-4 text-sm"><code>${code.trim()}</code></pre>`,
  );

  const lines = withCode.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("<pre")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(line);
      continue;
    }
    if (/^###\s+/.test(line)) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(
        `<h3 class="mt-6 text-lg font-bold text-flo-maroon">${inline(line.replace(/^###\s+/, ""))}</h3>`,
      );
    } else if (/^##\s+/.test(line)) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(
        `<h2 class="mt-8 text-xl font-extrabold text-flo-maroon">${inline(line.replace(/^##\s+/, ""))}</h2>`,
      );
    } else if (/^#\s+/.test(line)) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(
        `<h1 class="text-3xl font-extrabold text-flo-maroon">${inline(line.replace(/^#\s+/, ""))}</h1>`,
      );
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push('<ul class="mt-3 list-disc space-y-1 pl-5">');
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    } else {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<p class="mt-3 leading-relaxed text-flo-ink/90">${inline(line)}</p>`);
    }
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

function inline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[(.+?)\]\((https?:\/\/[^\s)"']+)\)/g,
      '<a class="text-flo-pink underline" href="$2" rel="noopener noreferrer">$1</a>',
    );
}
