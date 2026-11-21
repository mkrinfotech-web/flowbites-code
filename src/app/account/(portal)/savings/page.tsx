import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatInr } from "@/lib/utils";

export default async function SavingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();
  if (!user || !admin) return null;

  const { data: rows } = await admin
    .from("flo_savings_ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const total = (rows ?? []).reduce((s, r) => s + r.amount_inr, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Savings tracker</h1>
      <p className="mt-2 text-3xl font-bold text-flo-pink">{formatInr(total)}</p>
      <p className="text-sm text-flo-maroon/60">Total saved with Flo Circle discounts</p>
      <ul className="mt-6 space-y-2">
        {(rows ?? []).map((r) => (
          <li
            key={r.id}
            className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm"
          >
            <span className="capitalize text-flo-maroon/70">
              {r.source.replace("_", " ")} · {r.note ?? ""}
            </span>
            <span className="font-bold text-flo-pink">
              {formatInr(r.amount_inr)}
            </span>
          </li>
        ))}
        {!rows?.length && (
          <li className="text-sm text-flo-maroon/50">No savings yet — shop with membership.</li>
        )}
      </ul>
    </div>
  );
}
