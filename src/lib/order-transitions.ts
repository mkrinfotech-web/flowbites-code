import type { OrderStatus } from "@/lib/admin-utils";

/** Happy-path forward edges (exactly one step). */
const FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "verified",
  verified: "processing",
  processing: "shipped",
  shipped: "delivered",
};

/**
 * Side / terminal transitions with rules.
 * - cancel: before shipped (ops can still stop packing)
 * - fail: payment never completed
 * - refund: after money captured (paid+)
 */
const SIDE: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["failed", "cancelled"],
  paid: ["cancelled", "refunded", "failed"],
  verified: ["cancelled", "refunded"],
  processing: ["cancelled", "refunded"],
  shipped: ["refunded"],
  delivered: ["refunded"],
  // A paid order cancelled before shipping can still be refunded.
  cancelled: ["refunded"],
};

export type TransitionResult =
  | { ok: true }
  | { ok: false; error: string };

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
  opts?: { trackingNumber?: string | null },
): TransitionResult {
  if (from === to) return { ok: true };

  const forward = FORWARD[from];
  if (forward === to) {
    if (to === "shipped") {
      const tracking = (opts?.trackingNumber ?? "").trim();
      if (!tracking) {
        return {
          ok: false,
          error: "Tracking number is required to mark an order shipped.",
        };
      }
    }
    return { ok: true };
  }

  const sides = SIDE[from] ?? [];
  if (sides.includes(to)) return { ok: true };

  return {
    ok: false,
    error: `Illegal status change: ${from} → ${to}. Expected happy path paid→verified→processing→shipped→delivered.`,
  };
}

/** Map quick-action verb to target status. */
export function statusForVerifyAction(
  action: "verify" | "process" | "ship" | "deliver" | "cancel",
): OrderStatus {
  switch (action) {
    case "verify":
      return "verified";
    case "process":
      return "processing";
    case "ship":
      return "shipped";
    case "deliver":
      return "delivered";
    case "cancel":
      return "cancelled";
  }
}

/** Allowed next statuses for a status dropdown (includes current). */
export function allowedNextStatuses(from: OrderStatus): OrderStatus[] {
  const next = new Set<OrderStatus>([from]);
  const forward = FORWARD[from];
  if (forward) next.add(forward);
  for (const s of SIDE[from] ?? []) next.add(s);
  return Array.from(next);
}
