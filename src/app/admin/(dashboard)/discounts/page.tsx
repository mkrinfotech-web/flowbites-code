import { createClient } from "@/lib/supabase/server";
import {
  createDiscountAction,
  toggleDiscountAction,
} from "@/app/admin/actions";
import {
  setMemberDiscountTimingAction,
  setStackModeAction,
} from "@/app/admin/flo-actions";
import {
  DEFAULT_MEMBER_DISCOUNT_TIMING,
  parseMemberDiscountTiming,
} from "@/lib/flo-circle";
import { AdminNotice } from "@/components/admin/admin-notice";

export default async function AdminDiscountsPage() {
  const supabase = await createClient();
  const { data: codes, error } = await supabase
    .from("discount_codes")
    .select(
      "id, code, kind, percent_off, max_uses, use_count, is_active, expires_at, loved_name, created_at, used_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: stack } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "discount_stack_mode")
    .maybeSingle();
  const stackMode = String(stack?.value ?? "best_of_one").replace(/"/g, "");

  const { data: timingRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "flo_circle_discount_timing")
    .maybeSingle();
  const discountTiming = parseMemberDiscountTiming(
    timingRow?.value ?? DEFAULT_MEMBER_DISCOUNT_TIMING,
  );

  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 30);
  const defaultExpiryStr = defaultExpiry.toISOString().slice(0, 10);

  return (
    <div>
      <AdminNotice />
      <h1 className="text-2xl font-extrabold text-flo-maroon">
        Discounts &amp; Love Score
      </h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Create manual promo codes; Love Score codes appear here too
      </p>

      <div className="mt-4 rounded-2xl border border-flo-maroon/10 bg-white/75 p-4 shadow-sm">
        <p className="text-sm font-bold text-flo-maroon">
          Flo Circle discount stacking
        </p>
        <p className="mt-1 text-xs text-flo-maroon/60">
          Locked default: <strong>best of one (ii)</strong> — apply the single
          highest among Flo Circle 20%, Love Score, and coupon. Toggle only if
          founder wants stacking later.
        </p>
        <form action={setStackModeAction} className="mt-3 flex flex-wrap gap-2">
          <select
            name="mode"
            defaultValue={stackMode.includes("stack_all") ? "stack_all" : "best_of_one"}
            className="h-10 rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-sm"
          >
            <option value="best_of_one">best_of_one (ii)</option>
            <option value="stack_all">stack_all (future)</option>
          </select>
          <button
            type="submit"
            className="h-10 rounded-full bg-flo-maroon px-4 text-xs font-bold text-white"
          >
            Save stack mode
          </button>
        </form>
      </div>

      <div className="mt-4 rounded-2xl border border-flo-maroon/10 bg-white/75 p-4 shadow-sm">
        <p className="text-sm font-bold text-flo-maroon">
          When 20% member discount applies
        </p>
        <p className="mt-1 text-xs text-flo-maroon/60">
          Join Flo Circle at checkout is ₹1 / 6 months and is separate from this
          rule. Default: <strong>second_order</strong> — first paid order after
          joining does not get 20%; later orders do.
        </p>
        <form
          action={setMemberDiscountTimingAction}
          className="mt-3 flex flex-wrap gap-2"
        >
          <select
            name="timing"
            defaultValue={discountTiming}
            className="h-10 rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-sm"
          >
            <option value="second_order">second_order (default)</option>
            <option value="first_order">first_order</option>
            <option value="always">always</option>
            <option value="never">never</option>
          </select>
          <button
            type="submit"
            className="h-10 rounded-full bg-flo-maroon px-4 text-xs font-bold text-white"
          >
            Save timing
          </button>
        </form>
      </div>

      <form
        action={createDiscountAction}
        className="mt-6 grid gap-3 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm md:grid-cols-5"
      >
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Code
          <input
            name="code"
            required
            placeholder="FLO10"
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm uppercase"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          % off
          <input
            name="percentOff"
            type="number"
            min={1}
            max={50}
            defaultValue={10}
            required
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Max uses
          <input
            name="maxUses"
            type="number"
            min={1}
            placeholder="Unlimited"
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Expires
          <input
            name="expiresAt"
            type="date"
            required
            defaultValue={defaultExpiryStr}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-full bg-flo-pink px-4 py-2.5 text-sm font-bold text-white"
          >
            Create code
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error.message}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-flo-maroon/10 bg-white/75 shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-flo-blush/60 text-xs uppercase tracking-wide text-flo-maroon/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Kind</th>
              <th className="px-4 py-3 font-semibold">Off</th>
              <th className="px-4 py-3 font-semibold">Uses</th>
              <th className="px-4 py-3 font-semibold">Expires</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-flo-maroon/5">
            {(codes ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-flo-ink/50"
                >
                  No discount codes yet.
                </td>
              </tr>
            ) : (
              (codes ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-bold text-flo-maroon">
                    {c.code}
                    {c.loved_name ? (
                      <span className="mt-0.5 block text-xs font-normal text-flo-ink/50">
                        for {c.loved_name}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 capitalize">{c.kind ?? "love_score"}</td>
                  <td className="px-4 py-3">{c.percent_off}%</td>
                  <td className="px-4 py-3">
                    {c.use_count ?? 0}
                    {c.max_uses ? ` / ${c.max_uses}` : ""}
                    {c.used_at ? " · used" : ""}
                  </td>
                  <td className="px-4 py-3 text-flo-ink/60">
                    {new Date(c.expires_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        c.is_active !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {c.is_active !== false ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleDiscountAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={String(c.is_active !== false)}
                      />
                      <button
                        type="submit"
                        className="text-xs font-bold text-flo-pink hover:underline"
                      >
                        Toggle
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
