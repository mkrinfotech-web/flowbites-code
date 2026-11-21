import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_SITE_ORIGIN } from "@/lib/site";
import {
  sendFloCircleWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
  sendOrderShippedEmail,
} from "@/lib/email";
import {
  addDays,
  DEFAULT_MEMBER_DISCOUNT_TIMING,
  FLO_CIRCLE_INTRO_DAYS,
  FLO_CIRCLE_INTRO_PLAN_SLUG,
  generateMemberId,
  parseMemberDiscountTiming,
  type MemberDiscountTiming,
  type StackMode,
} from "@/lib/flo-circle";

export async function getStackMode(): Promise<StackMode> {
  const admin = getSupabaseAdmin();
  if (!admin) return "best_of_one";
  const { data } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "discount_stack_mode")
    .maybeSingle();
  const v = data?.value;
  if (v === "stack_all" || v === '"stack_all"') return "stack_all";
  if (typeof v === "string" && v.includes("stack_all")) return "stack_all";
  return "best_of_one";
}

export async function getMemberDiscountTiming(): Promise<MemberDiscountTiming> {
  const admin = getSupabaseAdmin();
  if (!admin) return DEFAULT_MEMBER_DISCOUNT_TIMING;
  const { data } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "flo_circle_discount_timing")
    .maybeSingle();
  return parseMemberDiscountTiming(data?.value);
}

const COUNTED_ORDER_STATUSES = [
  "paid",
  "verified",
  "processing",
  "shipped",
  "delivered",
] as const;

/** Already-paid shop orders for a user (excludes the current pending checkout). */
export async function countPaidOrders(userId: string): Promise<number> {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;
  const { count } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", [...COUNTED_ORDER_STATUSES]);
  return count ?? 0;
}

/**
 * Idempotent post-payment side effects: activate pending membership,
 * burn discount code, write savings ledger, decrement stock, send
 * order confirmation email (once per order).
 */
export async function applyPaidOrderSideEffects(order: {
  id: string;
  user_id: string | null;
  discount_inr: number | null;
  discount_source: string | null;
  membership_id: string | null;
  discount_code_id?: string | null;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  if (order.membership_id && order.user_id) {
    const { data: m } = await admin
      .from("flo_circle_memberships")
      .select("status, flo_circle_plans(duration_days)")
      .eq("id", order.membership_id)
      .maybeSingle();
    if (m && m.status === "pending") {
      const duration =
        (m.flo_circle_plans as { duration_days?: number } | null)
          ?.duration_days ?? FLO_CIRCLE_INTRO_DAYS;
      await activateMembership({
        membershipId: order.membership_id,
        userId: order.user_id,
        durationDays: duration,
      });
    }
  }

  if (order.discount_code_id) {
    const { data: codeRow } = await admin
      .from("discount_codes")
      .select("max_uses")
      .eq("id", order.discount_code_id)
      .maybeSingle();
    const maxUses = (codeRow?.max_uses as number | null | undefined) ?? null;

    if (maxUses == null) {
      // Single-use code: burn on first paid redemption.
      await admin
        .from("discount_codes")
        .update({
          used_at: new Date().toISOString(),
          order_id: order.id,
        })
        .eq("id", order.discount_code_id)
        .is("used_at", null);
    } else {
      // Multi-use code: derive use_count from paid orders referencing the code
      // (plus this one) so re-running side effects never double counts.
      const { count } = await admin
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("discount_code_id", order.discount_code_id)
        .or(
          `id.eq.${order.id},status.in.(${COUNTED_ORDER_STATUSES.join(",")})`,
        );
      const useCount = count ?? 0;
      const patch: Record<string, unknown> = { use_count: useCount };
      if (useCount >= maxUses) {
        patch.used_at = new Date().toISOString();
        patch.order_id = order.id;
      }
      await admin
        .from("discount_codes")
        .update(patch)
        .eq("id", order.discount_code_id);
    }
  }

  const discountInr = order.discount_inr ?? 0;
  if (order.user_id && discountInr > 0) {
    const { data: existing } = await admin
      .from("flo_savings_ledger")
      .select("id")
      .eq("order_id", order.id)
      .limit(1)
      .maybeSingle();
    if (!existing) {
      await admin.from("flo_savings_ledger").insert({
        user_id: order.user_id,
        order_id: order.id,
        membership_id: order.membership_id,
        source:
          order.discount_source === "none" || !order.discount_source
            ? "other"
            : order.discount_source,
        amount_inr: discountInr,
        note: "Order discount saved",
      });
    }
  }

  await decrementStockForPaidOrder(order.id);
  await sendOrderConfirmationForOrder(order.id);
}

/** Idempotent stock decrement via RPC (falls back to client-side once). */
async function decrementStockForPaidOrder(orderId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const { error } = await admin.rpc("decrement_stock_for_order", {
    p_order_id: orderId,
  });
  if (!error) return;

  console.warn(
    "[stock] decrement_stock_for_order RPC unavailable — using fallback:",
    error.message,
  );

  try {
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("stock_decremented_at")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !order || order.stock_decremented_at) return;

    const { data: items } = await admin
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

    for (const item of items ?? []) {
      const { data: product } = await admin
        .from("products")
        .select("stock_qty")
        .eq("id", item.product_id)
        .maybeSingle();
      if (!product || typeof product.stock_qty !== "number") continue;
      const next = Math.max(0, product.stock_qty - item.quantity);
      await admin
        .from("products")
        .update({ stock_qty: next })
        .eq("id", item.product_id);
    }

    await admin
      .from("orders")
      .update({ stock_decremented_at: new Date().toISOString() })
      .eq("id", orderId)
      .is("stock_decremented_at", null);
  } catch (err) {
    console.error("[stock] Fallback decrement failed:", err);
  }
}

