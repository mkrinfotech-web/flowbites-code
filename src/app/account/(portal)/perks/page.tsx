import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function PerksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();
  if (!user || !admin) return null;

  const { data: perks } = await admin
    .from("flo_perks")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const { data: membership } = await admin
    .from("flo_circle_memberships")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  let unlocked = new Set<string>();
  if (membership) {
    const { data: mp } = await admin
      .from("flo_member_perks")
      .select("perk_id, completed_at")
      .eq("membership_id", membership.id);
    unlocked = new Set((mp ?? []).map((m) => m.perk_id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Perks checklist</h1>
      <ul className="mt-6 space-y-3">
        {(perks ?? []).map((p) => {
          const on = unlocked.has(p.id);
          return (
            <li
              key={p.id}
              className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                  on ? "bg-flo-pink" : "bg-flo-maroon/20"
                }`}
              >
                {on ? "✓" : ""}
              </span>
              <div>
                <p className="font-bold text-flo-maroon">{p.title}</p>
                <p className="text-sm text-flo-maroon/60">{p.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
