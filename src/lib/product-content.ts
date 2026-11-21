import type { ProductContent } from "@/lib/data";

type DbContent = {
  description_formal?: unknown;
  description_punchy?: unknown;
  nutrition_summary?: unknown;
  nutrition_bullets?: unknown;
  nutrition_disclaimer?: unknown;
  ingredients?: unknown;
  footer_contains?: unknown;
  footer_note?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

/** Normalize DB snake_case JSON → ProductContent (null if empty). */
export function parseProductContent(
  raw: unknown,
  fallback?: ProductContent,
): ProductContent | undefined {
  const src =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as DbContent)
      : null;

  const fromDb: ProductContent | undefined = src
    ? {
        descriptionFormal: asString(src.description_formal),
        descriptionPunchy: asString(src.description_punchy),
        nutritionSummary: asString(src.nutrition_summary),
        nutritionBullets: asStringArray(src.nutrition_bullets),
        nutritionDisclaimer: asString(src.nutrition_disclaimer),
        ingredients: asStringArray(src.ingredients),
        footerContains: asStringArray(src.footer_contains),
        footerNote: asString(src.footer_note),
      }
    : undefined;

  const hasDb =
    fromDb &&
    (fromDb.descriptionFormal ||
      fromDb.descriptionPunchy ||
      fromDb.nutritionSummary ||
      fromDb.nutritionBullets.length ||
      fromDb.ingredients.length ||
      fromDb.footerContains.length ||
      fromDb.footerNote);

  if (!hasDb) return fallback;

  return {
    descriptionFormal:
      fromDb.descriptionFormal || fallback?.descriptionFormal || "",
    descriptionPunchy:
      fromDb.descriptionPunchy || fallback?.descriptionPunchy || "",
    nutritionSummary:
      fromDb.nutritionSummary || fallback?.nutritionSummary || "",
    nutritionBullets:
      fromDb.nutritionBullets.length > 0
        ? fromDb.nutritionBullets
        : (fallback?.nutritionBullets ?? []),
    nutritionDisclaimer:
      fromDb.nutritionDisclaimer || fallback?.nutritionDisclaimer || "",
    ingredients:
      fromDb.ingredients.length > 0
        ? fromDb.ingredients
        : (fallback?.ingredients ?? []),
    footerContains:
      fromDb.footerContains.length > 0
        ? fromDb.footerContains
        : (fallback?.footerContains ?? []),
    footerNote: fromDb.footerNote || fallback?.footerNote || "",
  };
}

/** Serialize ProductContent → DB jsonb shape. */
export function serializeProductContent(
  content: ProductContent,
): Record<string, unknown> {
  return {
    description_formal: content.descriptionFormal,
    description_punchy: content.descriptionPunchy,
    nutrition_summary: content.nutritionSummary,
    nutrition_bullets: content.nutritionBullets,
    nutrition_disclaimer: content.nutritionDisclaimer,
    ingredients: content.ingredients,
    footer_contains: content.footerContains,
    footer_note: content.footerNote,
  };
}

export function contentHasAccordion(content?: ProductContent | null): boolean {
  if (!content) return false;
  return Boolean(
    content.descriptionFormal ||
      content.descriptionPunchy ||
      content.nutritionSummary ||
      content.nutritionBullets.length ||
      content.ingredients.length ||
      content.footerContains.length ||
      content.footerNote,
  );
}

/** Parse comma / newline separated ingredient tags for admin forms. */
export function parseTagList(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