export type OrderConfirmationSendResult =
  | { ok: true; skipped?: boolean; alreadySent?: boolean; id?: string }
  | { ok: false; error: string };

export type OrderStatusEmailSendResult =
  | { ok: true; skipped?: boolean; alreadySent?: boolean; id?: string }
  | { ok: false; error: string };

/**
 * Shipped / delivered notice via Resend.
 * Idempotent by default (skips when shipped_email_sent_at / delivered_email_sent_at is set).
 * Soft-skips when RESEND_API_KEY is missing.
 */
export async function sendOrderStatusEmailForOrder(
  orderId: string,
  kind: "shipped" | "delivered",
  opts?: { force?: boolean },
): Promise<OrderStatusEmailSendResult> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "Admin client unavailable" };
  }

  const flagColumn =
    kind === "shipped" ? "shipped_email_sent_at" : "delivered_email_sent_at";

  try {
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select(
        `id, order_number, customer_name, customer_email, tracking_number, ${flagColumn}`,
      )
      .eq("id", orderId)
      .maybeSingle();

    let row:
      | {
          id: string;
          order_number: string;
          customer_name: string | null;
          customer_email: string;
          tracking_number: string | null;
          shipped_email_sent_at?: string | null;
          delivered_email_sent_at?: string | null;
        }
      | null = order;

    if (orderErr || !order) {
      const { data: fallback } = await admin
        .from("orders")
        .select(
          "id, order_number, customer_name, customer_email, tracking_number",
        )
        .eq("id", orderId)
        .maybeSingle();
      if (!fallback) {
        return { ok: false, error: "Order not found" };
      }
      row = {
        ...fallback,
        shipped_email_sent_at: null,
        delivered_email_sent_at: null,
      };
    }

    if (!row) {
      return { ok: false, error: "Order not found" };
    }

    const alreadySent = Boolean(
      kind === "shipped"
        ? row.shipped_email_sent_at
        : row.delivered_email_sent_at,
    );
    if (alreadySent && !opts?.force) {
      return { ok: true, alreadySent: true };
    }

    const to = row.customer_email?.trim();
    if (!to) {
      console.warn(`[email] No customer email for order ${kind}`, orderId);
      return { ok: false, error: "Order has no customer email" };
    }

    const result =
      kind === "shipped"
        ? await sendOrderShippedEmail({
            to,
            customerName: row.customer_name,
            orderNumber: row.order_number,
            trackingNumber: row.tracking_number,
          })
        : await sendOrderDeliveredEmail({
            to,
            customerName: row.customer_name,
            orderNumber: row.order_number,
            trackingNumber: row.tracking_number,
          });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    if (!result.skipped) {
      const { error: flagErr } = await admin
        .from("orders")
        .update({ [flagColumn]: new Date().toISOString() })
        .eq("id", orderId);
      if (flagErr) {
        // Column may be missing before migration 016 — email still sent
        console.warn(
          `[email] Could not set ${flagColumn} (run migration 016?):`,
          flagErr.message,
        );
      }
    }

    return {
      ok: true,
      skipped: result.skipped,
      id: result.id,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : `Order ${kind} email failed`;
    console.error(`[email] Order ${kind} side-effect failed:`, err);
    return { ok: false, error: message };
  }
}

/**
 * Order confirmation via Resend.
 * Idempotent by default (skips when confirmation_email_sent_at is set).
 * Pass `{ force: true }` to resend from admin.
 */
