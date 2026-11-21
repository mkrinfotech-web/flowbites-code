-- Best Sellers editions: THE FLO vs THE FLO+ (8 SKUs)
-- Soft-deactivate legacy 3-up SKUs (keep rows for order_items FKs).

alter table public.products
  add column if not exists edition text default 'flo';

update public.products
set edition = 'flo'
where edition is null;

alter table public.products
  alter column edition set default 'flo';

alter table public.products
  drop constraint if exists products_edition_check;

alter table public.products
  add constraint products_edition_check
  check (edition in ('flo', 'flo_plus'));

-- Legacy storefront SKUs + close variants
update public.products
set is_active = false
where slug in (
    'craving-cruncher',
    'mood-muncher',
    'secret-flo',
    'secret-box',
    'craving_cruncher',
    'mood_muncher'
  )
  or (
    slug similar to '(craving-cruncher|mood-muncher|secret-flo)%'
    and slug not like '%edition%'
  );

-- Upsert 8 catalog SKUs by slug (keep existing ids if slug already present).
insert into public.products (
  id, slug, name, tagline, description, pack_label, price_inr,
  image_path, badge, shelf_color, edition, is_active, sort_order, stock_qty, content
) values
(
  '44111111-1111-4111-8111-111111111111',
  'the-flo-edition',
  'THE FLO EDITION',
  'Your Flo starts here.',
  'A thoughtfully crafted pack of six 55% dark chocolate Flo Bites made for your period-week snack routine.',
  'Pack of 6',
  549,
  '/images/products/editions/the-flo-edition.jpeg',
  'Your Flo starts here.',
  '#fa3558',
  'flo',
  true,
  1,
  100,
  jsonb_build_object(
    'description_formal', $c$A thoughtfully crafted pack of six 55% dark chocolate Flo Bites made for your period-week snack routine. Chocolatey, crunchy and easy to keep handy when you want something made with your Flo in mind.$c$,
    'description_punchy', 'Your Flo starts here.',
    'nutrition_summary', 'Pack of 6',
    'nutrition_bullets', '[]'::jsonb,
    'nutrition_disclaimer', '*As per nutritional analysis and applicable regulations.',
    'ingredients', jsonb_build_array(
      'Puffed Ragi','Dates Paste','Pea Protein Isolate','Pumpkin Seeds',
      'Morde 55% Dark Chocolate','Sesame Seeds','Sunflower Seeds','Chicory Inulin',
      'Black Raisins','Flax Seeds','Honey','Resistant Dextrin','Myo-Inositol',
      'Virgin Coconut Oil','Amla Powder','Salt','Rosemary Extract'
    ),
    'footer_contains', jsonb_build_array('Six 55% dark chocolate Flo Bites'),
    'footer_note', 'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
  )
),
(
  '44222222-2222-4222-8222-222222222222',
  'the-extra-flo-edition',
  'THE EXTRA FLO EDITION',
  'Like it darker? Go Extra.',
  'A pack of six Flo Bites for those who prefer a deeper, more intense dark chocolate experience. Made with 70% dark chocolate.',
  'Pack of 6',
  549,
  '/images/products/editions/the-extra-flo-edition.jpeg',
  'Like it darker? Go Extra.',
  '#7a1f3d',
  'flo',
  true,
  2,
  100,
  jsonb_build_object(
    'description_formal', $c$A pack of six Flo Bites for those who prefer a deeper, more intense dark chocolate experience. Made with 70% dark chocolate and thoughtfully crafted for period-week snacking.$c$,
    'description_punchy', 'Like it darker? Go Extra.',
    'nutrition_summary', 'Pack of 6',
    'nutrition_bullets', '[]'::jsonb,
    'nutrition_disclaimer', '*As per nutritional analysis and applicable regulations.',
    'ingredients', jsonb_build_array(
      'Puffed Ragi','Dates Paste','Pea Protein Isolate','Morde 70% Dark Chocolate',
      'Pumpkin Seeds','Sesame Seeds','Sunflower Seeds','Chicory Inulin','Flax Seeds',
      'Black Raisins','Resistant Dextrin','Myo-Inositol','Virgin Coconut Oil',
      'Amla Powder','Salt','Rosemary Extract'
    ),
    'footer_contains', jsonb_build_array('Six 70% dark chocolate Flo Bites'),
    'footer_note', 'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
  )
),
(
  '44333333-3333-4333-8333-333333333333',
  'the-super-flo-edition',
  'THE SUPER FLO EDITION',
  'Why choose? Have both.',
  'Three bars made with 55% dark chocolate and three made with 70% dark chocolate in one six-bar period-week pack.',
  'Pack of 6',
  549,
  '/images/products/editions/the-super-flo-edition.jpeg',
  'Why choose? Have both.',
  '#fa3558',
  'flo',
  true,
  3,
  100,
  jsonb_build_object(
    'description_formal', $c$The best of both Flos in one box. Three bars made with 55% dark chocolate and three made with 70% dark chocolate, giving you two distinct chocolate experiences in one six-bar period-week pack.$c$,
    'description_punchy', 'Why choose? Have both.',
    'nutrition_summary', 'Pack of 6',
    'nutrition_bullets', '[]'::jsonb,
    'nutrition_disclaimer', '*As per nutritional analysis and applicable regulations.',
    'ingredients', jsonb_build_array(
      'Puffed Ragi','Dates Paste','Pea Protein Isolate','Pumpkin Seeds',
      'Morde 55% Dark Chocolate','Sesame Seeds','Sunflower Seeds','Chicory Inulin',
      'Black Raisins','Flax Seeds','Honey','Resistant Dextrin','Myo-Inositol',
      'Virgin Coconut Oil','Amla Powder','Salt','Rosemary Extract',
      'Morde 70% Dark Chocolate'
    ),
    'footer_contains', jsonb_build_array(
      '3 × 55% dark chocolate Flo Bites',
      '3 × 70% dark chocolate Flo Bites'
    ),
    'footer_note', 'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
  )
),
(
  '44444444-4444-4444-8444-444444444444',
  'the-secret-flo-edition',
  'THE SECRET FLO EDITION',
  'Unbox your Flo.',
  'Six Flo Bites. Two dark chocolate choices. One surprise combination of 55% and 70% until you open the box.',
  'Pack of 6',
  499,
  '/images/products/editions/the-secret-flo-edition.jpeg',
  'Unbox your Flo.',
  '#ffcc00',
  'flo',
  true,
  4,
  100,
  jsonb_build_object(
    'description_formal', $c$Six Flo Bites. Two dark chocolate choices. One surprise combination. Your box can contain any mix of our 55% and 70% dark chocolate Flo Bites, so the exact Flo stays a secret until you open it.$c$,
    'description_punchy', 'Unbox your Flo.',
    'nutrition_summary', 'Pack of 6',
    'nutrition_bullets', '[]'::jsonb,
    'nutrition_disclaimer', '*As per nutritional analysis and applicable regulations.',
    'ingredients', jsonb_build_array(
      'Puffed Ragi','Dates Paste','Pea Protein Isolate','Pumpkin Seeds',
      'Morde 55% Dark Chocolate','Sesame Seeds','Sunflower Seeds','Chicory Inulin',
      'Black Raisins','Flax Seeds','Honey','Resistant Dextrin','Myo-Inositol',
      'Virgin Coconut Oil','Amla Powder','Salt','Rosemary Extract',
      'Morde 70% Dark Chocolate'
    ),
    'footer_contains', jsonb_build_array(
      'A surprise mix of 55% and 70% dark chocolate Flo Bites (6 bars)'
    ),
    'footer_note', 'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
  )
),
(
  '55111111-1111-4111-8111-111111111111',
  'the-flo-plus-edition',
  'THE FLO+ EDITION',
  'Your Flo. Now with a +.',
  'A distinct Flo Bites recipe thoughtfully crafted for women 35+. Six bars with 55% dark chocolate.',
  'Pack of 6',
  549,
  '/images/products/editions/the-flo-plus-edition.jpeg',
  'Your Flo. Now with a +.',
  '#b5179e',
  'flo_plus',
  true,
  5,
  100,
  jsonb_build_object(
    'description_formal', $c$A distinct Flo Bites recipe thoughtfully crafted for women 35+. This six-bar pack brings the familiar Flo experience into a recipe created especially for the FLO+ edition, with 55% dark chocolate.$c$,
    'description_punchy', 'Your Flo. Now with a +.',
    'nutrition_summary', 'Pack of 6',
    'nutrition_bullets', '[]'::jsonb,
    'nutrition_disclaimer', '*As per nutritional analysis and applicable regulations.',
    'ingredients', jsonb_build_array(
      'Puffed Ragi','Dates Paste','Pea Protein Isolate','Morde 55% Dark Chocolate',
      'Pumpkin Seeds','Sesame Seeds','Chicory Inulin','Almonds','Honey',
      'Flax Seeds','Chia Seeds','Resistant Dextrin','Myo-Inositol','Amla Powder',
      'Virgin Coconut Oil','Salt','Rosemary Extract'
    ),
    'footer_contains', jsonb_build_array('Six 55% dark chocolate FLO+ bars'),
    'footer_note', 'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
  )
),
(
  '55222222-2222-4222-8222-222222222222',
  'the-extra-flo-plus-edition',
  'THE EXTRA FLO+ EDITION',
  '35+. And into darker chocolate.',
  'The darker side of FLO+. Six bars from our distinct 35+ edition, made with 70% dark chocolate.',
  'Pack of 6',
  549,
  '/images/products/editions/the-extra-flo-plus-edition.jpeg',
  '35+. And into darker chocolate.',
  '#6a1b9a',
  'flo_plus',
  true,
  6,
  100,
  jsonb_build_object(
    'description_formal', $c$The darker side of FLO+. Six bars from our distinct 35+ edition, made with 70% dark chocolate for a richer and more intense chocolate experience while keeping the FLO+ recipe distinctly its own.$c$,
    'description_punchy', '35+. And into darker chocolate.',
    'nutrition_summary', 'Pack of 6',
    'nutrition_bullets', '[]'::jsonb,
    'nutrition_disclaimer', '*As per nutritional analysis and applicable regulations.',
    'ingredients', jsonb_build_array(
      'Puffed Ragi','Pea Protein Isolate','Dates Paste','Morde 70% Dark Chocolate',
      'Pumpkin Seeds','Sesame Seeds','Chicory Inulin','Almonds','Flax Seeds',
      'Chia Seeds','Resistant Dextrin','Myo-Inositol','Amla Powder',
      'Virgin Coconut Oil','Salt','Rosemary Extract'
    ),
    'footer_contains', jsonb_build_array('Six 70% dark chocolate FLO+ bars'),
    'footer_note', 'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
  )
),
(
  '55333333-3333-4333-8333-333333333333',
  'the-super-flo-plus-edition',
  'THE SUPER FLO+ EDITION',
  'Two chocolates. One FLO+.',
  'Both FLO+ favourites in one box: three 55% and three 70% dark chocolate bars, crafted for 35+.',
  'Pack of 6',
  549,
  '/images/products/editions/the-super-flo-plus-edition.jpeg',
  'Two chocolates. One FLO+.',
  '#b5179e',
  'flo_plus',
  true,
  7,
  100,
  jsonb_build_object(
    'description_formal', $c$Both FLO+ favourites in one box. Three bars made with 55% dark chocolate and three made with 70% dark chocolate, bringing together both distinct FLO+ chocolate experiences in one six-bar pack crafted for 35+.$c$,
    'description_punchy', 'Two chocolates. One FLO+.',
    'nutrition_summary', 'Pack of 6',
    'nutrition_bullets', '[]'::jsonb,
    'nutrition_disclaimer', '*As per nutritional analysis and applicable regulations.',
    'ingredients', jsonb_build_array(
      'Puffed Ragi','Dates Paste','Pea Protein Isolate','Morde 55% Dark Chocolate',
      'Pumpkin Seeds','Sesame Seeds','Chicory Inulin','Almonds','Honey',
      'Flax Seeds','Chia Seeds','Resistant Dextrin','Myo-Inositol','Amla Powder',
      'Virgin Coconut Oil','Salt','Rosemary Extract','Morde 70% Dark Chocolate'
    ),
    'footer_contains', jsonb_build_array('3 × 55% FLO+ bars', '3 × 70% FLO+ bars'),
    'footer_note', 'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
  )
),
(
  '55444444-4444-4444-8444-444444444444',
  'the-secret-flo-plus-edition',
  'THE SECRET FLO+ EDITION',
  'The + is certain. The mix isn''t.',
  'Six bars from our distinct 35+ edition in a surprise mix of 55% and 70% dark chocolate.',
  'Pack of 6',
  499,
  '/images/products/editions/the-secret-flo-plus-edition.jpeg',
  'The + is certain. The mix isn''t.',
  '#ffcc00',
  'flo_plus',
  true,
  8,
  100,
  jsonb_build_object(
    'description_formal', $c$A little mystery, the FLO+ way. Six bars from our distinct 35+ edition in a surprise combination of 55% and 70% dark chocolate. You know it's FLO+; the exact mix stays secret until you open the box.$c$,
    'description_punchy', $c$The + is certain. The mix isn't.$c$,
    'nutrition_summary', 'Pack of 6',
    'nutrition_bullets', '[]'::jsonb,
    'nutrition_disclaimer', '*As per nutritional analysis and applicable regulations.',
    'ingredients', jsonb_build_array(
      'Puffed Ragi','Dates Paste','Pea Protein Isolate','Morde 55% Dark Chocolate',
      'Pumpkin Seeds','Sesame Seeds','Chicory Inulin','Almonds','Honey',
      'Flax Seeds','Chia Seeds','Resistant Dextrin','Myo-Inositol','Amla Powder',
      'Virgin Coconut Oil','Salt','Rosemary Extract','Morde 70% Dark Chocolate'
    ),
    'footer_contains', jsonb_build_array(
      'A surprise mix of 55% and 70% FLO+ bars (6 bars)'
    ),
    'footer_note', 'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
  )
)
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  pack_label = excluded.pack_label,
  price_inr = excluded.price_inr,
  image_path = excluded.image_path,
  badge = excluded.badge,
  shelf_color = excluded.shelf_color,
  edition = excluded.edition,
  is_active = true,
  sort_order = excluded.sort_order,
  content = excluded.content;
