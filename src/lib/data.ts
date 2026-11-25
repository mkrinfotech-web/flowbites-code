/** Structured product accordion content (cart + PDP). */
export type ProductContent = {
  descriptionFormal: string;
  descriptionPunchy: string;
  nutritionSummary: string;
  nutritionBullets: string[];
  nutritionDisclaimer: string;
  /** Ingredient pills under “Thoughtfully Made With” */
  ingredients: string[];
  footerContains: string[];
  footerNote: string;
};

export type ProductEdition = "flo" | "flo_plus";

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  packLabel: string;
  priceInr: number;
  imagePath: string;
  badge: string;
  shelfColor: string;
  /** Best Sellers tab: THE FLO EDITION vs THE FLO+ EDITION */
  edition?: ProductEdition;
  /** Short ingredients list for empty-cart / product cards */
  ingredients?: string[];
  /** Corner ribbon on Best Sellers cards */
  cornerRibbon?: "Best seller" | "Try this";
  /** Rich accordion content (CMS + static fallback) */
  content?: ProductContent;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  authorName: string;
  city: string;
};

const FOOTER_NOTE =
  "Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.";

const NUTRITION_DISCLAIMER =
  "*As per nutritional analysis and applicable regulations.";

const MOOD_MUNCHER_INGREDIENTS = [
  "Pumpkin Seeds",
  "Black Raisins",
  "Puffed Ragi (Millet)",
  "55% Dark Chocolate",
  "Sesame Seeds",
  "Sunflower Seeds",
  "Dates",
  "Jaggery",
  "Flax Seeds",
  "Chicory Root Fibre (Inulin)",
  "Virgin Coconut Oil",
  "Brown Rice Syrup",
  "Cocoa Mass",
  "Amla Powder",
  "Natural Vanilla",
];

const CRAVING_CRUNCHER_INGREDIENTS = [
  "Dates Paste",
  "Puffed Ragi (Millet)",
  "Pumpkin Seeds",
  "55% Dark Chocolate",
  "Black Raisins",
  "Sesame Seeds",
  "Sunflower Seeds",
  "Chicory Root Fibre (Inulin)",
  "Brown Rice Syrup",
  "Virgin Coconut Oil",
  "Flax Seeds",
  "Cocoa Mass",
  "Amla Powder",
  "Natural Vanilla",
];

const SECRET_FLO_INGREDIENTS = [...MOOD_MUNCHER_INGREDIENTS];

const MOOD_MUNCHER_CONTENT: ProductContent = {
  descriptionFormal:
    "A thoughtfully curated combo of 3 Classic and 3 Dark Chocolate Flo Bites—bringing together wholesome grains, seeds and rich dark chocolate in one delicious pack, crafted for those days.",
  descriptionPunchy:
    "Chocolaty, crunchy, and made for that week. 55% dark chocolate, wholesome grains and seeds because your cravings deserve better than guilt.",
  nutritionSummary:
    "Classic FloBites: 30 g | 111 kcal · Dark Chocolate FloBites: 30 g | 138 kcal",
  nutritionBullets: [
    "Source of Iron*",
    "Source of Magnesium*",
    "Source of Zinc*",
    "High in Dietary Fibre*",
    "Made with Whole Grains & Seeds",
    "Includes Classic & 55% Dark Chocolate Flo Bites",
  ],
  nutritionDisclaimer: NUTRITION_DISCLAIMER,
  ingredients: MOOD_MUNCHER_INGREDIENTS,
  footerContains: [
    "3 × Classic Flo Bites",
    "3 × 55% Dark Chocolate Flo Bites",
  ],
  footerNote: FOOTER_NOTE,
};

const CRAVING_CRUNCHER_CONTENT: ProductContent = {
  descriptionFormal:
    "A thoughtfully curated pack of 6 Dark Chocolate Flo Bites, bringing together wholesome grains, seeds and 55% dark chocolate in one delicious pack, crafted for those days.",
  descriptionPunchy:
    "Classic or Dark Chocolate? Let your mood decide. Either way, it's packed with wholesome grains, seeds, dark chocolate and a little something your body actually asked for.",
  nutritionSummary: "30 g | 138 kcal",
  nutritionBullets: [
    "Source of Iron*",
    "Source of Magnesium*",
    "Source of Zinc*",
    "High in Dietary Fibre*",
    "Made with Whole Grains & Seeds",
    "Crafted with 55% Dark Chocolate",
  ],
  nutritionDisclaimer: NUTRITION_DISCLAIMER,
  ingredients: CRAVING_CRUNCHER_INGREDIENTS,
  footerContains: ["6 × 55% Dark Chocolate Flo Bites"],
  footerNote: FOOTER_NOTE,
};

const SECRET_FLO_CONTENT: ProductContent = {
  descriptionFormal:
    "A thoughtfully curated surprise pack of 6 Flo Bites, where every pack brings a unique combination of Classic and Dark Chocolate bars. Crafted with wholesome grains, seeds and dark chocolate for those days.",
  descriptionPunchy:
    "Shhh... we got you. Six bars, two flavours, zero spoilers. All you need to know - it's packed with super seeds, dark chocolate, and everything your cycle asked for. The rest? Unwrap and find out.",
  nutritionSummary:
    "Classic FloBites: 30 g | 111 kcal · Dark Chocolate FloBites: 30 g | 138 kcal",
  nutritionBullets: [
    "Source of Iron*",
    "Source of Magnesium*",
    "Source of Zinc*",
    "High in Dietary Fibre*",
    "Made with Whole Grains & Seeds",
    "A Surprise Mix of Classic & Dark Chocolate Flo Bites",
  ],
  nutritionDisclaimer: NUTRITION_DISCLAIMER,
  ingredients: SECRET_FLO_INGREDIENTS,
  footerContains: [
    "A surprise mix of Classic & 55% Dark Chocolate Flo Bites (6 bars)",
  ],
  footerNote: FOOTER_NOTE,
};

