import { createClient } from "@/lib/supabase/server";
import { ProductCreateForm } from "@/components/admin/product-create-form";
import { ProductEditCard } from "@/components/admin/product-edit-card";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const canDelete = me?.role === "admin";

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, price_inr, stock_qty, image_path, is_active, sort_order, pack_label, content, edition",
    )
    .order("sort_order", { ascending: true });

  const editionMissing =
    Boolean(error?.message?.toLowerCase().includes("edition"));
  const { data: fallbackProducts, error: fallbackError } = editionMissing
    ? await supabase
        .from("products")
        .select(
          "id, slug, name, price_inr, stock_qty, image_path, is_active, sort_order, pack_label, content",
        )
        .order("sort_order", { ascending: true })
    : { data: products, error };

  const rows = editionMissing ? fallbackProducts : products;
  const listError = editionMissing ? fallbackError : error;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-flo-maroon">Products</h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Create products, upload images, edit price / stock, and rich accordion
        copy (description, nutrition, ingredients, contains)
        {canDelete ? " · admins can soft or hard delete" : ""}
      </p>

      {params.error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </p>
      ) : null}
      {params.ok ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Product created.
        </p>
      ) : null}

      <ProductCreateForm />

      {listError ? (
        <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {listError.message}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4">
        <h2 className="text-lg font-extrabold text-flo-maroon">
          Existing products
        </h2>
        {(rows ?? []).map((p) => (
          <ProductEditCard key={p.id} product={p} canDelete={canDelete} />
        ))}
      </div>
    </div>
  );
}
