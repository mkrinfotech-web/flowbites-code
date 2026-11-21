"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { adminBaseUrl, requireStaff } from "@/lib/admin-auth";
import type { OrderStatus } from "@/lib/admin-utils";
import {
  canTransitionOrderStatus,
  statusForVerifyAction,
} from "@/lib/order-transitions";
import {
  discountCreateSchema,
  forgotPasswordSchema,
  loginSchema,
  mediaDeleteSchema,
  orderStatusSchema,
  orderVerifySchema,
  pageDeleteSchema,
  pageUpsertSchema,
  productCreateSchema,
  productDeleteSchema,
  productUpdateSchema,
  resendOrderConfirmationSchema,
  staffDeactivateSchema,
  staffInviteSchema,
  staffRoleSchema,
  updatePasswordSchema,
} from "@/lib/validations";
import {
  sendOrderConfirmationForOrder,
  sendOrderStatusEmailForOrder,
} from "@/lib/flo-circle-server";
import {
  parseTagList,
  serializeProductContent,
} from "@/lib/product-content";
import type { ProductContent } from "@/lib/data";
import {
  REFUNDABLE_STATUSES,
  formatAdminNote,
  refundOrderPayment,
  restoreStockForOrder,
} from "@/lib/order-refunds";

function safeOrdersReturnTo(
  value: string | undefined,
  fallback: string,
): string {
  if (value && /^\/admin\/orders(?:\/[0-9a-f-]{36})?(?:\?.*)?$/i.test(value)) {
    return value;
  }
  return fallback;
}

