"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin-auth";
import { addDays } from "@/lib/flo-circle";
import { getRazorpay } from "@/lib/razorpay";
import {
  adminSubscriptionActionSchema,
  eventDeleteSchema,
  eventUpsertSchema,
  floPlanUpsertSchema,
  giftStatusSchema,
  launchDeleteSchema,
  launchUpsertSchema,
  memberAdminNotesSchema,
  memberDiscountTimingSchema,
  memberStatusUpdateSchema,
} from "@/lib/validations";

function failTo(base: string, message: string): never {
  redirect(`${base}?error=${encodeURIComponent(message)}`);
}

function razorpayErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { error?: { description?: string }; message?: string };
    if (e.error?.description) return e.error.description;
    if (e.message) return e.message;
  }
  return "Razorpay request failed";
}

/** Mirror a membership status change to its Razorpay subscription. Returns an error message or null. */
async function syncRazorpaySubscription(
  subscriptionId: string,
  action: "cancel" | "pause" | "resume",
): Promise<string | null> {
  const razorpay = getRazorpay();
  if (!razorpay) return "Razorpay is not configured; cannot update the live subscription.";
  try {
    if (action === "cancel") {
      await razorpay.subscriptions.cancel(subscriptionId, false);
    } else if (action === "pause") {
      await razorpay.subscriptions.pause(subscriptionId, { pause_at: "now" });
    } else {
      await razorpay.subscriptions.resume(subscriptionId, { resume_at: "now" });
    }
    return null;
  } catch (err) {
    return `Razorpay: ${razorpayErrorMessage(err)}`;
  }
}

export async function upsertFloPlanAction(formData: FormData) {
  const parsed = floPlanUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description") || "",
    durationDays: Number(formData.get("durationDays")),
    priceInr: Number(formData.get("priceInr")),
    razorpayPlanId: formData.get("razorpayPlanId") || null,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  if (!parsed.success) return failTo("/admin/flo-circle/plans", "Invalid plan");
  const { supabase } = await requireStaff();
  const row = {
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description,
    duration_days: parsed.data.durationDays,
    price_inr: parsed.data.priceInr,
    razorpay_plan_id: parsed.data.razorpayPlanId,
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder,
  };
  const { error } = parsed.data.id
    ? await supabase.from("flo_circle_plans").update(row).eq("id", parsed.data.id)
    : await supabase.from("flo_circle_plans").insert(row);
  if (error) return failTo("/admin/flo-circle/plans", error.message);
  revalidatePath("/admin/flo-circle/plans");
  revalidatePath("/admin/flo-circle");
}

export async function updateGiftStatusAction(formData: FormData) {
  const parsed = giftStatusSchema.safeParse({
    giftId: formData.get("giftId"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return failTo("/admin/flo-circle/gifts", "Invalid gift");
  const { supabase, user } = await requireStaff();
  const { error } = await supabase
    .from("flo_gifts")
    .update({
      status: parsed.data.status,
      notes: parsed.data.notes,
      assigned_by: user.id,
      shipped_at:
        parsed.data.status === "shipped" ? new Date().toISOString() : undefined,
    })
    .eq("id", parsed.data.giftId);
  if (error) return failTo("/admin/flo-circle/gifts", error.message);
  revalidatePath("/admin/flo-circle/gifts");
}

export async function upsertEventAction(formData: FormData) {
  const parsed = eventUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    descriptionMd: formData.get("descriptionMd") || "",
    eventAt: formData.get("eventAt"),
    location: formData.get("location") || null,
    isPublished:
      formData.get("isPublished") === "on" ||
      formData.get("isPublished") === "true",
    maxRsvp: formData.get("maxRsvp")
      ? Number(formData.get("maxRsvp"))
      : null,
  });
  if (!parsed.success) return failTo("/admin/flo-circle/events", "Invalid event");
  const { supabase } = await requireStaff();
  const row = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    description_md: parsed.data.descriptionMd,
    event_at: parsed.data.eventAt,
    location: parsed.data.location,
    is_published: parsed.data.isPublished,
    max_rsvp: parsed.data.maxRsvp,
  };
  const { error } = parsed.data.id
    ? await supabase.from("flo_events").update(row).eq("id", parsed.data.id)
    : await supabase.from("flo_events").insert(row);
  if (error) return failTo("/admin/flo-circle/events", error.message);
  revalidatePath("/admin/flo-circle/events");
}

