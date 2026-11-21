import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  appendMemberAdminNoteAction,
  updateMemberStatusAction,
} from "@/app/admin/flo-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { daysRemaining } from "@/lib/flo-circle";
import { AdminNotice } from "@/components/admin/admin-notice";

function parseNotesHistory(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default async function FloMembersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; userId?: string }>;
}) {
  const params = await searchParams;
  const emailFilter = params.email?.trim().toLowerCase() || null;
  const userIdFilter = params.userId?.trim() || null;

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("member_profiles")
    .select("id, member_id, email, full_name");
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const baseSelect =
    "id, user_id, status, started_at, ends_at, cancelled_at, cancel_reason, admin_notes, created_at, flo_circle_plans(name, duration_days, price_inr)";

  let rows: Array<{
    id: string;
    user_id: string;
    status: string;
    started_at: string | null;
    ends_at: string | null;
    cancelled_at: string | null;
    cancel_reason: string | null;
    admin_notes: string | null;
    created_at: string;
    flo_circle_plans: {
      name?: string;
      duration_days?: number;
      price_inr?: number;
    } | null;
  }> = [];

  if (userIdFilter) {
    const { data } = await supabase
      .from("flo_circle_memberships")
      .select(baseSelect)
      .eq("user_id", userIdFilter)
      .order("created_at", { ascending: false })
      .limit(100);
    rows = (data as typeof rows) ?? [];
  } else if (emailFilter) {
    const matchedIds = (profiles ?? [])
      .filter((p) => p.email?.toLowerCase() === emailFilter)
      .map((p) => p.id);
    if (matchedIds.length) {
      const { data } = await supabase
        .from("flo_circle_memberships")
        .select(baseSelect)
        .in("user_id", matchedIds)
        .order("created_at", { ascending: false })
        .limit(100);
      rows = (data as typeof rows) ?? [];
    }
  } else {
    const { data } = await supabase
      .from("flo_circle_memberships")
      .select(baseSelect)
      .order("created_at", { ascending: false })
      .limit(100);
    rows = (data as typeof rows) ?? [];
  }

  return (
    <div>
      <AdminNotice />
      <h1 className="text-2xl font-bold text-flo-maroon">Members</h1>
      <p className="mt-1 text-sm text-flo-maroon/60">
        Soft retail CRM — plan, status, days left, notes, and order links.
        {emailFilter ? ` · filtered by ${emailFilter}` : ""}
        {userIdFilter ? ` · user ${userIdFilter.slice(0, 8)}…` : ""}
      </p>
      <div className="mt-6 space-y-4">
        {rows.map((m) => {
          const p = profileMap.get(m.user_id);
          const plan = m.flo_circle_plans;
          const days = daysRemaining(m.ends_at);
          const notes = parseNotesHistory(m.admin_notes);
          const ordersHref = p?.email
            ? `/admin/orders?email=${encodeURIComponent(p.email)}`
            : `/admin/orders?userId=${encodeURIComponent(m.user_id)}`;

          return (
            <article
              key={m.id}
              className="rounded-2xl border border-flo-maroon/10 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-flo-maroon">
                    {p?.full_name ?? "—"}
                  </p>
                  <p className="font-mono text-xs text-flo-pink">
                    {p?.member_id ?? m.user_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-flo-maroon/60">
                    {p?.email ?? "No email on profile"}
                  </p>
                  <p className="mt-2 text-sm text-flo-ink/75">
                    <span className="font-medium">{plan?.name ?? "—"}</span>
                    {" · "}
                    <span className="capitalize">{m.status}</span>
                    {days !== null ? (
                      <>
                        {" · "}
                        <span className="font-semibold text-flo-pink">
                          {days}d left
                        </span>
                      </>
                    ) : null}
                    {m.ends_at
                      ? ` · ends ${new Date(m.ends_at).toLocaleDateString("en-IN")}`
                      : ""}
                  </p>
                  {m.cancel_reason ? (
                    <p className="mt-1 text-xs text-flo-ink/50">
                      Cancel / pause note: {m.cancel_reason}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={ordersHref}
                  className="rounded-full bg-flo-cream px-3 py-1.5 text-xs font-bold text-flo-maroon"
                >
                  View orders
                </Link>
              </div>

              {notes.length > 0 ? (
                <div className="mt-3 rounded-xl bg-flo-cream/60 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-flo-maroon/45">
                    Notes history
                  </p>
                  <ul className="mt-1 space-y-1">
                    {notes.map((line, i) => (
                      <li
                        key={`${m.id}-note-${i}`}
                        className="text-xs text-flo-ink/70"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <form
                action={appendMemberAdminNoteAction}
                className="mt-3 flex flex-wrap items-end gap-2 border-t border-flo-maroon/10 pt-3"
              >
                <input type="hidden" name="membershipId" value={m.id} />
                <label className="text-xs font-semibold text-flo-maroon/70">
                  Add note
                  <input
                    name="note"
                    required
                    placeholder="CRM note…"
                    className="mt-1 h-10 w-64 max-w-full rounded-xl border border-flo-maroon/15 px-3"
                  />
                </label>
                <ConfirmSubmitButton
                  confirmMessage="Append this note to the member history?"
                  className="h-10 rounded-full bg-flo-cream px-4 text-xs font-bold text-flo-maroon"
                >
                  Save note
                </ConfirmSubmitButton>
              </form>

              {m.status === "active" || m.status === "paused" ? (
                <form
                  action={updateMemberStatusAction}
                  className="mt-3 flex flex-wrap items-end gap-2 border-t border-flo-maroon/10 pt-3"
                >
                  <input type="hidden" name="membershipId" value={m.id} />
                  <label className="text-xs font-semibold">
                    Action
                    <select
                      name="status"
                      className="mt-1 block h-10 rounded-xl border border-flo-maroon/15 px-2"
                      defaultValue={m.status === "paused" ? "active" : "paused"}
                    >
                      {m.status === "paused" ? (
                        <option value="active">Resume</option>
                      ) : (
                        <option value="paused">Pause</option>
                      )}
                      <option value="cancelled">Cancel</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold">
                    Notes
                    <input
                      name="notes"
                      placeholder="Reason / note"
                      className="mt-1 h-10 w-56 rounded-xl border border-flo-maroon/15 px-3"
                    />
                  </label>
                  <ConfirmSubmitButton
                    confirmMessage="Update this membership status?"
                    className="h-10 rounded-full bg-flo-pink px-4 text-xs font-bold text-white"
                  >
                    Apply
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </article>
          );
        })}
        {!rows.length && (
          <p className="rounded-2xl bg-white p-6 text-sm text-flo-maroon/50 shadow-sm">
            No members yet.
          </p>
        )}
      </div>
    </div>
  );
}
