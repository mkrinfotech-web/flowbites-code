-- Product rich content (accordion: description / nutrition / ingredients / footer)
alter table public.products
  add column if not exists content jsonb not null default '{}'::jsonb;

comment on column public.products.content is
  'Structured PDP/cart accordion fields: description_formal, description_punchy, nutrition_summary, nutrition_bullets, nutrition_disclaimer, ingredients, footer_contains, footer_note';

-- Mood Muncher
update public.products
set content = jsonb_build_object(
  'description_formal',
  'A thoughtfully curated combo of 3 Classic and 3 Dark Chocolate Flo Bites—bringing together wholesome grains, seeds, myo-inositol and rich dark chocolate in one delicious pack, crafted for your period week.',
  'description_punchy',
  'Chocolaty, crunchy, and made for that week. 55% dark chocolate wholesome grains, seeds and myo-inositol because your cravings deserve better than guilt.',
  'nutrition_summary',
  'Classic FloBites: 30 g | 111 kcal · Dark Chocolate FloBites: 30 g | 138 kcal',
  'nutrition_bullets',
  jsonb_build_array(
    'Source of Iron*',
    'Source of Magnesium*',
    'Source of Zinc*',
    'High in Dietary Fibre*',
    'Made with Whole Grains & Seeds',
    'Includes Classic & 55% Dark Chocolate Flo Bites'
  ),
  'nutrition_disclaimer',
  '*As per nutritional analysis and applicable regulations.',
  'ingredients',
  jsonb_build_array(
    'Pumpkin Seeds',
    'Black Raisins',
    'Puffed Ragi (Millet)',
    '55% Dark Chocolate',
    'Sesame Seeds',
    'Sunflower Seeds',
    'Dates',
    'Jaggery',
    'Flax Seeds',
    'Chicory Root Fibre (Inulin)',
    'Virgin Coconut Oil',
    'Brown Rice Syrup',
    'Cocoa Mass',
    'Amla Powder',
    'Natural Vanilla',
    'Myo-Inositol'
  ),
  'footer_contains',
  jsonb_build_array(
    '3 × Classic Flo Bites',
    '3 × 55% Dark Chocolate Flo Bites'
  ),
  'footer_note',
  'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
)
where slug = 'mood-muncher';

-- Craving Cruncher
update public.products
set content = jsonb_build_object(
  'description_formal',
  'A thoughtfully curated pack of 6 Dark Chocolate Flo Bites, bringing together wholesome grains, seeds, 55% dark chocolate and myo-inositol in one delicious pack, crafted for your period week.',
  'description_punchy',
  'Classic or Dark Chocolate? Let your mood decide. Either way, it''s packed with wholesome grains, seeds, myo-inositol and a little something your body actually asked for.',
  'nutrition_summary',
  '30 g | 138 kcal',
  'nutrition_bullets',
  jsonb_build_array(
    'Source of Iron*',
    'Source of Magnesium*',
    'Source of Zinc*',
    'High in Dietary Fibre*',
    'Made with Whole Grains & Seeds',
    'Crafted with 55% Dark Chocolate'
  ),
  'nutrition_disclaimer',
  '*As per nutritional analysis and applicable regulations.',
  'ingredients',
  jsonb_build_array(
    'Dates Paste',
    'Puffed Ragi (Millet)',
    'Pumpkin Seeds',
    '55% Dark Chocolate',
    'Black Raisins',
    'Sesame Seeds',
    'Sunflower Seeds',
    'Chicory Root Fibre (Inulin)',
    'Brown Rice Syrup',
    'Virgin Coconut Oil',
    'Flax Seeds',
    'Cocoa Mass',
    'Amla Powder',
    'Natural Vanilla',
    'Myo-Inositol'
  ),
  'footer_contains',
  jsonb_build_array(
    '6 × 55% Dark Chocolate Flo Bites'
  ),
  'footer_note',
  'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
)
where slug = 'craving-cruncher';

-- Secret Flo
update public.products
set content = jsonb_build_object(
  'description_formal',
  'A thoughtfully curated surprise pack of 6 Flo Bites, where every pack brings a unique combination of Classic and Dark Chocolate bars. Crafted with wholesome grains, seeds and myo-inositol for your period week.',
  'description_punchy',
  'Shhh... we got you. Six bars, two flavours, zero spoilers. All you need to know - it''s packed with super seeds, myo-inositol, and everything your cycle asked for. The rest? Unwrap and find out.',
  'nutrition_summary',
  'Classic FloBites: 30 g | 111 kcal · Dark Chocolate FloBites: 30 g | 138 kcal',
  'nutrition_bullets',
  jsonb_build_array(
    'Source of Iron*',
    'Source of Magnesium*',
    'Source of Zinc*',
    'High in Dietary Fibre*',
    'Made with Whole Grains & Seeds',
    'A Surprise Mix of Classic & Dark Chocolate Flo Bites'
  ),
  'nutrition_disclaimer',
  '*As per nutritional analysis and applicable regulations.',
  'ingredients',
  jsonb_build_array(
    'Pumpkin Seeds',
    'Black Raisins',
    'Puffed Ragi (Millet)',
    '55% Dark Chocolate',
    'Sesame Seeds',
    'Sunflower Seeds',
    'Dates',
    'Jaggery',
    'Flax Seeds',
    'Chicory Root Fibre (Inulin)',
    'Virgin Coconut Oil',
    'Brown Rice Syrup',
    'Cocoa Mass',
    'Amla Powder',
    'Natural Vanilla',
    'Myo-Inositol'
  ),
  'footer_contains',
  jsonb_build_array(
    'A surprise mix of Classic & 55% Dark Chocolate Flo Bites (6 bars)'
  ),
  'footer_note',
  'Please refer to the individual bar wrappers for the complete nutritional information and ingredient declaration of each variant.'
)
where slug = 'secret-flo';