export async function loginAction(
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password (min 8 chars)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Login failed." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile?.is_active ||
    !["admin", "staff"].includes(profile.role ?? "")
  ) {
    await supabase.auth.signOut();
    return { error: "No staff access for this account." };
  }

  const next = String(formData.get("next") || "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

function withQuery(url: string, params: Record<string, string | undefined>) {
  const [path, existing] = url.split("?");
  const qs = new URLSearchParams(existing ?? "");
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const out = qs.toString();
  return out ? `${path}?${out}` : path;
}

/**
 * Before moving an order to `refunded`: actually refund the Razorpay payment.
 * Returns an error (abort the status change) or an optional note for admin_notes.
 */
async function refundBeforeStatusChange(
  orderId: string,
  from: OrderStatus,
  to: OrderStatus,
): Promise<{ error?: string; note?: string; refunded?: boolean }> {
  if (to !== "refunded" || from === "refunded") return {};
  const result = await refundOrderPayment(orderId);
  if (!result.ok) {
    return {
      error: `Refund failed - order NOT marked refunded. ${result.error ?? ""}`.trim(),
    };
  }
  if (result.noPayment) {
    return {
      note: "Marked refunded - no online payment on file, nothing sent via Razorpay.",
    };
  }
  if (result.alreadyRefunded) {
    return {
      note: `Payment already refunded on Razorpay (${result.refundId ?? "n/a"}).`,
      refunded: true,
    };
  }
  return {
    note: `Refunded Rs ${result.amountInr} via Razorpay (${result.refundId}).`,
    refunded: true,
  };
}

/** Adds refund notes and cancel metadata to the order update patch. */
function applyStatusPatchExtras(
  patch: Record<string, unknown>,
  ctx: {
    from: OrderStatus;
    to: OrderStatus;
    existingNotes: string | null;
    refundNote?: string;
    staffNote?: string;
  },
) {
  if (ctx.to === "cancelled" && ctx.from !== "cancelled") {
    patch.cancelled_at = new Date().toISOString();
    patch.cancel_reason = ctx.staffNote?.trim() || "Cancelled by staff";
  }
  if (ctx.refundNote) {
    const base =
      typeof patch.admin_notes === "string"
        ? patch.admin_notes
        : ctx.existingNotes;
    patch.admin_notes = formatAdminNote(base, ctx.refundNote);
  }
}

/**
 * After the status row is saved: restore stock on cancel/refund and send
 * shipped/delivered emails. Returns human-readable warnings (never throws).
 */
async function runStatusSideEffects(
  orderId: string,
  from: OrderStatus,
  to: OrderStatus,
  hasPayment: boolean,
): Promise<string[]> {
  const warnings: string[] = [];

  if ((to === "cancelled" || to === "refunded") && from !== to) {
    const stock = await restoreStockForOrder(orderId);
    if (!stock.ok) warnings.push(stock.error || "Stock restore failed");
  }
  if (to === "cancelled" && from !== "cancelled" && hasPayment) {
    warnings.push(
      "Order cancelled but the payment was NOT refunded - use Refund to customer.",
    );
  }

  const kind =
    to === "shipped" && from !== "shipped"
      ? "shipped"
      : to === "delivered" && from !== "delivered"
        ? "delivered"
        : null;
  if (kind) {
    try {
      const res = await sendOrderStatusEmailForOrder(orderId, kind);
      if (!res.ok) {
        warnings.push(`Status saved, but the ${kind} email failed: ${res.error}`);
      }
    } catch (err) {
      console.error(`[email] ${kind} after status change`, err);
      warnings.push(
        `Status saved, but the ${kind} email failed: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }
  return warnings;
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes") || undefined,
    trackingNumber: formData.get("trackingNumber") || undefined,
    returnTo: formData.get("returnTo") || undefined,
  });
  const returnTo = safeOrdersReturnTo(
    parsed.success ? parsed.data.returnTo : undefined,
    "/admin/orders",
  );
  const base = returnTo.split("?")[0] || "/admin/orders";
  if (!parsed.success) {
    redirect(`${base}?error=invalid`);
  }

  const { supabase, user } = await requireStaff();
  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, tracking_number, admin_notes, razorpay_payment_id")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (fetchError || !existing) {
    redirect(
      `${base}?error=${encodeURIComponent(fetchError?.message || "Order not found")}`,
    );
  }

  const from = existing.status as OrderStatus;
  const to = parsed.data.status as OrderStatus;
  const tracking =
    parsed.data.trackingNumber?.trim() ||
    existing.tracking_number?.trim() ||
    "";

  const transition = canTransitionOrderStatus(from, to, {
    trackingNumber: tracking,
  });
  if (!transition.ok) {
    redirect(`${base}?error=${encodeURIComponent(transition.error)}`);
  }

  const refundGuard = await refundBeforeStatusChange(
    parsed.data.orderId,
    from,
    to,
  );
  if (refundGuard.error) {
    redirect(`${base}?error=${encodeURIComponent(refundGuard.error)}`);
  }

  const patch: Record<string, unknown> = {
    status: to,
  };
  if (parsed.data.adminNotes !== undefined) {
    patch.admin_notes = parsed.data.adminNotes;
  }
  if (parsed.data.trackingNumber !== undefined) {
    patch.tracking_number = parsed.data.trackingNumber;
  }
  if (to === "verified" && from !== "verified") {
    patch.verified_at = new Date().toISOString();
    patch.verified_by = user.id;
  }
  if (to === "shipped" && from !== "shipped") {
    patch.shipped_at = new Date().toISOString();
    if (!parsed.data.trackingNumber?.trim() && tracking) {
      patch.tracking_number = tracking;
    }
  }

  applyStatusPatchExtras(patch, {
    from,
    to,
    existingNotes: existing.admin_notes ?? null,
    refundNote: refundGuard.note,
    staffNote: parsed.data.adminNotes,
  });

  const { error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", parsed.data.orderId);

  if (error) {
    redirect(
      `${base}?error=${encodeURIComponent(
        refundGuard.refunded
          ? `Refund was issued (${refundGuard.note}) but saving the status failed: ${error.message}`
          : error.message,
      )}`,
    );
  }

  const warnings = await runStatusSideEffects(
    parsed.data.orderId,
    from,
    to,
    Boolean(existing.razorpay_payment_id),
  );
  const warning = warnings.length ? warnings.join(" ") : undefined;

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin");
  redirect(
    withQuery(returnTo.includes("?") ? returnTo : `${base}?ok=saved`, {
      warning,
    }),
  );
}

/** One-click verify / process / ship / deliver / cancel for staff ops */
export async function verifyOrderAction(formData: FormData): Promise<void> {
  const parsed = orderVerifySchema.safeParse({
    orderId: formData.get("orderId"),
    action: formData.get("action"),
    adminNotes: formData.get("adminNotes") || undefined,
    trackingNumber: formData.get("trackingNumber") || undefined,
    returnTo: formData.get("returnTo") || undefined,
  });
  const returnTo = safeOrdersReturnTo(
    parsed.success ? parsed.data.returnTo : undefined,
    "/admin/orders",
  );
  const base = returnTo.split("?")[0] || "/admin/orders";
  if (!parsed.success) {
    redirect(`${base}?error=invalid`);
  }

  const { supabase, user } = await requireStaff();
  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, tracking_number, admin_notes, razorpay_payment_id")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (fetchError || !existing) {
    redirect(
      `${base}?error=${encodeURIComponent(fetchError?.message || "Order not found")}`,
    );
  }

  const from = existing.status as OrderStatus;
  const to = statusForVerifyAction(parsed.data.action);
  const tracking =
    parsed.data.trackingNumber?.trim() ||
    existing.tracking_number?.trim() ||
    "";

  const transition = canTransitionOrderStatus(from, to, {
    trackingNumber: tracking,
  });
  if (!transition.ok) {
    redirect(`${base}?error=${encodeURIComponent(transition.error)}`);
  }

  const refundGuard = await refundBeforeStatusChange(
    parsed.data.orderId,
    from,
    to,
  );
  if (refundGuard.error) {
    redirect(`${base}?error=${encodeURIComponent(refundGuard.error)}`);
  }

  const patch: Record<string, unknown> = { status: to };

  if (parsed.data.adminNotes !== undefined) {
    patch.admin_notes = parsed.data.adminNotes;
  }
  if (parsed.data.trackingNumber !== undefined) {
    patch.tracking_number = parsed.data.trackingNumber;
  }
  if (to === "verified" && from !== "verified") {
    patch.verified_at = new Date().toISOString();
    patch.verified_by = user.id;
  }
  if (to === "shipped" && from !== "shipped") {
    patch.shipped_at = new Date().toISOString();
    if (!parsed.data.trackingNumber?.trim() && tracking) {
      patch.tracking_number = tracking;
    }
  }

  applyStatusPatchExtras(patch, {
    from,
    to,
    existingNotes: existing.admin_notes ?? null,
    refundNote: refundGuard.note,
    staffNote: parsed.data.adminNotes,
  });

  const { error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", parsed.data.orderId);

  if (error) {
    redirect(
      `${base}?error=${encodeURIComponent(
        refundGuard.refunded
          ? `Refund was issued (${refundGuard.note}) but saving the status failed: ${error.message}`
          : error.message,
      )}`,
    );
  }

  const warnings = await runStatusSideEffects(
    parsed.data.orderId,
    from,
    to,
    Boolean(existing.razorpay_payment_id),
  );
  const warning = warnings.length ? warnings.join(" ") : undefined;

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin");
  redirect(withQuery(`${base}?ok=${parsed.data.action}`, { warning }));
}

/** Staff "Refund to customer": real Razorpay refund, then mark refunded when allowed. */
export async function refundOrderAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "");
  const returnTo = safeOrdersReturnTo(
    String(formData.get("returnTo") ?? "") || undefined,
    "/admin/orders",
  );
  const base = returnTo.split("?")[0] || "/admin/orders";
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    redirect(`${base}?error=invalid`);
  }

  const { supabase } = await requireStaff();
  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, admin_notes, razorpay_payment_id")
    .eq("id", orderId)
    .maybeSingle();
  if (fetchError || !existing) {
    redirect(
      `${base}?error=${encodeURIComponent(fetchError?.message || "Order not found")}`,
    );
  }

  const from = existing.status as OrderStatus;
  if (
    from !== "refunded" &&
    !(REFUNDABLE_STATUSES as readonly string[]).includes(from)
  ) {
    redirect(
      `${base}?error=${encodeURIComponent(`Order is "${from}" - nothing to refund.`)}`,
    );
  }
  if (!existing.razorpay_payment_id) {
    redirect(
      `${base}?error=${encodeURIComponent("No Razorpay payment on this order - nothing to refund.")}`,
    );
  }

  const result = await refundOrderPayment(orderId);
  if (!result.ok) {
    redirect(
      `${base}?error=${encodeURIComponent(`Refund failed. ${result.error ?? ""}`.trim())}`,
    );
  }

  const noteLine = result.alreadyRefunded
    ? `Payment already refunded on Razorpay (${result.refundId ?? "n/a"}).`
    : `Refunded Rs ${result.amountInr} via Razorpay (${result.refundId}).`;
  const patch: Record<string, unknown> = {
    admin_notes: formatAdminNote(existing.admin_notes ?? null, noteLine),
  };
  // cancelled -> refunded is not a legal transition; keep status, note the refund.
  const canMark =
    from !== "refunded" && canTransitionOrderStatus(from, "refunded").ok;
  if (canMark) patch.status = "refunded";

  const { error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId);
  if (error) {
    redirect(
      `${base}?error=${encodeURIComponent(`Refund was issued (${result.refundId ?? "n/a"}) but saving the order failed: ${error.message}`)}`,
    );
  }

  const warnings: string[] = [];
  if (canMark) {
    const stock = await restoreStockForOrder(orderId);
    if (!stock.ok) warnings.push(stock.error || "Stock restore failed");
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  redirect(
    withQuery(`${base}?ok=refunded`, {
      warning: warnings.length ? warnings.join(" ") : undefined,
    }),
  );
}

/** Force-resend the shipped / delivered customer email and surface failures. */
export async function resendOrderStatusEmailAction(
  formData: FormData,
): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const returnTo = safeOrdersReturnTo(
    String(formData.get("returnTo") ?? "") || undefined,
    "/admin/orders",
  );
  const base = returnTo.split("?")[0] || "/admin/orders";
  if (
    !/^[0-9a-f-]{36}$/i.test(orderId) ||
    (kind !== "shipped" && kind !== "delivered")
  ) {
    redirect(`${base}?error=invalid`);
  }

  await requireStaff();

  let result: Awaited<ReturnType<typeof sendOrderStatusEmailForOrder>>;
  try {
    result = await sendOrderStatusEmailForOrder(orderId, kind, { force: true });
  } catch (err) {
    result = {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
  if (!result.ok) {
    redirect(
      `${base}?error=${encodeURIComponent(`${kind} email failed: ${result.error}`)}`,
    );
  }

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(
    `${base}?ok=${result.skipped ? "email-skipped" : `${kind}-email-resent`}`,
  );
}

export async function resendOrderConfirmationAction(
  formData: FormData,
): Promise<void> {
  const forceRaw = formData.get("force");
  const parsed = resendOrderConfirmationSchema.safeParse({
    orderId: formData.get("orderId"),
    force:
      forceRaw === null || forceRaw === undefined || forceRaw === ""
        ? true
        : forceRaw === "true" || forceRaw === "on" || forceRaw === "1",
    returnTo: formData.get("returnTo") || undefined,
  });
  const returnTo = safeOrdersReturnTo(
    parsed.success ? parsed.data.returnTo : undefined,
    "/admin/orders",
  );
  const base = returnTo.split("?")[0] || "/admin/orders";
  if (!parsed.success) {
    redirect(`${base}?error=invalid`);
  }

  await requireStaff();

  const result = await sendOrderConfirmationForOrder(parsed.data.orderId, {
    force: parsed.data.force,
  });

  if (!result.ok) {
    redirect(`${base}?error=${encodeURIComponent(result.error)}`);
  }
  if (result.alreadySent) {
    redirect(`${base}?ok=email-already-sent`);
  }
  if (result.skipped) {
    redirect(`${base}?ok=email-skipped`);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  redirect(`${base}?ok=email-resent`);
}

export async function updateProductAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = productUpdateSchema.safeParse({
    id: formData.get("id"),
    priceInr: Number(formData.get("priceInr")),
    stockQty: Number(formData.get("stockQty")),
    imagePath: formData.get("imagePath"),
    isActive:
      formData.get("isActive") === "on" || formData.get("isActive") === "true",
    name: formData.get("name") || undefined,
    sortOrder:
      formData.get("sortOrder") !== null && formData.get("sortOrder") !== ""
        ? Number(formData.get("sortOrder"))
        : undefined,
    edition: formData.get("edition") || undefined,
    tagline: formData.get("tagline") || null,
    description: formData.get("description") || undefined,
    packLabel: formData.get("packLabel") || undefined,
    descriptionFormal: formData.get("descriptionFormal") ?? undefined,
    descriptionPunchy: formData.get("descriptionPunchy") ?? undefined,
    nutritionSummary: formData.get("nutritionSummary") ?? undefined,
    nutritionBullets: formData.get("nutritionBullets") ?? undefined,
    nutritionDisclaimer: formData.get("nutritionDisclaimer") ?? undefined,
    ingredientsList: formData.get("ingredientsList") ?? undefined,
    footerContains: formData.get("footerContains") ?? undefined,
    footerNote: formData.get("footerNote") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "Invalid product details." };
  }

  const { supabase } = await requireStaff();
  const patch: Record<string, unknown> = {
    price_inr: parsed.data.priceInr,
    stock_qty: parsed.data.stockQty,
    image_path: parsed.data.imagePath,
    is_active: parsed.data.isActive,
  };
  if (parsed.data.name) patch.name = parsed.data.name;
  if (parsed.data.sortOrder !== undefined) {
    patch.sort_order = parsed.data.sortOrder;
  }
  if (parsed.data.edition) patch.edition = parsed.data.edition;
  if (parsed.data.tagline !== undefined) patch.tagline = parsed.data.tagline;
  if (parsed.data.description) patch.description = parsed.data.description;
  if (parsed.data.packLabel) patch.pack_label = parsed.data.packLabel;

  const contentFieldsPresent =
    formData.has("descriptionFormal") ||
    formData.has("descriptionPunchy") ||
    formData.has("nutritionSummary") ||
    formData.has("nutritionBullets") ||
    formData.has("nutritionDisclaimer") ||
    formData.has("ingredientsList") ||
    formData.has("footerContains") ||
    formData.has("footerNote");

  if (contentFieldsPresent) {
    const content: ProductContent = {
      descriptionFormal: (parsed.data.descriptionFormal ?? "").trim(),
      descriptionPunchy: (parsed.data.descriptionPunchy ?? "").trim(),
      nutritionSummary: (parsed.data.nutritionSummary ?? "").trim(),
      nutritionBullets: parseTagList(parsed.data.nutritionBullets ?? ""),
      nutritionDisclaimer: (parsed.data.nutritionDisclaimer ?? "").trim(),
      ingredients: parseTagList(parsed.data.ingredientsList ?? ""),
      footerContains: parseTagList(parsed.data.footerContains ?? ""),
      footerNote: (parsed.data.footerNote ?? "").trim(),
    };
    patch.content = serializeProductContent(content);
    if (content.descriptionFormal) {
      patch.description = content.descriptionFormal;
    }
  }

  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/product", "layout");
  return {};
}

export async function createProductAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = productCreateSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    tagline: formData.get("tagline") || null,
    description: formData.get("description"),
    packLabel: formData.get("packLabel") || "Pack of 6",
    priceInr: Number(formData.get("priceInr")),
    stockQty: Number(formData.get("stockQty") || 0),
    imagePath: formData.get("imagePath"),
    badge: formData.get("badge") || null,
    shelfColor: formData.get("shelfColor") || null,
    isActive:
      formData.get("isActive") === "on" || formData.get("isActive") === "true",
    sortOrder: Number(formData.get("sortOrder") || 0),
    edition: formData.get("edition") || "flo",
  });
  if (!parsed.success) {
    return { error: "Invalid product details." };
  }

  const { supabase } = await requireStaff();
  const { error } = await supabase.from("products").insert({
    slug: parsed.data.slug,
    name: parsed.data.name,
    tagline: parsed.data.tagline,
    description: parsed.data.description,
    pack_label: parsed.data.packLabel,
    price_inr: parsed.data.priceInr,
    stock_qty: parsed.data.stockQty,
    image_path: parsed.data.imagePath,
    badge: parsed.data.badge,
    shelf_color: parsed.data.shelfColor || "#fa3558",
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder,
    edition: parsed.data.edition,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function inviteStaffAction(
  formData: FormData,
): Promise<void> {
  const parsed = staffInviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") || "staff",
    fullName: formData.get("fullName") || undefined,
  });
  if (!parsed.success) {
    redirect("/admin/staff?error=invalid");
  }

  await requireStaff({ role: "admin" });
  const admin = getSupabaseAdmin();
  if (!admin) {
    redirect("/admin/staff?error=service_role_missing");
  }

  const email = parsed.data.email.toLowerCase();
  const redirectTo = `${adminBaseUrl()}/auth/confirm?next=/admin/update-password`;

  // Prefer elevating an existing profile over re-inviting
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, email, role")
    .ilike("email", email)
    .maybeSingle();

  let userId = existingProfile?.id as string | undefined;

  if (!userId) {
    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          full_name: parsed.data.fullName || undefined,
        },
      });

    userId = invited?.user?.id;

    if (inviteError || !userId) {
      // Fallback: scan recent auth users (existing account without profile)
      const { data: listed } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const existing = listed?.users?.find(
        (u) => u.email?.toLowerCase() === email,
      );
      if (!existing) {
        redirect(
          `/admin/staff?error=${encodeURIComponent(inviteError?.message || "Invite failed")}`,
        );
      }
      userId = existing.id;
    }
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: parsed.data.fullName || null,
      role: parsed.data.role,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    redirect(
      `/admin/staff?error=${encodeURIComponent(profileError.message)}`,
    );
  }

  revalidatePath("/admin/staff");
  redirect("/admin/staff?ok=invited");
}

export async function setStaffRoleAction(formData: FormData): Promise<void> {
  const parsed = staffRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    redirect("/admin/staff?error=invalid");
  }

  const { user } = await requireStaff({ role: "admin" });
  if (parsed.data.userId === user.id && parsed.data.role !== "admin") {
    redirect("/admin/staff?error=cannot_demote_self");
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    redirect("/admin/staff?error=service_role_missing");
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId)
    .in("role", ["admin", "staff"]);

  if (error) {
    redirect(`/admin/staff?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/staff");
  redirect("/admin/staff?ok=role");
}

export async function setStaffActiveAction(formData: FormData): Promise<void> {
  const parsed = staffDeactivateSchema.safeParse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    redirect("/admin/staff?error=invalid");
  }

  const { user } = await requireStaff({ role: "admin" });
  if (parsed.data.userId === user.id && !parsed.data.isActive) {
    redirect("/admin/staff?error=cannot_deactivate_self");
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    redirect("/admin/staff?error=service_role_missing");
  }

  const { error } = await admin
    .from("profiles")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.userId)
    .in("role", ["admin", "staff"]);

  if (error) {
    redirect(`/admin/staff?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/staff");
  redirect(
    `/admin/staff?ok=${parsed.data.isActive ? "activated" : "deactivated"}`,
  );
}

export async function upsertPageAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const parsed = pageUpsertSchema.safeParse({
    id: id && String(id).length > 0 ? id : undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    type: formData.get("type"),
    bodyMd: formData.get("bodyMd") ?? "",
    seoTitle: formData.get("seoTitle") || null,
    seoDescription: formData.get("seoDescription") || null,
    isPublished:
      formData.get("isPublished") === "on" ||
      formData.get("isPublished") === "true",
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  if (!parsed.success) {
    redirect("/admin/pages?error=invalid");
  }

  const { supabase, user } = await requireStaff();
  const row = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    type: parsed.data.type,
    body_md: parsed.data.bodyMd,
    seo_title: parsed.data.seoTitle,
    seo_description: parsed.data.seoDescription,
    is_published: parsed.data.isPublished,
    sort_order: parsed.data.sortOrder,
    updated_by: user.id,
    published_at: parsed.data.isPublished ? new Date().toISOString() : null,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("pages")
      .update(row)
      .eq("id", parsed.data.id);
    if (error) {
      redirect(`/admin/pages?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await supabase.from("pages").insert(row);
    if (error) {
      redirect(`/admin/pages?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/${parsed.data.slug}`);
  redirect("/admin/pages");
}

export async function createDiscountAction(formData: FormData): Promise<void> {
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();
  const expiresRaw = String(formData.get("expiresAt") || "");
  const expiresAt = expiresRaw.includes("T")
    ? new Date(expiresRaw).toISOString()
    : new Date(`${expiresRaw}T23:59:59.000Z`).toISOString();

  const maxUsesRaw = formData.get("maxUses");
  const parsed = discountCreateSchema.safeParse({
    code,
    percentOff: Number(formData.get("percentOff")),
    maxUses:
      maxUsesRaw && String(maxUsesRaw).length > 0 ? Number(maxUsesRaw) : null,
    expiresAt,
    isActive: true,
  });
  if (!parsed.success) {
    redirect("/admin/discounts?error=invalid");
  }

  const { supabase, user } = await requireStaff();
  const { error } = await supabase.from("discount_codes").insert({
    code: parsed.data.code,
    percent_off: parsed.data.percentOff,
    max_uses: parsed.data.maxUses,
    expires_at: parsed.data.expiresAt,
    is_active: parsed.data.isActive,
    kind: "manual",
    loved_name: null,
    session_id: null,
    created_by: user.id,
  });

  if (error) {
    redirect(`/admin/discounts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function toggleDiscountAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const isActive = formData.get("isActive") === "true";
  if (!id) redirect("/admin/discounts?error=missing");

  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("discount_codes")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    redirect(`/admin/discounts?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function adminForgotPasswordAction(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: "Enter a valid email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${adminBaseUrl()}/auth/confirm?next=/admin/update-password`,
    },
  );
  if (error) return { error: error.message };
  return { ok: true };
}

export async function adminUpdatePasswordAction(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Open the reset link from your email first." };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteProductAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = productDeleteSchema.safeParse({
    id: formData.get("id"),
    mode: formData.get("mode") || "soft",
  });
  if (!parsed.success) return { error: "Invalid product." };

  const { supabase } = await requireStaff({ role: "admin" });

  if (parsed.data.mode === "hard") {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", parsed.data.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", parsed.data.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function deletePageAction(formData: FormData): Promise<void> {
  const parsed = pageDeleteSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    redirect("/admin/pages?error=invalid");
  }

  const { supabase } = await requireStaff({ role: "admin" });
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    redirect(`/admin/pages?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/pages");
  if (page?.slug) revalidatePath(`/${page.slug}`);
  redirect("/admin/pages?ok=deleted");
}

export async function deleteMediaObjectAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = mediaDeleteSchema.safeParse({
    bucket: formData.get("bucket"),
    path: formData.get("path"),
  });
  if (!parsed.success) return { error: "Invalid media target." };

  const { supabase } = await requireStaff();
  const { error } = await supabase.storage
    .from(parsed.data.bucket)
    .remove([parsed.data.path]);

  if (error) return { error: error.message };

  if (parsed.data.bucket === "media") {
    await supabase
      .from("media_assets")
      .delete()
      .eq("bucket", parsed.data.bucket)
      .eq("path", parsed.data.path);
  }

  revalidatePath("/admin/media");
  return {};
}