export async function sendOrderConfirmationForOrder(
  orderId: string,
  opts?: { force?: boolean },
): Promise<OrderConfirmationSendResult> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "Admin client unavailable" };
  }

  try {
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_email, total_inr, shipping_address, confirmation_email_sent_at",
      )
      .eq("id", orderId)
      .maybeSingle();

    let row:
      | {
          id: string;
          order_number: string;
          customer_name: string | null;
          customer_email: string;
          total_inr: number;
          shipping_address: unknown;
          confirmation_email_sent_at?: string | null;
        }
      | null = order;

    if (orderErr || !order) {
      // Column may be missing before migration — retry without audit field
      const { data: fallback } = await admin
        .from("orders")
        .select(
          "id, order_number, customer_name, customer_email, total_inr, shipping_address",
        )
        .eq("id", orderId)
        .maybeSingle();
      if (!fallback) {
        return { ok: false, error: "Order not found" };
      }
      row = { ...fallback, confirmation_email_sent_at: null };
    }

    if (!row) {
      return { ok: false, error: "Order not found" };
    }

    const alreadySent = Boolean(row.confirmation_email_sent_at);
    if (alreadySent && !opts?.force) {
      return { ok: true, alreadySent: true };
    }

    const to = row.customer_email?.trim();
    if (!to) {
      console.warn("[email] No customer email for order confirmation", orderId);
      return { ok: false, error: "Order has no customer email" };
    }

    const { data: items } = await admin
      .from("order_items")
      .select("product_name, quantity, line_total_inr")
      .eq("order_id", orderId);

    const shipping =
      row.shipping_address &&
      typeof row.shipping_address === "object" &&
      !Array.isArray(row.shipping_address)
        ? (row.shipping_address as {
            line1?: string;
            line2?: string | null;
            city?: string;
            state?: string;
            pincode?: string;
          })
        : null;

    const result = await sendOrderConfirmationEmail({
      to,
      customerName: row.customer_name,
      orderNumber: row.order_number,
      totalInr: row.total_inr,
      items: (items ?? []).map((i) => ({
        productName: i.product_name,
        quantity: i.quantity,
        lineTotalInr: i.line_total_inr,
      })),
      shippingAddress: shipping,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    if (!result.skipped) {
      await admin
        .from("orders")
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq("id", orderId);
    }

    return {
      ok: true,
      skipped: result.skipped,
      id: result.id,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Order confirmation failed";
    console.error("[email] Order confirmation side-effect failed:", err);
    return { ok: false, error: message };
  }
}

export async function getIntroPlan() {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("flo_circle_plans")
    .select("id, slug, duration_days, price_inr, name")
    .eq("slug", FLO_CIRCLE_INTRO_PLAN_SLUG)
    .eq("is_active", true)
    .maybeSingle();
  if (data) return data;
  const { data: bi } = await admin
    .from("flo_circle_plans")
    .select("id, slug, duration_days, price_inr, name")
    .eq("duration_days", FLO_CIRCLE_INTRO_DAYS)
    .eq("is_active", true)
    .order("price_inr", { ascending: true })
    .limit(1)
    .maybeSingle();
  return bi;
}

export async function ensureMemberProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string };
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data: existing } = await admin
    .from("member_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing;

  const memberId = generateMemberId();
  const { data, error } = await admin
    .from("member_profiles")
    .insert({
      id: user.id,
      member_id: memberId,
      email: user.email ?? null,
      full_name:
        user.user_metadata?.full_name ??
        (user.email ? user.email.split("@")[0] : null),
    })
    .select("*")
    .single();
  if (error) {
    const { data: again } = await admin
      .from("member_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return again;
  }
  return data;
}

export async function getActiveMembership(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("flo_circle_memberships")
    .select("*, flo_circle_plans(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function activateMembership(params: {
  membershipId: string;
  userId: string;
  durationDays: number;
  razorpaySubscriptionId?: string | null;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const started = new Date();
  const duration =
    params.durationDays > 0 ? params.durationDays : FLO_CIRCLE_INTRO_DAYS;
  const ends = addDays(started, duration);
  await admin
    .from("flo_circle_memberships")
    .update({
      status: "active",
      started_at: started.toISOString(),
      ends_at: ends.toISOString(),
      razorpay_subscription_id:
        params.razorpaySubscriptionId ?? undefined,
    })
    .eq("id", params.membershipId);

  await ensureMemberProfile({ id: params.userId });

  const { data: perks } = await admin
    .from("flo_perks")
    .select("id")
    .eq("is_active", true);
  if (perks?.length) {
    await admin.from("flo_member_perks").upsert(
      perks.map((p) => ({
        membership_id: params.membershipId,
        perk_id: p.id,
        unlocked_at: started.toISOString(),
      })),
      { onConflict: "membership_id,perk_id" },
    );
  }

  const { data: existingGift } = await admin
    .from("flo_gifts")
    .select("id")
    .eq("user_id", params.userId)
    .eq("trigger_key", "join")
    .maybeSingle();
  if (!existingGift) {
    await admin.from("flo_gifts").insert({
      user_id: params.userId,
      membership_id: params.membershipId,
      title: "Flo Circle welcome gift",
      kind: "join",
      status: "queued",
      trigger_key: "join",
      notes: "Auto-queued on membership activation",
    });
  }

  // Welcome email (Resend) — silent if key missing; never block activation
  try {
    const { data: membership } = await admin
      .from("flo_circle_memberships")
      .select("welcome_email_sent_at")
      .eq("id", params.membershipId)
      .maybeSingle();

    if (!membership?.welcome_email_sent_at) {
      let profile = await admin
        .from("member_profiles")
        .select("email, full_name, member_id")
        .eq("id", params.userId)
        .maybeSingle()
        .then((r) => r.data);

      let to = profile?.email?.trim() || "";
      if (!to) {
        const { data: authData } = await admin.auth.admin.getUserById(
          params.userId,
        );
        to = authData.user?.email?.trim() || "";
        if (to && !profile?.email) {
          await admin
            .from("member_profiles")
            .update({
              email: to,
              full_name:
                profile?.full_name ||
                authData.user?.user_metadata?.full_name ||
                to.split("@")[0],
            })
            .eq("id", params.userId);
          profile = {
            email: to,
            full_name:
              profile?.full_name ||
              authData.user?.user_metadata?.full_name ||
              to.split("@")[0],
            member_id: profile?.member_id ?? null,
          };
        }
      }

      if (to) {
        const result = await sendFloCircleWelcomeEmail({
          to,
          fullName: profile?.full_name,
          memberId: profile?.member_id,
        });
        if (result.ok && !result.skipped) {
          await admin
            .from("flo_circle_memberships")
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq("id", params.membershipId);
        }
      } else {
        console.warn(
          "[email] No member email for welcome — membership",
          params.membershipId,
        );
      }
    }
  } catch (err) {
    console.error("[email] Welcome email side-effect failed:", err);
  }
}

export async function updateMembershipByRazorpaySub(
  razorpaySubscriptionId: string,
  patch: Record<string, unknown>,
) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin
    .from("flo_circle_memberships")
    .update(patch)
    .eq("razorpay_subscription_id", razorpaySubscriptionId);
  await admin
    .from("flo_subscriptions")
    .update(patch)
    .eq("razorpay_subscription_id", razorpaySubscriptionId);
}

/**
 * Resolve an auth user for guest Flo Circle checkout by email.
 * Prefers an existing account; otherwise creates a confirmed auth user
 * (no password / no invite email) so Forgot password can claim later.
 * Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export async function resolveOrCreateAuthUserByEmail(params: {
  email: string;
  fullName?: string | null;
}): Promise<{ userId: string; created: boolean } | null> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.warn(
      "[auth] SUPABASE_SERVICE_ROLE_KEY missing — cannot resolve/create guest Flo Circle user",
    );
    return null;
  }

  const email = params.email.trim().toLowerCase();
  if (!email) return null;

  const fullName =
    params.fullName?.trim() || email.split("@")[0] || "Flo Circle member";

  const { data: profile } = await admin
    .from("member_profiles")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  if (profile?.id) {
    return { userId: profile.id, created: false };
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      created_via: "guest_checkout_flo_circle",
    },
  });

  if (created?.user?.id) {
    await ensureMemberProfile({
      id: created.user.id,
      email,
      user_metadata: { full_name: fullName },
    });
    return { userId: created.user.id, created: true };
  }

  // Email already registered — look up without sending mail (generateLink does not send).
  const alreadyExists =
    createErr?.message?.toLowerCase().includes("already") ||
    createErr?.status === 422;
  if (alreadyExists) {
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    if (linkData?.user?.id) {
      await ensureMemberProfile({
        id: linkData.user.id,
        email,
        user_metadata: { full_name: fullName },
      });
      return { userId: linkData.user.id, created: false };
    }

    // Last resort: scan first page of auth users
    const { data: listed } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = listed?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );
    if (existing) {
      await ensureMemberProfile({
        id: existing.id,
        email,
        user_metadata: { full_name: fullName },
      });
      return { userId: existing.id, created: false };
    }
  }

  console.error(
    "[auth] resolveOrCreateAuthUserByEmail failed:",
    createErr?.message ?? "unknown",
  );
  return null;
}

/** Attach guest checkout orders (same email, no user_id) to a new/returning account. */
export async function linkGuestOrdersForUser(
  userId: string,
  email?: string | null,
) {
  const admin = getSupabaseAdmin();
  if (!admin || !email) return 0;
  const { data, error } = await admin.rpc("link_guest_orders_for_user", {
    p_user_id: userId,
    p_email: email,
  });
  if (error) {
    const { data: rows } = await admin
      .from("orders")
      .update({ user_id: userId })
      .is("user_id", null)
      .ilike("customer_email", email)
      .select("id");
    return rows?.length ?? 0;
  }
  return typeof data === "number" ? data : 0;
}

export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || DEFAULT_SITE_ORIGIN
  );
}