export async function deleteEventAction(formData: FormData) {
  const parsed = eventDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return failTo("/admin/flo-circle/events", "Invalid event");
  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("flo_events")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failTo("/admin/flo-circle/events", error.message);
  revalidatePath("/admin/flo-circle/events");
}

export async function upsertLaunchAction(formData: FormData) {
  const parsed = launchUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    teaser: formData.get("teaser") || null,
    bodyMd: formData.get("bodyMd") || "",
    goesLiveAt: formData.get("goesLiveAt") || null,
    isPublished:
      formData.get("isPublished") === "on" ||
      formData.get("isPublished") === "true",
    earlyAccessMembersOnly:
      formData.get("earlyAccessMembersOnly") === "on" ||
      formData.get("earlyAccessMembersOnly") === "true",
  });
  if (!parsed.success) return failTo("/admin/flo-circle/events", "Invalid launch");
  const { supabase } = await requireStaff();
  const row = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    teaser: parsed.data.teaser,
    body_md: parsed.data.bodyMd,
    goes_live_at: parsed.data.goesLiveAt,
    is_published: parsed.data.isPublished,
    early_access_members_only: parsed.data.earlyAccessMembersOnly,
  };
  const { error } = parsed.data.id
    ? await supabase.from("flo_launches").update(row).eq("id", parsed.data.id)
    : await supabase.from("flo_launches").insert(row);
  if (error) return failTo("/admin/flo-circle/events", error.message);
  revalidatePath("/admin/flo-circle/events");
}

export async function deleteLaunchAction(formData: FormData) {
  const parsed = launchDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return failTo("/admin/flo-circle/events", "Invalid launch");
  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("flo_launches")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failTo("/admin/flo-circle/events", error.message);
  revalidatePath("/admin/flo-circle/events");
}

