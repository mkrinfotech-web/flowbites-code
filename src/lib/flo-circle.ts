/** Flo Circle discount stacking — rule (ii) Best of one by default */

export type DiscountSource =
  | "flo_circle"
  | "subscribe_save"
  | "love_score"
  | "coupon"
  | "none";

export type StackMode = "best_of_one" | "stack_all";

/** When 20% member pricing applies relative to prior paid order count */
export type MemberDiscountTiming =
  | "first_order"
  | "second_order"
  | "always"
  | "never";

export type DiscountCandidate = {
  source: Exclude<DiscountSource, "none">;
  percent: number;
};

const TIE_BREAK: Exclude<DiscountSource, "none">[] = [
  "flo_circle",
  "subscribe_save",
  "coupon",
  "love_score",
];

export const FLO_CIRCLE_PERCENT = 20;
/** @deprecated Subscribe & save removed from cart/checkout */
export const SUBSCRIBE_SAVE_PERCENT = 20;
export const MAX_STACK_PERCENT = 50;

/** Checkout join: ₹1 for 180 days (flo_circle_intro plan) */
export const FLO_CIRCLE_INTRO_FEE_INR = 1;
export const FLO_CIRCLE_INTRO_DAYS = 180;
export const FLO_CIRCLE_INTRO_PLAN_SLUG = "flo_circle_intro";
export const DEFAULT_MEMBER_DISCOUNT_TIMING: MemberDiscountTiming =
  "second_order";

export function parseMemberDiscountTiming(
  raw: unknown,
): MemberDiscountTiming {
  const v = String(raw ?? "")
    .replace(/^"+|"+$/g, "")
    .trim();
  if (
    v === "first_order" ||
    v === "second_order" ||
    v === "always" ||
    v === "never"
  ) {
    return v;
  }
  return DEFAULT_MEMBER_DISCOUNT_TIMING;
}

/**
 * Decide if 20% member discount applies on this checkout.
 * `paidOrderCount` = already-paid orders for the user (excludes the current one).
 */
export function shouldApplyMemberDiscount(
  timing: MemberDiscountTiming,
  paidOrderCount: number,
): boolean {
  switch (timing) {
    case "never":
      return false;
    case "always":
      return true;
    case "first_order":
      return paidOrderCount === 0;
    case "second_order":
      return paidOrderCount >= 1;
    default:
      return paidOrderCount >= 1;
  }
}

export function resolveBestDiscount(
  candidates: DiscountCandidate[],
  mode: StackMode = "best_of_one",
): { percent: number; source: DiscountSource } {
  const valid = candidates.filter((c) => c.percent > 0);
  if (!valid.length) return { percent: 0, source: "none" };

  if (mode === "stack_all") {
    const percent = Math.min(
      MAX_STACK_PERCENT,
      valid.reduce((s, c) => s + c.percent, 0),
    );
    // Prefer flo_circle label when present in stack
    const source =
      valid.find((c) => c.source === "flo_circle")?.source ??
      valid.sort((a, b) => b.percent - a.percent)[0]!.source;
    return { percent, source };
  }

  // best_of_one
  let best = valid[0]!;
  for (const c of valid.slice(1)) {
    if (c.percent > best.percent) {
      best = c;
    } else if (c.percent === best.percent) {
      const a = TIE_BREAK.indexOf(c.source);
      const b = TIE_BREAK.indexOf(best.source);
      if (a >= 0 && (b < 0 || a < b)) best = c;
    }
  }
  return { percent: best.percent, source: best.source };
}

export function buildCheckoutCandidates(input: {
  /** True when member (or joining) AND timing rule says 20% applies now */
  applyMemberDiscount: boolean;
  loveScorePercent?: number;
  couponPercent?: number;
}): DiscountCandidate[] {
  const out: DiscountCandidate[] = [];
  if (input.applyMemberDiscount) {
    out.push({ source: "flo_circle", percent: FLO_CIRCLE_PERCENT });
  }
  if (input.loveScorePercent && input.loveScorePercent > 0) {
    out.push({ source: "love_score", percent: input.loveScorePercent });
  }
  if (input.couponPercent && input.couponPercent > 0) {
    out.push({ source: "coupon", percent: input.couponPercent });
  }
  return out;
}

export function generateMemberId() {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FLO-C-${part}`;
}

export function daysRemaining(endsAt: string | Date | null | undefined) {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const FLO_CIRCLE_BENEFITS = [
  {
    key: "discount_20",
    title: "Up to 20% off on every order",
    body: "Always-on member pricing whenever you shop FloBites.",
  },
  {
    key: "priority",
    title: "Priority packing",
    body: "Member orders get priority attention in our soft retail queue.",
  },
  {
    key: "subscribe_save",
    title: "Subscribe & save",
    body: "Optional auto-delivery on your cadence — still 20% off.",
  },
  {
    key: "gifts",
    title: "Member gifts",
    body: "Join gifts and milestone surprises along your cycle journey.",
  },
  {
    key: "early_access",
    title: "Early access launches",
    body: "Peek at new drops before they go public.",
  },
  {
    key: "events",
    title: "Member events",
    body: "RSVP to Flo Circle moments — community, tips, and more.",
  },
] as const;

export const CANCEL_REASONS = [
  { code: "too_expensive", label: "Too expensive right now" },
  { code: "not_using", label: "Not using it enough" },
  { code: "moving", label: "Moving / address issues" },
  { code: "quality", label: "Product preference changed" },
  { code: "other", label: "Other" },
] as const;
