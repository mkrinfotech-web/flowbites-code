-- Seed CMS policy / trust pages for FloBites

insert into public.pages (
  slug, title, type, body_md, seo_title, seo_description, is_published, published_at, sort_order
) values
(
  'privacy',
  'Privacy Policy',
  'policy',
  E'# Privacy Policy\n\nLast updated: July 2026\n\nThe Hormone Essentials ("FloBites", "we", "us") respects your privacy.\n\n## Information we collect\n\n- Contact details you provide at checkout (name, email, phone, shipping address)\n- Order and payment references (we do not store full card details; payments are processed by Razorpay)\n- Basic site analytics and device information\n\n## How we use information\n\n- To fulfil and support your orders\n- To send order updates and respond to support requests\n- To improve our products and website\n\n## Sharing\n\nWe share data only with service providers needed to run the store (payments, hosting, email) and when required by law.\n\n## Your choices\n\nContact us at **reach@thehormoneessentials.com** to request access or deletion of your personal data where applicable.\n\n## Contact\n\nThe Hormone Essentials  \nEmail: reach@thehormoneessentials.com',
  'Privacy Policy — FloBites',
  'How FloBites collects and uses your information.',
  true,
  now(),
  1
),
(
  'terms',
  'Terms of Service',
  'policy',
  E'# Terms of Service\n\nLast updated: July 2026\n\nBy purchasing from FloBites / The Hormone Essentials you agree to these terms.\n\n## Products\n\nFloBites are food products. They are not medicines and make no exaggerated health claims.\n\n## Orders & pricing\n\nPrices are listed in INR and may change. We reserve the right to cancel orders with pricing or stock errors and will notify you.\n\n## Acceptance\n\nPlacing an order constitutes an offer to buy. We accept when payment is confirmed and the order moves to processing.\n\n## Limitation\n\nTo the fullest extent permitted by law, our liability is limited to the amount you paid for the relevant order.\n\n## Contact\n\nreach@thehormoneessentials.com',
  'Terms of Service — FloBites',
  'Terms for shopping FloBites online.',
  true,
  now(),
  2
),
(
  'shipping',
  'Shipping Policy',
  'policy',
  E'# Shipping Policy\n\n## Dispatch\n\nOrders typically ship within **2–4 business days** across India after payment confirmation.\n\n## Delivery\n\nDelivery timelines vary by pincode. You will receive tracking once your pack is on the way.\n\n## Address accuracy\n\nPlease double-check your shipping address at checkout. We are not responsible for delays caused by incorrect addresses.\n\n## Questions\n\nEmail **reach@thehormoneessentials.com** with your order number.',
  'Shipping Policy — FloBites',
  'Dispatch and delivery timelines for FloBites orders.',
  true,
  now(),
  3
),
(
  'refunds',
  'Refunds & Returns',
  'policy',
  E'# Refunds & Returns\n\n## Food products\n\nBecause FloBites are food items, we generally cannot accept returns of opened packs for hygiene reasons.\n\n## Damaged or wrong items\n\nIf your order arrives damaged or incorrect, email **reach@thehormoneessentials.com** within 48 hours of delivery with your order number and photos. We will arrange a replacement or refund where appropriate.\n\n## Payment issues\n\nFailed or duplicate charges are reviewed case-by-case with our payment partner.',
  'Refunds & Returns — FloBites',
  'How FloBites handles refunds and damaged orders.',
  true,
  now(),
  4
),
(
  'contact',
  'Contact',
  'contact',
  E'# Contact us\n\nWe''d love to hear from you.\n\n**Email:** reach@thehormoneessentials.com  \n**Brand:** FloBites by The Hormone Essentials\n\nFor order support, include your order number and the email used at checkout.\n\nTypical response time: 1–2 business days.',
  'Contact — FloBites',
  'Get in touch with the FloBites team.',
  true,
  now(),
  5
),
(
  'about',
  'About FloBites',
  'about',
  E'# About FloBites\n\nFlo Bites are seed cycling snacks made with seeds, ragi, dark chocolate, myo-inositol and other good ingredients — crafted for cravings, moods, and those days.\n\nWe''re **The Hormone Essentials**: soft-retail comfort food that understands your cycle without pretending to be medicine.\n\n## What we believe\n\n- Cravings deserve better than random chocolates\n- Familiar ingredients, thoughtfully chosen\n- No maida, no refined sugar\n\nCrafted for those days. Relished and Nourished.',
  'About — FloBites',
  'Meet FloBites — period-week snacks by The Hormone Essentials.',
  true,
  now(),
  6
)
on conflict (slug) do update set
  title = excluded.title,
  body_md = excluded.body_md,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  is_published = excluded.is_published,
  published_at = coalesce(public.pages.published_at, excluded.published_at),
  updated_at = now();
