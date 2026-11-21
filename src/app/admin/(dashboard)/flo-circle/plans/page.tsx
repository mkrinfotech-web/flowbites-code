import { createClient } from "@/lib/supabase/server";
import { upsertFloPlanAction } from "@/app/admin/flo-actions";
import { formatInr } from "@/lib/utils";
import { AdminNotice } from "@/components/admin/admin-notice";

export default async function FloPlansAdminPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("flo_circle_plans")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <AdminNotice />
      <h1 className="text-2xl font-bold text-flo-maroon">Flo Circle plans</h1>
      <p className="mt-1 text-sm text-flo-maroon/60">
        Create plans and paste Razorpay Plan IDs after creating them in Razorpay.
      </p>

      <form
        action={upsertFloPlanAction}
        className="mt-6 grid gap-3 rounded-2xl border border-dashed border-flo-maroon/20 bg-white/80 p-4 shadow-sm md:grid-cols-3"
      >
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-flo-maroon md:col-span-3">
          Create plan
        </h2>
        <label className="text-xs font-semibold">
          Name
          <input
            name="name"
            required
            placeholder="6 months"
            className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
          />
        </label>
        <label className="text-xs font-semibold">
          Slug
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="six-months"
            className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
          />
        </label>
        <label className="text-xs font-semibold">
          Price INR
          <input
            name="priceInr"
            type="number"
            min={1}
            required
            defaultValue={1}
            className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
          />
        </label>
        <label className="text-xs font-semibold">
          Duration days
          <input
            name="durationDays"
            type="number"
            min={1}
            required
            defaultValue={180}
            className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
          />
        </label>
        <label className="text-xs font-semibold md:col-span-2">
          Razorpay plan id
          <input
            name="razorpayPlanId"
            placeholder="plan_… (optional)"
            className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
          />
        </label>
        <label className="text-xs font-semibold md:col-span-2">
          Description
          <input
            name="description"
            placeholder="Short blurb"
            className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" name="isActive" defaultChecked />
          Active
        </label>
        <input type="hidden" name="sortOrder" value={(plans?.length ?? 0) + 1} />
        <button
          type="submit"
          className="h-10 rounded-full bg-flo-maroon text-sm font-bold text-white"
        >
          Create plan
        </button>
      </form>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-bold text-flo-maroon">Existing plans</h2>
        {(plans ?? []).map((p) => (
          <form
            key={p.id}
            action={upsertFloPlanAction}
            className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-3"
          >
            <input type="hidden" name="id" value={p.id} />
            <label className="text-xs font-semibold">
              Name
              <input
                name="name"
                defaultValue={p.name}
                className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
              />
            </label>
            <label className="text-xs font-semibold">
              Slug
              <input
                name="slug"
                defaultValue={p.slug}
                className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
              />
            </label>
            <label className="text-xs font-semibold">
              Price INR
              <input
                name="priceInr"
                type="number"
                defaultValue={p.price_inr}
                className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
              />
            </label>
            <label className="text-xs font-semibold">
              Duration days
              <input
                name="durationDays"
                type="number"
                defaultValue={p.duration_days}
                className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
              />
            </label>
            <label className="text-xs font-semibold md:col-span-2">
              Razorpay plan id
              <input
                name="razorpayPlanId"
                defaultValue={p.razorpay_plan_id ?? ""}
                placeholder="plan_…"
                className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
              />
            </label>
            <label className="text-xs font-semibold md:col-span-2">
              Description
              <input
                name="description"
                defaultValue={p.description ?? ""}
                className="mt-1 h-10 w-full rounded-xl border border-flo-maroon/15 px-3"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={p.is_active}
              />
              Active · {formatInr(p.price_inr)}
            </label>
            <input type="hidden" name="sortOrder" value={p.sort_order} />
            <button
              type="submit"
              className="h-10 rounded-full bg-flo-pink text-sm font-bold text-white"
            >
              Save
            </button>
          </form>
        ))}
        {!plans?.length ? (
          <p className="text-sm text-flo-maroon/50">No plans yet.</p>
        ) : null}
      </div>
    </div>
  );
}
