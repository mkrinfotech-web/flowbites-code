import { redirect } from "next/navigation";
import { SITE_DOMAIN } from "@/lib/site";
import {
  inviteStaffAction,
  setStaffActiveAction,
  setStaffRoleAction,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { UserPlus } from "lucide-react";

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("id, role, is_active, email")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (me?.role !== "admin") {
    redirect("/admin");
  }

  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;
  const { data } = await client
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .in("role", ["admin", "staff"])
    .order("created_at", { ascending: true });
  const staff = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-flo-maroon">Staff</h1>
          <p className="mt-1 text-sm text-flo-ink/60">
            Invite teammates and manage access. Only admins can elevate roles.
          </p>
        </div>
      </div>

      {params.error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </p>
      ) : null}
      {params.ok ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {params.ok === "invited"
            ? "Invite sent (or existing user elevated)."
            : params.ok === "role"
              ? "Role updated."
              : params.ok === "deactivated"
                ? "Staff deactivated."
                : params.ok === "activated"
                  ? "Staff activated."
                  : "Saved."}
        </p>
      ) : null}

      <form
        action={inviteStaffAction}
        className="mt-6 grid gap-3 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm md:grid-cols-[1fr_1fr_auto_auto]"
      >
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Email
          <input
            name="email"
            type="email"
            required
            placeholder={`teammate@${SITE_DOMAIN}`}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Full name
          <input
            name="fullName"
            placeholder="Optional"
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Role
          <select
            name="role"
            defaultValue="staff"
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 self-end rounded-full bg-flo-pink px-5 py-2.5 text-sm font-bold text-white"
        >
          <UserPlus className="h-4 w-4" /> Invite
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-flo-maroon/10 bg-white/75 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-flo-maroon/10 text-xs uppercase text-flo-maroon/50">
            <tr>
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-flo-maroon/5">
                <td className="px-4 py-3">
                  <p className="font-semibold text-flo-maroon">
                    {s.full_name || "—"}
                  </p>
                  <p className="text-xs text-flo-ink/55">{s.email}</p>
                </td>
                <td className="px-4 py-3 capitalize">{s.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                      s.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <form action={setStaffRoleAction} className="flex gap-1">
                      <input type="hidden" name="userId" value={s.id} />
                      <select
                        name="role"
                        defaultValue={s.role}
                        className="rounded-full border border-flo-maroon/15 bg-flo-soft/40 px-2 py-1 text-xs"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-flo-soft px-3 py-1 text-xs font-bold text-flo-maroon"
                      >
                        Set role
                      </button>
                    </form>
                    <form action={setStaffActiveAction}>
                      <input type="hidden" name="userId" value={s.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={s.is_active ? "false" : "true"}
                      />
                      <ConfirmSubmitButton
                        confirmMessage={
                          s.is_active
                            ? `Deactivate ${s.email}? They will lose admin access.`
                            : `Re-activate ${s.email}?`
                        }
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          s.is_active
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!staff.length ? (
          <p className="p-6 text-sm text-flo-maroon/50">No staff profiles.</p>
        ) : null}
      </div>
    </div>
  );
}
