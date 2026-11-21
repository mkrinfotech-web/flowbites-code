/** Browser helpers for Razorpay Checkout (orders + subscriptions). */

export const PAYMENTS_UNAVAILABLE_MESSAGE =
  "Online payments aren’t available right now — Razorpay isn’t configured yet. Please try again soon, or check back after checkout is re-enabled.";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

export function ensureRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${CHECKOUT_SCRIPT}"]`,
  );
  if (existing) {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type RazorpaySubscriptionAuthResponse = {
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

/** Open Razorpay Checkout for a subscription (join / change-plan). */
export async function openRazorpaySubscription(params: {
  keyId: string;
  subscriptionId: string;
  planName?: string;
  amountPaise?: number;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: RazorpaySubscriptionAuthResponse) => void;
  onDismiss?: () => void;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const loaded = await ensureRazorpayScript();
  if (!loaded || !window.Razorpay) {
    return {
      ok: false,
      error: "Payment failed to load. Refresh and try again.",
    };
  }

  const options: Record<string, unknown> = {
    key: params.keyId,
    subscription_id: params.subscriptionId,
    name: "FloBites",
    description: params.planName
      ? `Flo Circle · ${params.planName}`
      : "Flo Circle membership",
    prefill: params.prefill ?? {},
    theme: { color: "#551313" },
    handler: (response: RazorpaySubscriptionAuthResponse) => {
      params.onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        params.onDismiss?.();
      },
    },
  };

  if (typeof params.amountPaise === "number" && params.amountPaise > 0) {
    options.amount = params.amountPaise;
    options.currency = "INR";
  }

  const rzp = new window.Razorpay(options);
  rzp.open();
  return { ok: true };
}
