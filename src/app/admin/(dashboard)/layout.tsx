import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.is_active !== true ||
    (profile.role !== "admin" && profile.role !== "staff")
  ) {
    redirect("/account");
  }

  return (
    <AdminShell email={profile.email} role={profile.role}>
      {children}
    </AdminShell>
  );
}
