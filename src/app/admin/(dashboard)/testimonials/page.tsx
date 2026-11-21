import { createClient } from "@/lib/supabase/server";
import {
  deleteTestimonialAction,
  upsertTestimonialAction,
} from "@/app/admin/cms-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: queryError } = await searchParams;
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("testimonials")
    .select("id, quote, author_name, city, sort_order, is_active")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-flo-maroon">Testimonials</h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Period Stories marquee. Empty / inactive list falls back to static
        quotes.
      </p>

      {(queryError || error) && (
        <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {queryError === "invalid"
            ? "Check quote, author, and city."
            : queryError || error?.message}
        </p>
      )}

      <form
        action={upsertTestimonialAction}
        className="mt-6 grid gap-3 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm md:grid-cols-2"
      >
        <label className="text-xs font-bold uppercase text-flo-maroon/60 md:col-span-2">
          Quote
          <textarea
            name="quote"
            required
            rows={3}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Author
          <input
            name="authorName"
            required
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          City
          <input
            name="city"
            required
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-bold uppercase text-flo-maroon/60">
          Sort order
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-flo-maroon">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="size-4 rounded border-flo-maroon/30"
          />
          Active
        </label>
        <button
          type="submit"
          className="h-11 rounded-full bg-flo-pink text-sm font-bold text-white md:col-span-2"
        >
          Add testimonial
        </button>
      </form>

      <ul className="mt-8 space-y-4">
        {(rows ?? []).length === 0 ? (
          <li className="rounded-2xl border border-dashed border-flo-maroon/20 bg-white/50 px-4 py-10 text-center text-sm text-flo-ink/50">
            No testimonials yet — homepage uses static fallback.
          </li>
        ) : (
          (rows ?? []).map((t) => (
            <li
              key={t.id}
              className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-4 shadow-sm"
            >
              <form
                action={upsertTestimonialAction}
                className="grid gap-3 md:grid-cols-2"
              >
                <input type="hidden" name="id" value={t.id} />
                <label className="text-xs font-bold uppercase text-flo-maroon/60 md:col-span-2">
                  Quote
                  <textarea
                    name="quote"
                    required
                    rows={3}
                    defaultValue={t.quote}
                    className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="text-xs font-bold uppercase text-flo-maroon/60">
                  Author
                  <input
                    name="authorName"
                    required
                    defaultValue={t.author_name}
                    className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="text-xs font-bold uppercase text-flo-maroon/60">
                  City
                  <input
                    name="city"
                    required
                    defaultValue={t.city}
                    className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="text-xs font-bold uppercase text-flo-maroon/60">
                  Sort order
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={t.sort_order}
                    className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-flo-maroon">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={t.is_active}
                    className="size-4 rounded border-flo-maroon/30"
                  />
                  Active
                </label>
                <div className="flex flex-wrap gap-2 md:col-span-2 md:justify-end">
                  <button
                    type="submit"
                    className="h-9 rounded-full bg-flo-pink px-4 text-xs font-bold text-white"
                  >
                    Save
                  </button>
                </div>
              </form>
              <form action={deleteTestimonialAction} className="mt-2">
                <input type="hidden" name="id" value={t.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Delete testimonial from ${t.author_name}?`}
                  className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
