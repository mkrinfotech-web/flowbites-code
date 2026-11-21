"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProductAction } from "@/app/admin/actions";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/product-images";
import { Upload } from "lucide-react";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function ProductCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setProgress(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const imageFile = fd.get("image") as File | null;
    const imagePathFallback = String(fd.get("imagePath") || "").trim();

    startTransition(async () => {
      try {
        let imagePath = imagePathFallback;

        if (imageFile && imageFile.size > 0) {
          const supabase = createClient();
          const path = `products/${Date.now()}-${safeName(imageFile.name)}`;
          setProgress("Uploading image…");
          const { error: upErr } = await supabase.storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(path, imageFile, {
              cacheControl: "3600",
              upsert: false,
              contentType: imageFile.type || "image/jpeg",
            });
          if (upErr) {
            setError(upErr.message);
            setProgress(null);
            return;
          }
          imagePath = supabase.storage
            .from(PRODUCT_IMAGES_BUCKET)
            .getPublicUrl(path).data.publicUrl;
        }

        if (!imagePath) {
          setError("Upload an image or paste an image URL/path.");
          return;
        }

        setProgress("Saving…");
        const submitFd = new FormData(form);
        submitFd.set("imagePath", imagePath);
        submitFd.delete("image");
        const result = await createProductAction(submitFd);
        if (result.error) {
          setError(result.error);
          setProgress(null);
          return;
        }
        formRef.current?.reset();
        setSlugTouched(false);
        setProgress(null);
        router.refresh();
        router.push("/admin/products?ok=created");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create product.");
        setProgress(null);
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="mt-6 grid gap-3 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm md:grid-cols-2"
    >
      <h2 className="text-lg font-extrabold text-flo-maroon md:col-span-2">
        Create product
      </h2>

      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Name
        <input
          name="name"
          required
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
          onChange={(e) => {
            if (slugTouched) return;
            const slugInput = formRef.current?.elements.namedItem(
              "slug",
            ) as HTMLInputElement | null;
            if (slugInput) slugInput.value = slugify(e.target.value);
          }}
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Slug
        <input
          name="slug"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
          onChange={() => setSlugTouched(true)}
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60 md:col-span-2">
        Description
        <textarea
          name="description"
          required
          rows={3}
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Tagline
        <input
          name="tagline"
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Pack label
        <input
          name="packLabel"
          defaultValue="Pack of 6"
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Price (INR)
        <input
          name="priceInr"
          type="number"
          min={1}
          required
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Stock qty
        <input
          name="stockQty"
          type="number"
          min={0}
          defaultValue={0}
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Sort
        <input
          name="sortOrder"
          type="number"
          defaultValue={0}
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Edition tab
        <select
          name="edition"
          defaultValue="flo"
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        >
          <option value="flo">THE FLO EDITION</option>
          <option value="flo_plus">THE FLO+ EDITION</option>
        </select>
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Badge
        <input
          name="badge"
          placeholder="Optional"
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60 md:col-span-2">
        Product image
        <input
          name="image"
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm font-normal normal-case file:mr-3 file:rounded-full file:border-0 file:bg-flo-pink/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-flo-maroon"
        />
      </label>
      <label className="text-[11px] font-bold uppercase tracking-wide text-flo-maroon/45 md:col-span-2">
        Or path / URL override
        <input
          name="imagePath"
          placeholder="/images/… or https://…"
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm font-normal normal-case"
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-flo-maroon">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked
          className="h-4 w-4 accent-flo-pink"
        />
        Active on storefront
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 self-end rounded-full bg-flo-maroon px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        <Upload className="h-4 w-4" />
        {pending ? progress || "Saving…" : "Create product"}
      </button>
      {error ? (
        <p className="text-sm text-rose-700 md:col-span-2">{error}</p>
      ) : null}
    </form>
  );
}
