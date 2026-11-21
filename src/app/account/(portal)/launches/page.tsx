import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function LaunchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();
  if (!user || !admin) return null;

  const { data: launches } = await admin
    .from("flo_launches")
    .select("*")
    .eq("is_published", true)
    .order("goes_live_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Early access launches</h1>
      <ul className="mt-6 space-y-3">
        {(launches ?? []).map((l) => (
          <li key={l.id} className="rounded-2xl bg-white px-4 py-4 shadow-sm">
            <p className="font-bold text-flo-maroon">{l.title}</p>
            <p className="text-sm text-flo-maroon/65">{l.teaser}</p>
            <p className="mt-2 text-xs text-flo-pink">
              Goes live{" "}
              {l.goes_live_at
                ? new Date(l.goes_live_at).toLocaleDateString("en-IN")
                : "TBA"}
            </p>
          </li>
        ))}
        {!launches?.length && (
          <li className="text-sm text-flo-maroon/50">
            No member launches right now — check back soon.
          </li>
        )}
      </ul>
    </div>
  );
}
