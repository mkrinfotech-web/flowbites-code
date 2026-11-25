import type { Product, ProductContent, ProductEdition } from "@/lib/data";
import { createElement, type ReactNode } from "react";
import { Plus } from "lucide-react";

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

function content(
  formal: string,
  punchy: string,
  ingredients: string[],
  contains: string[],
): ProductContent {
  return {
    descriptionFormal: formal,
    descriptionPunchy: punchy,
    nutritionSummary: "Pack of 6",
    nutritionBullets: [],
    nutritionDisclaimer: NUTRITION_DISCLAIMER,
    ingredients,
    footerContains: contains,
    footerNote: FOOTER_NOTE,
  };
}

function item(
  partial: Omit<Product, "packLabel" | "priceInr"> &
    Partial<Pick<Product, "packLabel" | "priceInr">>,
): Product {
  return {
    packLabel: "Pack of 6",
    priceInr: 549,
    ...partial,
  };
}

export const EDITION_TABS: {
  id: ProductEdition;
  label: ReactNode;
  hint: string;
}[] = [
    {
      id: "flo",
      label: createElement(
        "span",
        { className: "flex flex-col items-center leading-tight" },
        createElement(
          "span",
          { className: "inline-flex min-h-[18px] items-center" },
          "FloBites",
        ),
        createElement(
          "span",
          { className: "text-[10px] font-medium opacity-85" },
          "(",
          createElement(
            "span",
            { className: "text-[14px] font-bold" },
            "<",
          ),
          " 35 Age)",
        ),
      ),
      hint: "Signature range for those days",
    },
    {
      id: "flo_plus",
      label: createElement(
        "span",
        { className: "flex flex-col items-center leading-tight" },
        createElement(
          "span",
          { className: "inline-flex items-center gap-1" },
          "FloBites",
          createElement(Plus, { size: 18, strokeWidth: 2 }),
        ),
        createElement(
          "span",
          { className: "text-[10px] font-medium opacity-85" },
          "(",
          createElement(
            "span",
            { className: "text-[14px] font-bold" },
            ">",
          ),
          " 35 Age)",
        ),
      ),
      hint: "Distinct 35+ range",
    },
  ];