export async function updateMemberStatusAction(formData: FormData) {
  const parsed = memberStatusUpdateSchema.safeParse({
    membershipId: formData.get("membershipId"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return failTo("/admin/flo-circle/members", "Invalid membership update");
  const { supabase } = await requireStaff();

  const { data: existing, error: existingError } = await supabase
    .from("flo_circle_memberships")
    .select("status, razorpay_subscription_id")
    .eq("id", parsed.data.membershipId)
    .maybeSingle();
  if (existingError) return failTo("/admin/flo-circle/members", existingError.message);
  if (!existing) return failTo("/admin/flo-circle/members", "Membership not found");

  if (existing.razorpay_subscription_id && existing.status !== parsed.data.status) {
    const rzpAction =
      parsed.data.status === "cancelled"
        ? "cancel"
        : parsed.data.status === "paused"
          ? "pause"
          : parsed.data.status === "active" && existing.status === "paused"
            ? "resume"
            : null;
    if (rzpAction) {
      const rzpError = await syncRazorpaySubscription(
        existing.razorpay_subscription_id,
        rzpAction,
      );
      if (rzpError) return failTo("/admin/flo-circle/members", rzpError);
    }
  }

  const patch: Record<string, unknown> = {
    status: parsed.data.status,
  };
  if (parsed.data.status === "paused") {
    patch.paused_at = new Date().toISOString();
  }
  if (parsed.data.status === "cancelled") {
    patch.cancelled_at = new Date().toISOString();
    if (parsed.data.notes) patch.cancel_reason = parsed.data.notes;
  }
  if (parsed.data.status === "active") {
    patch.paused_at = null;
  }
  // Always store staff note in cancel_reason when pausing with notes
  if (parsed.data.status === "paused" && parsed.data.notes) {
    patch.cancel_reason = parsed.data.notes;
  }

  const { error } = await supabase
    .from("flo_circle_memberships")
    .update(patch)
    .eq("id", parsed.data.membershipId);
  if (error) return failTo("/admin/flo-circle/members", error.message);
  revalidatePath("/admin/flo-circle/members");
  revalidatePath("/admin/flo-circle");
}

/** Append a timestamped staff note to membership admin_notes history. */
export async function appendMemberAdminNoteAction(formData: FormData) {
  const parsed = memberAdminNotesSchema.safeParse({
    membershipId: formData.get("membershipId"),
    note: formData.get("note"),
  });
  if (!parsed.success) return failTo("/admin/flo-circle/members", "Invalid note");
  const { supabase, user, profile } = await requireStaff();

  const { data: row, error: fetchError } = await supabase
    .from("flo_circle_memberships")
    .select("admin_notes")
    .eq("id", parsed.data.membershipId)
    .maybeSingle();
  if (fetchError) return failTo("/admin/flo-circle/members", fetchError.message);
  if (!row) return failTo("/admin/flo-circle/members", "Membership not found");

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const who = profile.email || user.email || user.id.slice(0, 8);
  const line = `[${stamp} · ${who}] ${parsed.data.note}`;
  const next = row.admin_notes?.trim()
    ? `${row.admin_notes.trim()}\n${line}`
    : line;

  const { error } = await supabase
    .from("flo_circle_memberships")
    .update({ admin_notes: next })
    .eq("id", parsed.data.membershipId);
  if (error) return failTo("/admin/flo-circle/members", error.message);
  revalidatePath("/admin/flo-circle/members");
}

export async function updateSubscriptionAction(formData: FormData) {
  const parsed = adminSubscriptionActionSchema.safeParse({
    subscriptionId: formData.get("subscriptionId"),
    action: formData.get("action"),
    cancelReason: formData.get("cancelReason") || undefined,
  });
  if (!parsed.success) return failTo("/admin/flo-circle/subscriptions", "Invalid subscription action");
  const { supabase } = await requireStaff();

  const { data: sub, error: fetchError } = await supabase
    .from("flo_subscriptions")
    .select("*")
    .eq("id", parsed.data.subscriptionId)
    .maybeSingle();
  if (fetchError) return failTo("/admin/flo-circle/subscriptions", fetchError.message);
  if (!sub) return failTo("/admin/flo-circle/subscriptions", "Subscription not found");

  const { action, cancelReason } = parsed.data;

  if (action === "skip") {
    const base = sub.next_ship_at
      ? new Date(sub.next_ship_at)
      : new Date();
    const next = addDays(base, sub.cadence_days);
    const { error } = await supabase
      .from("flo_subscriptions")
      .update({
        status: "active",
        skip_until: next.toISOString(),
        next_ship_at: next.toISOString(),
      })
      .eq("id", sub.id);
    if (error) return failTo("/admin/flo-circle/subscriptions", error.message);
  } else if (action === "pause") {
    const { error } = await supabase
      .from("flo_subscriptions")
      .update({
        status: "paused",
        paused_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
    if (error) return failTo("/admin/flo-circle/subscriptions", error.message);
  } else if (action === "resume") {
    const next = addDays(new Date(), sub.cadence_days);
    const { error } = await supabase
      .from("flo_subscriptions")
      .update({
        status: "active",
        paused_at: null,
        next_ship_at: next.toISOString(),
      })
      .eq("id", sub.id);
    if (error) return failTo("/admin/flo-circle/subscriptions", error.message);
  } else if (action === "cancel") {
    const { error } = await supabase
      .from("flo_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason ?? null,
      })
      .eq("id", sub.id);
    if (error) return failTo("/admin/flo-circle/subscriptions", error.message);
  }

  revalidatePath("/admin/flo-circle/subscriptions");
  revalidatePath("/admin/flo-circle");
}

export async function setStackModeAction(formData: FormData) {
  const mode = String(formData.get("mode") || "best_of_one");
  if (mode !== "best_of_one" && mode !== "stack_all") {
    return failTo("/admin/discounts", "Invalid mode");
  }
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("site_settings").upsert({
    key: "discount_stack_mode",
    value: mode,
    updated_at: new Date().toISOString(),
  });
  if (error) return failTo("/admin/discounts", error.message);
  revalidatePath("/admin/discounts");
  revalidatePath("/admin/flo-circle");
}

export async function setMemberDiscountTimingAction(formData: FormData) {
  const parsed = memberDiscountTimingSchema.safeParse(
    String(formData.get("timing") || "second_order"),
  );
  if (!parsed.success) return failTo("/admin/discounts", "Invalid timing");
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("site_settings").upsert({
    key: "flo_circle_discount_timing",
    value: parsed.data,
    updated_at: new Date().toISOString(),
  });
  if (error) return failTo("/admin/discounts", error.message);
  revalidatePath("/admin/discounts");
  revalidatePath("/admin/flo-circle");
}
