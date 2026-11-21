"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  deleteProductAction,
  updateProductAction,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/product-images";
import { formatInr } from "@/lib/admin-utils";
import type { ProductContent } from "@/lib/data";
import { parseProductContent } from "@/lib/product-content";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price_inr: number;
  stock_qty: number | null;
  image_path: string;
  is_active: boolean;
  sort_order: number;
  pack_label: string;
  edition?: "flo" | "flo_plus" | null;
  content?: unknown;
};

function listToTextarea(items: string[]): string {
  return items.join("\n");
}

export function ProductEditCard({
  product: p,
  canDelete = false,
}: {
  product: ProductRow;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState(p.image_path);

  const content: ProductContent = parseProductContent(p.content) ?? {
    descriptionFormal: "",
    descriptionPunchy: "",
    nutritionSummary: "",
    nutritionBullets: [],
    nutritionDisclaimer: "",
    ingredients: [],
    footerContains: [],
    footerNote: "",
  };

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const imageFile = fd.get("image") as File | null;

    startTransition(async () => {
      try {
        let imagePath = String(fd.get("imagePath") || "").trim();
        if (imageFile && imageFile.size > 0) {
          const supabase = createClient();
          const path = `products/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80)}`;
          const { error: upErr } = await supabase.storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(path, imageFile, {
              cacheControl: "3600",
              upsert: false,
              contentType: imageFile.type || "image/jpeg",
            });
          if (upErr) {
            setError(upErr.message);
            return;
          }
          imagePath = supabase.storage
            .from(PRODUCT_IMAGES_BUCKET)
            .getPublicUrl(path).data.publicUrl;
          setPreview(imagePath);
        }

        const submitFd = new FormData(form);
        submitFd.set("imagePath", imagePath);
        submitFd.delete("image");
        const result = await updateProductAction(submitFd);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function onDelete(mode: "soft" | "hard") {
    setError(null);
    const fd = new FormData();
    fd.set("id", p.id);
    fd.set("mode", mode);
    startTransition(async () => {
      const result = await deleteProductAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const fieldClass =
    "mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2 text-sm font-normal normal-case";
  const labelClass = "text-xs font-bold uppercase text-flo-maroon/60";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="grid gap-4 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm md:grid-cols-[120px_1fr]"
    >
      <input type="hidden" name="id" value={p.id} />
      <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-2xl bg-flo-blush">
        {preview ? (
          <Image
            src={preview}
            alt={p.name}
            fill
            className="object-contain p-2"
            sizes="112px"
            unoptimized={preview.startsWith("blob:")}
          />
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
          Name
          <input
            name="name"
            defaultValue={p.name}
            className={`${fieldClass} font-semibold`}
          />
          <span className="mt-1 block text-[11px] font-normal normal-case text-flo-ink/45">
            slug: {p.slug} · {p.pack_label}
          </span>
        </label>
        <label className={labelClass}>
          Price (INR)
          <input
            name="priceInr"
            type="number"
            min={1}
            defaultValue={p.price_inr}
            className={fieldClass}
          />
          <span className="mt-1 block text-[11px] font-normal normal-case text-flo-ink/45">
            Current: {formatInr(p.price_inr)}
          </span>
        </label>
        <label className={labelClass}>
          Stock qty
          <input
            name="stockQty"
            type="number"
            min={0}
            defaultValue={p.stock_qty ?? 0}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Sort
          <input
            name="sortOrder"
            type="number"
            defaultValue={p.sort_order}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Edition tab
          <select
            name="edition"
            defaultValue={p.edition === "flo_plus" ? "flo_plus" : "flo"}
            className={fieldClass}
          >
            <option value="flo">THE FLO EDITION</option>
            <option value="flo_plus">THE FLO+ EDITION</option>
          </select>
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Replace image
          <input
            name="image"
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm font-normal normal-case file:mr-3 file:rounded-full file:border-0 file:bg-flo-pink/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-flo-maroon"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
          />
        </label>
        <label className={`${labelClass} text-[11px] tracking-wide text-flo-maroon/45 sm:col-span-2`}>
          Or path / URL override
          <input
            name="imagePath"
            defaultValue={p.image_path}
            className={fieldClass}
          />
        </label>
        <label className="flex items-center gap-2 self-end text-sm font-semibold text-flo-maroon">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={p.is_active}
            className="h-4 w-4 accent-flo-pink"
          />
          Active on storefront
        </label>

        <div className="sm:col-span-2 lg:col-span-3">
          <p className="mb-2 text-sm font-extrabold text-flo-maroon">
            Rich content (cart + PDP accordion)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              Formal description
              <textarea
                name="descriptionFormal"
                rows={3}
                defaultValue={content.descriptionFormal}
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Punchy subline
              <textarea
                name="descriptionPunchy"
                rows={2}
                defaultValue={content.descriptionPunchy}
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Nutrition summary
              <input
                name="nutritionSummary"
                defaultValue={content.nutritionSummary}
                placeholder="30 g | 138 kcal"
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Nutrition bullets
              <span className="mt-0.5 block text-[10px] font-normal normal-case text-flo-ink/45">
                One per line
              </span>
              <textarea
                name="nutritionBullets"
                rows={5}
                defaultValue={listToTextarea(content.nutritionBullets)}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Nutrition disclaimer
              <textarea
                name="nutritionDisclaimer"
                rows={3}
                defaultValue={content.nutritionDisclaimer}
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Ingredients (Thoughtfully Made With)
              <span className="mt-0.5 block text-[10px] font-normal normal-case text-flo-ink/45">
                Comma or one per line — shown as pills
              </span>
              <textarea
                name="ingredientsList"
                rows={4}
                defaultValue={listToTextarea(content.ingredients)}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Contains (footer)
              <span className="mt-0.5 block text-[10px] font-normal normal-case text-flo-ink/45">
                One per line
              </span>
              <textarea
                name="footerContains"
                rows={3}
                defaultValue={listToTextarea(content.footerContains)}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Footer note
              <textarea
                name="footerNote"
                rows={3}
                defaultValue={content.footerNote}
                className={fieldClass}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="self-end rounded-full bg-flo-pink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 sm:justify-self-end"
        >
          {pending ? "Saving…" : "Save product"}
        </button>
        {canDelete ? (
          <div className="flex flex-wrap gap-2 self-end sm:col-span-2 lg:col-span-3">
            <ConfirmSubmitButton
              type="button"
              disabled={pending}
              confirmMessage={`Deactivate “${p.name}”? It will hide from the storefront (soft delete).`}
              onClick={() => onDelete("soft")}
              className="rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 disabled:opacity-60"
            >
              Soft delete
            </ConfirmSubmitButton>
            <ConfirmSubmitButton
              type="button"
              disabled={pending}
              confirmMessage={`Permanently delete “${p.name}”? This cannot be undone.`}
              onClick={() => onDelete("hard")}
              className="rounded-full bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 disabled:opacity-60"
            >
              Hard delete
            </ConfirmSubmitButton>
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-rose-700 sm:col-span-2 lg:col-span-3">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
