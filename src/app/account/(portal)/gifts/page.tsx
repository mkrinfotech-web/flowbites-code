import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function GiftsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();
  if (!user || !admin) return null;

  const { data: gifts } = await admin
    .from("flo_gifts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Gifts</h1>
      <ul className="mt-6 space-y-3">
        {(gifts ?? []).map((g) => (
          <li key={g.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase text-flo-pink">{g.status}</p>
            <p className="font-bold text-flo-maroon">{g.title}</p>
            <p className="text-sm text-flo-maroon/60">
              {g.kind} · {g.notes ?? ""}
            </p>
          </li>
        ))}
        {!gifts?.length && (
          <li className="text-sm text-flo-maroon/50">
            Join Flo Circle to unlock welcome gifts.
          </li>
        )}
      </ul>
    </div>
  );
}
