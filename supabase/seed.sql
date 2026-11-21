-- Seed products, FAQs, testimonials

insert into public.products (
  id, slug, name, tagline, description, pack_label, price_inr, image_path, badge, shelf_color, sort_order
) values
(
  '11111111-1111-4111-8111-111111111111',
  'craving-cruncher',
  'Craving Cruncher',
  '6 Dark Chocolate Flo Bites',
  'When chocolate cravings hit. Crunch smarter. Your period cravings deserve better than random chocolates.',
  'Pack of 6',
  549,
  '/images/products/craving-cruncher.png',
  'Chocolate calling? Answer better.',
  '#fa3558',
  1
),
(
  '22222222-2222-4222-8222-222222222222',
  'mood-muncher',
  'Mood Muncher',
  '3 Dark Chocolate + 3 Classic Flo Bites',
  'Some days feel like chocolate. Some days feel classic. A delicious mix of Flo Bites crafted for your changing cravings through your cycle.',
  'Pack of 6',
  499,
  '/images/products/mood-muncher.png',
  'Every mood deserves its bite.',
  '#fa3558',
  2
),
(
  '33333333-3333-4333-8333-333333333333',
  'secret-flo',
  'SECRET FLO',
  '6 Surprise Flo Bites',
  'A mystery mix of Flo Bites favorites picked for you, packed with delicious comfort and period-week goodness.',
  'Pack of 6',
  499,
  '/images/products/secret-box.png',
  'Unbox the surprise.',
  '#ffcc00',
  3
)
on conflict (id) do update set
  name = excluded.name,
  price_inr = excluded.price_inr,
  description = excluded.description;

insert into public.faqs (question, answer, sort_order) values
('What is FloBites?', 'FloBites are thoughtfully crafted period-week snacks. Not medicine. Just better snacking.', 1),
('Is this medicine?', 'No. FloBites is a food product. We make no exaggerated health claims — just familiar ingredients chosen with your cycle in mind.', 2),
('How often can I eat it?', 'Enjoy 1–2 bites a day, especially during period week when cravings and energy dips show up. Listen to your body.', 3),
('What makes FloBites different from a regular protein bar?', 'Regular bars fill your stomach. FloBites is made keeping your cycle in mind — seeds, ragi, amla, and Myo-Inositol thoughtfully picked for period-week nutrition.', 4),
('Are the ingredients really natural?', 'Yes. We use familiar, plant-based ingredients — no maida, no refined sugar. FSSAI compliant and nutritionist reviewed.', 5),
('Can men buy this as a gift?', 'Absolutely. FloBites makes a thoughtful gift for the women in your life — partners, sisters, moms, and besties.', 6),
('How does the subscription work?', 'Subscribe for 6 months and never run out before period week. You will see subscription options at checkout when available.', 7),
('What''s the shipping time?', 'Orders typically ship within 2–4 business days across India. You will get tracking once your pack is on the way.', 8);

insert into public.testimonials (quote, author_name, city, sort_order) values
('Periods come every month. Now Flo Bites does too. My little period-week ritual.', 'Aditi', 'Pune', 1),
('I came for the chocolate craving. Stayed because it actually feels made for us.', 'Kavya', 'Hyderabad', 2),
('Finally something that understands period cravings without making me feel guilty.', 'Shena', 'Mumbai', 3),
('My bag has keys, lip balm and now Flo Bites before my period starts.', 'Riya', 'Delhi', 4),
('Love how it brings together seeds, ragi and chocolate in one yummy bite.', 'Ananya', 'Kolkata', 5),
('Mom liked the ingredients. I loved the taste. That almost never happens!', 'Nisha', 'Chandigarh', 6),
('Feels like someone finally thought about what women actually need during those days.', 'Meera', 'Goa', 7),
('I don''t fight my cravings anymore. I just keep my Flo Bites ready.', 'Pooja', 'Amritsar', 8),
('Not another boring health bar. This one actually speaks period language.', 'Ishita', 'Chennai', 9),
('A small bite of comfort on days when I need a little extra care.', 'Swathi', 'Bengaluru', 10),
('My 4 PM snack changed. Especially during period week.', 'Tanya', 'Gurugram', 11);
