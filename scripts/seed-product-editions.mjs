#!/usr/bin/env node
/**
 * Upsert 8 Best Sellers SKUs and soft-deactivate the old 3.
 * Loads .env.local. Never prints secrets.
 *
 *   node scripts/seed-product-editions.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const FOOTER_NOTE =
  "Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.";
const NUTRITION_DISCLAIMER =
  "*As per nutritional analysis and applicable regulations.";

const FLO_55 = [
  "Puffed Ragi",
  "Dates Paste",
  "Pea Protein Isolate",
  "Pumpkin Seeds",
  "Morde 55% Dark Chocolate",
  "Sesame Seeds",
  "Sunflower Seeds",
  "Chicory Inulin",
  "Black Raisins",
  "Flax Seeds",
  "Honey",
  "Resistant Dextrin",
  "Virgin Coconut Oil",
  "Amla Powder",
  "Salt",
  "Rosemary Extract",
];
const FLO_70 = [
  "Puffed Ragi",
  "Dates Paste",
  "Pea Protein Isolate",
  "Morde 70% Dark Chocolate",
  "Pumpkin Seeds",
  "Sesame Seeds",
  "Sunflower Seeds",
  "Chicory Inulin",
  "Flax Seeds",
  "Black Raisins",
  "Resistant Dextrin",
  "Virgin Coconut Oil",
  "Amla Powder",
  "Salt",
  "Rosemary Extract",
];
const PLUS_55 = [
  "Puffed Ragi",
  "Dates Paste",
  "Pea Protein Isolate",
  "Morde 55% Dark Chocolate",
  "Pumpkin Seeds",
  "Sesame Seeds",
  "Chicory Inulin",
  "Almonds",
  "Honey",
  "Flax Seeds",
  "Chia Seeds",
  "Resistant Dextrin",
  "Amla Powder",
  "Virgin Coconut Oil",
  "Salt",
  "Rosemary Extract",
];
const PLUS_70 = [
  "Puffed Ragi",
  "Pea Protein Isolate",
  "Dates Paste",
  "Morde 70% Dark Chocolate",
  "Pumpkin Seeds",
  "Sesame Seeds",
  "Chicory Inulin",
  "Almonds",
  "Flax Seeds",
  "Chia Seeds",
  "Resistant Dextrin",
  "Amla Powder",
  "Virgin Coconut Oil",
  "Salt",
  "Rosemary Extract",
];

function content(formal, punchy, ingredients, contains) {
  return {
    description_formal: formal,
    description_punchy: punchy,
    nutrition_summary: "Pack of 6",
    nutrition_bullets: [],
    nutrition_disclaimer: NUTRITION_DISCLAIMER,
    ingredients,
    footer_contains: contains,
    footer_note: FOOTER_NOTE,
  };
}

const CATALOG = [
  {
    id: "44111111-1111-4111-8111-111111111111",
    slug: "the-flo-edition",
    name: "THE FLO EDITION",
    tagline: "Your Flo starts here.",
    description:
      "A thoughtfully crafted pack of six 55% dark chocolate Flo Bites made for your snack routine on those days.",
    pack_label: "Pack of 6",
    price_inr: 599,
    image_path: "/images/products/editions/the-flo-edition.jpeg",
    badge: "Your Flo starts here.",
    shelf_color: "#fa3558",
    edition: "flo",
    sort_order: 1,
    content: content(
      "A thoughtfully crafted pack of six 55% dark chocolate Flo Bites made for your snack routine on those days. Chocolatey, crunchy and easy to keep handy when you want something made with your Flo in mind.",
      "Your Flo starts here.",
      FLO_55,
      ["Six 55% dark chocolate Flo Bites"],
    ),
  },
  {
    id: "44222222-2222-4222-8222-222222222222",
    slug: "the-extra-flo-edition",
    name: "THE EXTRA FLO EDITION",
    tagline: "Like it darker? Go Extra.",
    description:
      "A pack of six Flo Bites for those who prefer a deeper, more intense dark chocolate experience. Made with 70% dark chocolate.",
    pack_label: "Pack of 6",
    price_inr: 666,
    image_path: "/images/products/editions/the-extra-flo-edition.jpeg",
    badge: "Like it darker? Go Extra.",
    shelf_color: "#7a1f3d",
    edition: "flo",
    sort_order: 2,
    content: content(
      "A pack of six Flo Bites for those who prefer a deeper, more intense dark chocolate experience. Made with 70% dark chocolate and thoughtfully crafted for snacking on those days.",
      "Like it darker? Go Extra.",
      FLO_70,
      ["Six 70% dark chocolate Flo Bites"],
    ),
  },
  {
    id: "44333333-3333-4333-8333-333333333333",
    slug: "the-super-flo-edition",
    name: "THE SUPER FLO EDITION",
    tagline: "Why choose? Have both.",
    description:
      "Three bars made with 55% dark chocolate and three made with 70% dark chocolate in one six-bar pack for those days.",
    pack_label: "Pack of 6",
    price_inr: 649,
    image_path: "/images/products/editions/the-super-flo-edition.jpeg",
    badge: "Why choose? Have both.",
    shelf_color: "#fa3558",
    edition: "flo",
    sort_order: 3,
    content: content(
      "The best of both Flos in one box. Three bars made with 55% dark chocolate and three made with 70% dark chocolate, giving you two distinct chocolate experiences in one six-bar pack for those days.",
      "Why choose? Have both.",
      [...new Set([...FLO_55, ...FLO_70])],
      [
        "3 × 55% dark chocolate Flo Bites",
        "3 × 70% dark chocolate Flo Bites",
      ],
    ),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    slug: "the-secret-flo-edition",
    name: "THE SECRET FLO EDITION",
    tagline: "Unbox your Flo.",
    description:
      "Six Flo Bites. Two dark chocolate choices. One surprise combination of 55% and 70% until you open the box.",
    pack_label: "Pack of 6",
    price_inr: 649,
    image_path: "/images/products/editions/the-secret-flo-edition.jpeg",
    badge: "Unbox your Flo.",
    shelf_color: "#ffcc00",
    edition: "flo",
    sort_order: 4,
    content: content(
      "Six Flo Bites. Two dark chocolate choices. One surprise combination. Your box can contain any mix of our 55% and 70% dark chocolate Flo Bites, so the exact Flo stays a secret until you open it.",
      "Unbox your Flo.",
      [...new Set([...FLO_55, ...FLO_70])],
      ["A surprise mix of 55% and 70% dark chocolate Flo Bites (6 bars)"],
    ),
  },
  {
    id: "55111111-1111-4111-8111-111111111111",
    slug: "the-flo-plus-edition",
    name: "THE FLO+ EDITION",
    tagline: "Your Flo. Now with a +.",
    description:
      "A distinct Flo Bites recipe thoughtfully crafted for women 35+. Six bars with 55% dark chocolate.",
    pack_label: "Pack of 6",
    price_inr: 599,
    image_path: "/images/products/editions/the-flo-plus-edition.jpeg",
    badge: "Your Flo. Now with a +.",
    shelf_color: "#b5179e",
    edition: "flo_plus",
    sort_order: 5,
    content: content(
      "A distinct Flo Bites recipe thoughtfully crafted for women 35+. This six-bar pack brings the familiar Flo experience into a recipe created especially for the FLO+ edition, with 55% dark chocolate.",
      "Your Flo. Now with a +.",
      PLUS_55,
      ["Six 55% dark chocolate FLO+ bars"],
    ),
  },
  {
    id: "55222222-2222-4222-8222-222222222222",
    slug: "the-extra-flo-plus-edition",
    name: "THE EXTRA FLO+ EDITION",
    tagline: "35+. And into darker chocolate.",
    description:
      "The darker side of FLO+. Six bars from our distinct 35+ edition, made with 70% dark chocolate.",
    pack_label: "Pack of 6",
    price_inr: 699,
    image_path: "/images/products/editions/the-extra-flo-plus-edition.jpeg",
    badge: "35+. And into darker chocolate.",
    shelf_color: "#6a1b9a",
    edition: "flo_plus",
    sort_order: 6,
    content: content(
      "The darker side of FLO+. Six bars from our distinct 35+ edition, made with 70% dark chocolate for a richer and more intense chocolate experience while keeping the FLO+ recipe distinctly its own.",
      "35+. And into darker chocolate.",
      PLUS_70,
      ["Six 70% dark chocolate FLO+ bars"],
    ),
  },
  {
    id: "55333333-3333-4333-8333-333333333333",
    slug: "the-super-flo-plus-edition",
    name: "THE SUPER FLO+ EDITION",
    tagline: "Two chocolates. One FLO+.",
    description:
      "Both FLO+ favourites in one box: three 55% and three 70% dark chocolate bars, crafted for 35+.",
    pack_label: "Pack of 6",
    price_inr: 649,
    image_path: "/images/products/editions/the-super-flo-plus-edition.jpeg",
    badge: "Two chocolates. One FLO+.",
    shelf_color: "#b5179e",
    edition: "flo_plus",
    sort_order: 7,
    content: content(
      "Both FLO+ favourites in one box. Three bars made with 55% dark chocolate and three made with 70% dark chocolate, bringing together both distinct FLO+ chocolate experiences in one six-bar pack crafted for 35+.",
      "Two chocolates. One FLO+.",
      [...new Set([...PLUS_55, ...PLUS_70])],
      ["3 × 55% FLO+ bars", "3 × 70% FLO+ bars"],
    ),
  },
  {
    id: "55444444-4444-4444-8444-444444444444",
    slug: "the-secret-flo-plus-edition",
    name: "THE SECRET FLO+ EDITION",
    tagline: "The + is certain. The mix isn't.",
    description:
      "Six bars from our distinct 35+ edition in a surprise mix of 55% and 70% dark chocolate.",
    pack_label: "Pack of 6",
    price_inr: 649,
    image_path: "/images/products/editions/the-secret-flo-plus-edition.jpeg",
    badge: "The + is certain. The mix isn't.",
    shelf_color: "#ffcc00",
    edition: "flo_plus",
    sort_order: 8,
    content: content(
      "A little mystery, the FLO+ way. Six bars from our distinct 35+ edition in a surprise combination of 55% and 70% dark chocolate. You know it's FLO+; the exact mix stays secret until you open the box.",
      "The + is certain. The mix isn't.",
      [...new Set([...PLUS_55, ...PLUS_70])],
      ["A surprise mix of 55% and 70% FLO+ bars (6 bars)"],
    ),
  },
];

const OLD_SLUGS = [
  "craving-cruncher",
  "mood-muncher",
  "secret-flo",
  "secret-box",
  "craving_cruncher",
  "mood_muncher",
];

function loadDotEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function missingColumn(err) {
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("edition") && (msg.includes("column") || msg.includes("schema"));
}

async function upsertOne(admin, product, { includeEdition }) {
  const row = {
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    pack_label: product.pack_label,
    price_inr: product.price_inr,
    image_path: product.image_path,
    badge: product.badge,
    shelf_color: product.shelf_color,
    is_active: true,
    sort_order: product.sort_order,
    content: product.content,
  };
  if (includeEdition) row.edition = product.edition;

  const { data: existing, error: lookupErr } = await admin
    .from("products")
    .select("id")
    .eq("slug", product.slug)
    .maybeSingle();
  if (lookupErr) return { ok: false, error: lookupErr, slug: product.slug };

  if (existing?.id) {
    const { error } = await admin.from("products").update(row).eq("id", existing.id);
    return { ok: !error, error, slug: product.slug, action: "updated" };
  }

  const { error } = await admin.from("products").insert({ id: product.id, ...row });
  if (error && /duplicate|unique|conflict/i.test(error.message || "")) {
    const { error: retryErr } = await admin
      .from("products")
      .upsert({ ...row }, { onConflict: "slug" });
    return {
      ok: !retryErr,
      error: retryErr,
      slug: product.slug,
      action: "upserted",
    };
  }
  return { ok: !error, error, slug: product.slug, action: "inserted" };
}

async function main() {
  loadDotEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let includeEdition = true;
  let upserted = 0;
  let failed = 0;
  const actions = { inserted: 0, updated: 0, upserted: 0 };

  for (const product of CATALOG) {
    let result = await upsertOne(admin, product, { includeEdition });
    if (!result.ok && includeEdition && missingColumn(result.error)) {
      console.log("edition column missing — upserting without it");
      includeEdition = false;
      result = await upsertOne(admin, product, { includeEdition: false });
    }
    if (!result.ok) {
      failed += 1;
      console.error(`fail ${product.slug}: ${result.error?.message || "unknown"}`);
      continue;
    }
    upserted += 1;
    if (result.action) actions[result.action] = (actions[result.action] || 0) + 1;
  }

  if (includeEdition) {
    for (const product of CATALOG) {
      await admin
        .from("products")
        .update({ edition: product.edition })
        .eq("slug", product.slug);
    }
  } else {
    for (const product of CATALOG) {
      const { error } = await admin
        .from("products")
        .update({ edition: product.edition })
        .eq("slug", product.slug);
      if (!error) includeEdition = true;
      else break;
    }
  }

  const { data: oldRows } = await admin
    .from("products")
    .select("id, slug")
    .in("slug", OLD_SLUGS);

  let deactivated = 0;
  if (oldRows?.length) {
    const { data: deactivatedRows, error: deactErr } = await admin
      .from("products")
      .update({ is_active: false })
      .in("slug", OLD_SLUGS)
      .select("id");
    if (deactErr) {
      console.error(`deactivate failed: ${deactErr.message}`);
    } else {
      deactivated = deactivatedRows?.length ?? oldRows.length;
    }
  }

  const { data: active } = await admin
    .from("products")
    .select("slug, edition, is_active")
    .eq("is_active", true);

  const activeCount = active?.length ?? 0;
  const floCount = (active ?? []).filter((p) => p.edition === "flo").length;
  const plusCount = (active ?? []).filter((p) => p.edition === "flo_plus").length;
  const catalogActive = (active ?? []).filter((p) =>
    CATALOG.some((c) => c.slug === p.slug),
  ).length;

  console.log(
    JSON.stringify({
      upserted,
      failed,
      actions,
      deactivated,
      activeCount,
      catalogActive,
      floCount,
      plusCount,
      editionColumn: includeEdition,
    }),
  );

  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : "seed failed");
  process.exit(1);
});
