import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/lib/admin-utils";

export type StaffProfile = {
  id: string;
  role: StaffRole;
  is_active: boolean;
  email: string;
  full_name: string | null;
};

type RequireStaffOpts = {
  /** When `"admin"`, only admins pass. Defaults to any active staff/admin. */
  role?: "admin";
};

/**
 * Server-action guard for admin routes.
 * Use `requireStaff({ role: "admin" })` for elevate / delete / staff management.
 */
export async function requireStaff(opts?: RequireStaffOpts) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Unauthorized");
  }

  if (opts?.role === "admin" && profile.role !== "admin") {
    throw new Error("Admin only");
  }

  return {
    supabase,
    user,
    profile: profile as StaffProfile,
  };
}

export function adminBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, "") ||
    "http://admin.localhost:3000"
  );
}
