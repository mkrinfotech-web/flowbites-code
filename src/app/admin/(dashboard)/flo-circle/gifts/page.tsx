import { createClient } from "@/lib/supabase/server";
import { updateGiftStatusAction } from "@/app/admin/flo-actions";
import { AdminNotice } from "@/components/admin/admin-notice";

export default async function FloGiftsAdminPage() {
  const supabase = await createClient();
  const { data: gifts } = await supabase
    .from("flo_gifts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = Array.from(
    new Set((gifts ?? []).map((g) => g.user_id).filter(Boolean)),
  );

  const { data: profiles } = userIds.length
    ? await supabase
        .from("member_profiles")
        .select("id, email, full_name, member_id")
        .in("id", userIds)
    : { data: [] as Array<{
        id: string;
        email: string | null;
        full_name: string | null;
        member_id: string | null;
      }> };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div>
      <AdminNotice />
      <h1 className="text-2xl font-bold text-flo-maroon">Gifts queue</h1>
      <p className="mt-1 text-sm text-flo-maroon/60">
        Member email shown when the profile is joinable / linked.
      </p>
      <div className="mt-6 space-y-3">
        {(gifts ?? []).map((g) => {
          const profile = profileMap.get(g.user_id);
          const email = profile?.email?.trim() || null;
          return (
            <form
              key={g.id}
              action={updateGiftStatusAction}
              className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm"
            >
              <input type="hidden" name="giftId" value={g.id} />
              <div className="min-w-[200px] flex-1">
                <p className="font-bold text-flo-maroon">{g.title}</p>
                <p className="text-xs text-flo-maroon/50">
                  {g.kind} · {g.trigger_key} ·{" "}
                  {profile?.member_id || g.user_id.slice(0, 8)}
                </p>
                {email ? (
                  <p className="mt-0.5 text-xs font-medium text-flo-pink">
                    {email}
                    {profile?.full_name ? ` · ${profile.full_name}` : ""}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-flo-maroon/40">
                    No member email linked
                  </p>
                )}
              </div>
              <label className="text-xs font-semibold">
                Status
                <select
                  name="status"
                  defaultValue={g.status}
                  className="mt-1 block h-10 rounded-xl border border-flo-maroon/15 px-2"
                >
                  {["queued", "assigned", "shipped", "delivered", "cancelled"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="text-xs font-semibold">
                Notes
                <input
                  name="notes"
                  defaultValue={g.notes ?? ""}
                  className="mt-1 h-10 w-48 rounded-xl border border-flo-maroon/15 px-3"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-full bg-flo-pink px-4 text-xs font-bold text-white"
              >
                Update
              </button>
            </form>
          );
        })}
        {!gifts?.length && (
          <p className="text-sm text-flo-maroon/50">Queue empty.</p>
        )}
      </div>
    </div>
  );
}
