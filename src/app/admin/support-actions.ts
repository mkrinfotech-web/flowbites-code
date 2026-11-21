"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin-auth";

// Values mirror CHECK constraints in supabase/migrations/015 and 004.
const RETURN_STATUSES = [
  "open",
  "in_progress",
  "approved",
  "rejected",
  "refunded",
  "closed",
] as const;
const TICKET_STATUSES = ["open", "in_progress", "closed"] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateReturnStatusAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (
    !UUID_RE.test(id) ||
    !(RETURN_STATUSES as readonly string[]).includes(status)
  ) {
    redirect("/admin/returns?error=invalid");
  }

  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("return_requests")
    .update({ status })
    .eq("id", id);
  if (error) {
    redirect(`/admin/returns?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/returns");
  revalidatePath("/admin");
  redirect("/admin/returns?saved=1");
}

export async function updateTicketStatusAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (
    !UUID_RE.test(id) ||
    !(TICKET_STATUSES as readonly string[]).includes(status)
  ) {
    redirect("/admin/support?error=invalid");
  }

  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("flo_support_tickets")
    .update({ status })
    .eq("id", id);
  if (error) {
    redirect(`/admin/support?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/support");
  revalidatePath("/admin");
  redirect("/admin/support?saved=1");
}
