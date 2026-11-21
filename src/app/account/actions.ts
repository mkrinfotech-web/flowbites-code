"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  customerSignupSchema,
  forgotPasswordSchema,
  loginSchema,
  profileUpdateSchema,
  updatePasswordSchema,
} from "@/lib/validations";
import {
  appBaseUrl,
  ensureMemberProfile,
  linkGuestOrdersForUser,
} from "@/lib/flo-circle-server";
import { safeRedirectPath } from "@/lib/utils";

export async function customerLoginAction(
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
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error.message) };

  if (data.user) {
    await linkGuestOrdersForUser(data.user.id, data.user.email ?? parsed.data.email);
  }

  const next = safeRedirectPath(String(formData.get("next") || ""), "/account");
  redirect(next);
}

function authErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox for a FloBites message, then sign in.";
  }
  return message;
}

export async function customerSignupAction(
  formData: FormData,
): Promise<{ error: string } | { needsConfirm: true } | undefined> {
  const parsed = customerSignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { error: "Check your details and try again." };
  }

  const next = safeRedirectPath(String(formData.get("next") || ""), "/account");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appBaseUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
      data: {
        full_name: parsed.data.fullName,
        // Never send elevating roles — DB trigger always inserts customer.
      },
    },
  });
  if (error) return { error: authErrorMessage(error.message) };

  if (data.user) {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("profiles").upsert({
        id: data.user.id,
        email: parsed.data.email,
        full_name: parsed.data.fullName,
        role: "customer",
        is_active: true,
      });
      await ensureMemberProfile({
        id: data.user.id,
        email: parsed.data.email,
        user_metadata: { full_name: parsed.data.fullName },
      });
      if (parsed.data.phone) {
        await admin
          .from("member_profiles")
          .update({ phone: parsed.data.phone })
          .eq("id", data.user.id);
      }
    }
    await linkGuestOrdersForUser(data.user.id, parsed.data.email);
  }

  // Confirm-email ON: Auth sends the confirm message (Custom SMTP → Resend).
  // There is no session until they click the link — do not dump them on /account.
  if (!data.session) {
    return { needsConfirm: true };
  }

  redirect(next);
}

export async function resendSignupConfirmationAction(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Enter a valid email." };

  const next = safeRedirectPath(String(formData.get("next") || ""), "/account");
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${appBaseUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: authErrorMessage(error.message) };
  return { ok: true };
}

export async function customerLogoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/account/login");
}

export async function forgotPasswordAction(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: "Enter a valid email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appBaseUrl()}/auth/confirm?next=/account/update-password`,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function updatePasswordAction(
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

export async function updateProfileAction(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = profileUpdateSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || null,
    addressLine1: formData.get("addressLine1") || "",
    addressLine2: formData.get("addressLine2") || "",
    city: formData.get("city") || "",
    state: formData.get("state") || "",
    pincode: formData.get("pincode") || "",
  });
  if (!parsed.success) return { error: "Check your details and try again." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required" };

  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server error" };

  await ensureMemberProfile(user);
  await admin
    .from("member_profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
    })
    .eq("id", user.id);
  await admin
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  const hasAddress =
    parsed.data.addressLine1 &&
    parsed.data.city &&
    parsed.data.state &&
    parsed.data.pincode &&
    /^\d{6}$/.test(parsed.data.pincode);

  if (hasAddress) {
    const { data: existing } = await admin
      .from("member_addresses")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle();

    const addressPayload = {
      label: "Home",
      line1: parsed.data.addressLine1!,
      line2: parsed.data.addressLine2 || null,
      city: parsed.data.city!,
      state: parsed.data.state!,
      pincode: parsed.data.pincode!,
      is_default: true,
    };

    if (existing) {
      await admin
        .from("member_addresses")
        .update(addressPayload)
        .eq("id", existing.id);
    } else {
      await admin.from("member_addresses").insert({
        user_id: user.id,
        ...addressPayload,
      });
    }
  }

  return { ok: true };
}
