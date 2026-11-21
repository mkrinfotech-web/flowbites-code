/** Shared production / demo-checkout gates for Razorpay flows. */

export function isProductionEnv() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/**
 * Demo checkout / membership activate without Razorpay.
 * Never silent in production — requires ALLOW_DEMO_CHECKOUT=1 or a non-prod env.
 */
export function allowDemoCheckout() {
  return process.env.ALLOW_DEMO_CHECKOUT === "1" || !isProductionEnv();
}

export const PAYMENTS_UNAVAILABLE_MESSAGE =
  "Online payments aren’t available right now — Razorpay isn’t configured yet. Please try again soon, or check back after checkout is re-enabled.";