/** Eight live SKUs from TheFlow_Products pack. */
export const CATALOG_PRODUCTS: Product[] = [
  item({
    id: "44111111-1111-4111-8111-111111111111",
    slug: "the-flo-edition",
    name: "THE FLO EDITION",
    tagline: "Your Flo starts here.",
    description:
      "A thoughtfully crafted pack of six 55% dark chocolate Flo Bites made for your snack routine on those days.",
    imagePath: "/images/products/editions/the-flo-edition.jpeg",
    badge: "Your Flo starts here.",
    shelfColor: "#fa3558",
    edition: "flo",
    cornerRibbon: "Best seller",
    priceInr: 599,
    ingredients: FLO_55,
    content: content(
      "A thoughtfully crafted pack of six 55% dark chocolate Flo Bites made for your snack routine on those days. Chocolatey, crunchy and easy to keep handy when you want something made with your Flo in mind.",
      "Your Flo starts here.",
      FLO_55,
      ["Six 55% dark chocolate Flo Bites"],
    ),
  }),
  item({
    id: "44222222-2222-4222-8222-222222222222",
    slug: "the-extra-flo-edition",
    name: "THE EXTRA FLO EDITION",
    tagline: "Like it darker? Go Extra.",
    description:
      "A pack of six Flo Bites for those who prefer a deeper, more intense dark chocolate experience. Made with 70% dark chocolate.",
    imagePath: "/images/products/editions/the-extra-flo-edition.jpeg",
    badge: "Like it darker? Go Extra.",
    shelfColor: "#7a1f3d",
    edition: "flo",
    priceInr: 666,
    ingredients: FLO_70,
    content: content(
      "A pack of six Flo Bites for those who prefer a deeper, more intense dark chocolate experience. Made with 70% dark chocolate and thoughtfully crafted for snacking on those days.",
      "Like it darker? Go Extra.",
      FLO_70,
      ["Six 70% dark chocolate Flo Bites"],
    ),
  }),
  item({
    id: "44333333-3333-4333-8333-333333333333",
    slug: "the-super-flo-edition",
    name: "THE SUPER FLO EDITION",
    tagline: "Why choose? Have both.",
    description:
      "Three bars made with 55% dark chocolate and three made with 70% dark chocolate in one six-bar pack for those days.",
    imagePath: "/images/products/editions/the-super-flo-edition.jpeg",
    badge: "Why choose? Have both.",
    shelfColor: "#fa3558",
    edition: "flo",
    cornerRibbon: "Try this",
    priceInr: 649,
    ingredients: [...FLO_55, ...FLO_70],
    content: content(
      "The best of both Flos in one box. Three bars made with 55% dark chocolate and three made with 70% dark chocolate, giving you two distinct chocolate experiences in one six-bar pack for those days.",
      "Why choose? Have both.",
      [...new Set([...FLO_55, ...FLO_70])],
      ["3 × 55% dark chocolate Flo Bites", "3 × 70% dark chocolate Flo Bites"],
    ),
  }),
  item({
    id: "44444444-4444-4444-8444-444444444444",
    slug: "the-secret-flo-edition",
    name: "THE SECRET FLO EDITION",
    tagline: "Unbox your Flo.",
    description:
      "Six Flo Bites. Two dark chocolate choices. One surprise combination of 55% and 70% until you open the box.",
    imagePath: "/images/products/editions/the-secret-flo-edition.jpeg",
    badge: "Unbox your Flo.",
    shelfColor: "#ffcc00",
    edition: "flo",
    priceInr: 649,
    ingredients: [...new Set([...FLO_55, ...FLO_70])],
    content: content(
      "Six Flo Bites. Two dark chocolate choices. One surprise combination. Your box can contain any mix of our 55% and 70% dark chocolate Flo Bites, so the exact Flo stays a secret until you open it.",
      "Unbox your Flo.",
      [...new Set([...FLO_55, ...FLO_70])],
      ["A surprise mix of 55% and 70% dark chocolate Flo Bites (6 bars)"],
    ),
  }),
  item({
    id: "55111111-1111-4111-8111-111111111111",
    slug: "the-flo-plus-edition",
    name: "THE FLO+ EDITION",
    tagline: "Your Flo. Now with a +.",
    description:
      "A distinct Flo Bites recipe thoughtfully crafted for women 35+. Six bars with 55% dark chocolate.",
    imagePath: "/images/products/editions/the-flo-plus-edition.jpeg",
    badge: "Your Flo. Now with a +.",
    shelfColor: "#b5179e",
    edition: "flo_plus",
    cornerRibbon: "Best seller",
    priceInr: 599,
    ingredients: PLUS_55,
    content: content(
      "A distinct Flo Bites recipe thoughtfully crafted for women 35+. This six-bar pack brings the familiar Flo experience into a recipe created especially for the FLO+ edition, with 55% dark chocolate.",
      "Your Flo. Now with a +.",
      PLUS_55,
      ["Six 55% dark chocolate FLO+ bars"],
    ),
  }),
  item({
    id: "55222222-2222-4222-8222-222222222222",
    slug: "the-extra-flo-plus-edition",
    name: "THE EXTRA FLO+ EDITION",
    tagline: "35+. And into darker chocolate.",
    description:
      "The darker side of FLO+. Six bars from our distinct 35+ edition, made with 70% dark chocolate.",
    imagePath: "/images/products/editions/the-extra-flo-plus-edition.jpeg",
    badge: "35+. And into darker chocolate.",
    shelfColor: "#6a1b9a",
    edition: "flo_plus",
    priceInr: 699,
    ingredients: PLUS_70,
    content: content(
      "The darker side of FLO+. Six bars from our distinct 35+ edition, made with 70% dark chocolate for a richer and more intense chocolate experience while keeping the FLO+ recipe distinctly its own.",
      "35+. And into darker chocolate.",
      PLUS_70,
      ["Six 70% dark chocolate FLO+ bars"],
    ),
  }),
  item({
    id: "55333333-3333-4333-8333-333333333333",
    slug: "the-super-flo-plus-edition",
    name: "THE SUPER FLO+ EDITION",
    tagline: "Two chocolates. One FLO+.",
    description:
      "Both FLO+ favourites in one box: three 55% and three 70% dark chocolate bars, crafted for 35+.",
    imagePath: "/images/products/editions/the-super-flo-plus-edition.jpeg",
    badge: "Two chocolates. One FLO+.",
    shelfColor: "#b5179e",
    edition: "flo_plus",
    priceInr: 649,
    ingredients: [...new Set([...PLUS_55, ...PLUS_70])],
    content: content(
      "Both FLO+ favourites in one box. Three bars made with 55% dark chocolate and three made with 70% dark chocolate, bringing together both distinct FLO+ chocolate experiences in one six-bar pack crafted for 35+.",
      "Two chocolates. One FLO+.",
      [...new Set([...PLUS_55, ...PLUS_70])],
      ["3 × 55% FLO+ bars", "3 × 70% FLO+ bars"],
    ),
  }),
  item({
    id: "55444444-4444-4444-8444-444444444444",
    slug: "the-secret-flo-plus-edition",
    name: "THE SECRET FLO+ EDITION",
    tagline: "The + is certain. The mix isn't.",
    description:
      "Six bars from our distinct 35+ edition in a surprise mix of 55% and 70% dark chocolate.",
    imagePath: "/images/products/editions/the-secret-flo-plus-edition.jpeg",
    badge: "The + is certain. The mix isn't.",
    shelfColor: "#ffcc00",
    edition: "flo_plus",
    cornerRibbon: "Try this",
    priceInr: 649,
    ingredients: [...new Set([...PLUS_55, ...PLUS_70])],
    content: content(
      "A little mystery, the FLO+ way. Six bars from our distinct 35+ edition in a surprise combination of 55% and 70% dark chocolate. You know it's FLO+; the exact mix stays secret until you open the box.",
      "The + is certain. The mix isn't.",
      [...new Set([...PLUS_55, ...PLUS_70])],
      ["A surprise mix of 55% and 70% FLO+ bars (6 bars)"],
    ),
  }),
];

export function productsForEdition(
  products: Product[],
  edition: ProductEdition,
): Product[] {
  const tagged = products.filter((p) => p.edition === edition);
  if (tagged.length) return tagged;
  return edition === "flo" ? products.slice(0, 4) : products.slice(4, 8);
}
