"use client";

import {
  deleteBannerAction,
  upsertBannerAction,
} from "@/app/admin/cms-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ImageUploadField } from "@/components/admin/image-upload-field";

const PLACEMENTS = [
  "homepage_top",
  "homepage_mid",
  "sitewide",
  "checkout",
] as const;

const inputClass =
  "mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/40 px-3 py-2.5 text-sm";
const inputEditClass =
  "mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm";

export type BannerFormProps = {
  mode: "create" | "edit";
  banner?: {
    id: string;
    name: string;
    placement: string;
    headline: string | null;
    body: string | null;
    cta_label: string | null;
    cta_href: string | null;
    image_path: string | null;
    is_active: boolean;
    sort_order: number;
  };
};

export function BannerForm({ mode, banner }: BannerFormProps) {
  const isEdit = mode === "edit" && banner;
  const fieldClass = isEdit ? inputEditClass : inputClass;

  const form = (
    <form
      action={upsertBannerAction}
      className={
        isEdit
          ? "grid gap-3 md:grid-cols-2"
          : "mt-6 grid gap-3 rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm md:grid-cols-2"
      }
    >
      {isEdit ? <input type="hidden" name="id" value={banner.id} /> : null}

      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Title
        <input
          name="name"
          required
          defaultValue={banner?.name ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Placement
        <select
          name="placement"
          defaultValue={banner?.placement ?? "homepage_top"}
          className={`${fieldClass} capitalize`}
        >
          {PLACEMENTS.map((p) => (
            <option key={p} value={p}>
              {p.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Headline
        <input
          name="headline"
          defaultValue={banner?.headline ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Link (CTA href)
        <input
          name="ctaHref"
          placeholder="/checkout"
          defaultValue={banner?.cta_href ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        CTA label
        <input
          name="ctaLabel"
          placeholder="Shop now"
          defaultValue={banner?.cta_label ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60">
        Sort order
        <input
          name="sortOrder"
          type="number"
          defaultValue={banner?.sort_order ?? 0}
          className={fieldClass}
        />
      </label>
      <label className="text-xs font-bold uppercase text-flo-maroon/60 md:col-span-2">
        Body
        <textarea
          name="body"
          rows={2}
          defaultValue={banner?.body ?? ""}
          className={fieldClass}
        />
      </label>

      <div className="md:col-span-2">
        <ImageUploadField
          name="imagePath"
          label="Banner image"
          defaultValue={banner?.image_path ?? ""}
          bucket="media"
          folder="banners"
        />
      </div>

      <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-flo-maroon">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={banner?.is_active ?? true}
          className="size-4 rounded border-flo-maroon/30"
        />
        Active
      </label>

      <div
        className={
          isEdit
            ? "flex flex-wrap gap-2 md:col-span-2 md:justify-end"
            : "md:col-span-2"
        }
      >
        <button
          type="submit"
          className={
            isEdit
              ? "h-9 rounded-full bg-flo-pink px-4 text-xs font-bold text-white"
              : "h-11 w-full rounded-full bg-flo-pink text-sm font-bold text-white"
          }
        >
          {isEdit ? "Save" : "Add banner"}
        </button>
      </div>
    </form>
  );

  if (!isEdit) return form;

  return (
    <li className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-4 shadow-sm">
      {form}
      <form action={deleteBannerAction} className="mt-2">
        <input type="hidden" name="id" value={banner.id} />
        <ConfirmSubmitButton
          confirmMessage={`Delete banner “${banner.name}”?`}
          className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
        >
          Delete
        </ConfirmSubmitButton>
      </form>
    </li>
  );
}