export { CATALOG_PRODUCTS as PRODUCTS } from "@/lib/product-catalog";

export const FAQS: Faq[] = [
  {
    id: "f1",
    question: "What is FloBites?",
    answer:
      "Flo Bites are seed cycling snacks made with seeds, ragi, dark chocolate, myo-inositol and other good ingredients — crafted for cravings, moods, and those days. Not medicine. Just better snacking.",
  },
  {
    id: "f2",
    question: "Is this medicine?",
    answer:
      "No. FloBites is a food product. We make no exaggerated health claims — just familiar ingredients chosen with your cycle in mind.",
  },
  {
    id: "f3",
    question: "How often can I eat it?",
    answer:
      "Enjoy 1–2 bites a day, especially during those days when cravings and energy dips show up. Listen to your body.",
  },
  {
    id: "f4",
    question: "What makes FloBites different from a regular protein bar?",
    answer:
      "Regular bars fill your stomach. FloBites is made keeping your cycle in mind — seeds, ragi, amla, and dark chocolate thoughtfully picked for those days.",
  },
  {
    id: "f5",
    question: "Are the ingredients really natural?",
    answer:
      "Yes. We use familiar, plant-based ingredients — no maida, no refined sugar, and nutritionist reviewed.",
  },
  {
    id: "f6",
    question: "Can men buy this as a gift?",
    answer:
      "Absolutely. FloBites makes a thoughtful gift for the women in your life — partners, sisters, moms, and besties.",
  },
  {
    id: "f7",
    question: "How does the subscription work?",
    answer:
      "Join Flo Circle for member pricing and optional auto-delivery so you never run out before those days. You can join from cart (₹1 · 6 months) or explore Flo Circle anytime.",
  },
  {
    id: "f8",
    question: "What's the shipping time?",
    answer:
      "Orders typically ship within 2–4 business days across India. You'll get tracking once your pack is on the way.",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "Those days come every month. Now Flo Bites does too. My little ritual for those days.",
    authorName: "Aditi",
    city: "Pune",
  },
  {
    id: "t2",
    quote:
      "I came for the chocolate craving. Stayed because it actually feels made for us.",
    authorName: "Kavya",
    city: "Hyderabad",
  },
  {
    id: "t3",
    quote:
      "Finally something that understands cravings on those days without making me feel guilty.",
    authorName: "Shena",
    city: "Mumbai",
  },
  {
    id: "t4",
    quote: "My bag has keys, lip balm and now Flo Bites before those days start.",
    authorName: "Riya",
    city: "Delhi",
  },
  {
    id: "t5",
    quote:
      "Love how it brings together seeds, ragi and chocolate in one yummy bite.",
    authorName: "Ananya",
    city: "Kolkata",
  },
  {
    id: "t6",
    quote: "Mom liked the ingredients. I loved the taste. That almost never happens!",
    authorName: "Nisha",
    city: "Chandigarh",
  },
  {
    id: "t7",
    quote:
      "Feels like someone finally thought about what women actually need during those days.",
    authorName: "Meera",
    city: "Goa",
  },
  {
    id: "t8",
    quote: "I don't fight my cravings anymore. I just keep my Flo Bites ready.",
    authorName: "Pooja",
    city: "Amritsar",
  },
  {
    id: "t9",
    quote:
      "Not another boring health bar. This one actually speaks your language.",
    authorName: "Ishita",
    city: "Chennai",
  },
  {
    id: "t10",
    quote: "A small bite of comfort on days when I need a little extra care.",
    authorName: "Swathi",
    city: "Bengaluru",
  },
  {
    id: "t11",
    quote: "My 4 PM snack changed. Especially during those days.",
    authorName: "Tanya",
    city: "Gurugram",
  },
];

/** Soft-retail grouped ingredients (client copy) */
export const INGREDIENT_GROUPS = [
  {
    id: "super-seeds",
    title: "Super Seeds",
    subtitle: "Pumpkin Seeds • Sunflower Seeds • Sesame Seeds • Flax Seeds",
    blurb:
      "A thoughtful blend of seeds that naturally provide magnesium, zinc, healthy fats and fibre as part of everyday nutrition.",
  },
  {
    id: "iron-duo",
    title: "The Iron + Vitamin C Duo",
    subtitle: "Black Raisins • Amla",
    blurb:
      "Black raisins and amla are thoughtfully paired to contribute iron and naturally occurring vitamin C as part of a balanced diet.",
  },
  {
    id: "ragi",
    title: "Powered by Ragi",
    subtitle: "An Ancient Indian Millet",
    blurb:
      "Known for its wholesome goodness, ragi brings natural fibre, texture and satisfying crunch to every bar.",
  },
  {
    id: "crafted",
    title: "Thoughtfully Crafted",
    subtitle:
      "Dates • Inulin • Virgin Coconut Oil • Brown Rice Syrup • Dark Chocolate",
    blurb: "Every ingredient has a purpose",
  },
  {
    id: "Inositol",
    title: "Myo Inositol",
    subtitle:
      "Included as part of Flo Bites' carefully selected ingredient blend for period-week nutrition.",
    blurb: "Every ingredient has a purpose",
  },
] as const;

/** @deprecated Prefer INGREDIENT_GROUPS — kept for any legacy imports */
export const INGREDIENTS = INGREDIENT_GROUPS.map((g) => ({
  name: g.title,
  blurb: g.blurb,
  subtitle: g.subtitle,
  side: "left" as const,
}));
