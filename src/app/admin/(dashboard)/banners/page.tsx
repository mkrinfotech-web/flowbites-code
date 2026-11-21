import { createClient } from "@/lib/supabase/server";
import { BannerForm } from "@/components/admin/banner-form";

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: queryError } = await searchParams;
  const supabase = await createClient();
  const { data: banners, error } = await supabase
    .from("banners")
    .select(
      "id, name, placement, headline, body, cta_label, cta_href, image_path, is_active, sort_order, created_at",
    )
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-flo-maroon">Banners</h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Promo strips by placement — upload an image, set headline/link, toggle
        active, and sort. Seeded from live homepage visuals when empty.
      </p>

      {(queryError || error) && (
        <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {queryError === "invalid"
            ? "Check title, placement, and link fields."
            : queryError || error?.message}
        </p>
      )}

      <BannerForm mode="create" />

      <ul className="mt-8 space-y-4">
        {(banners ?? []).length === 0 ? (
          <li className="rounded-2xl border border-dashed border-flo-maroon/20 bg-white/50 px-4 py-10 text-center text-sm text-flo-ink/50">
            No banners yet — re-run seed or add one above.
          </li>
        ) : (
          (banners ?? []).map((b) => (
            <BannerForm key={b.id} mode="edit" banner={b} />
          ))
        )}
      </ul>
    </div>
  );
}
