-- Flo Circle checkout intro: ₹1 / 180 days + member discount timing

alter table public.orders
  add column if not exists membership_fee_inr integer not null default 0
    check (membership_fee_inr >= 0);

-- Checkout intro plan (₹1 for 6 months). Keep biannual as a separate paid plan if present.
insert into public.flo_circle_plans (
  slug, name, description, duration_days, price_inr, sort_order, perks, is_active
)
values (
  'flo_circle_intro',
  'Flo Circle Intro',
  'Join Flo Circle at checkout — ₹1 for 6 months',
  180,
  1,
  0,
  '["20% member pricing (per admin timing)","Priority packing","Member gifts","Early access","Events"]'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  duration_days = excluded.duration_days,
  price_inr = excluded.price_inr,
  sort_order = excluded.sort_order,
  perks = excluded.perks,
  is_active = true,
  updated_at = now();

-- Ensure standard plans exist (no-op if already seeded)
insert into public.flo_circle_plans (slug, name, description, duration_days, price_inr, sort_order, perks)
values
  ('monthly', 'Monthly', 'Flexible month-to-month Flo Circle membership', 30, 299, 1,
    '["20% off every order","Priority packing","Member gifts","Early access","Events"]'::jsonb),
  ('quarterly', '3 Months', 'Best starter — three months of circle benefits', 90, 799, 2,
    '["20% off every order","Priority packing","Member gifts","Early access","Events","Milestone gift"]'::jsonb),
  ('biannual', '6 Months', 'Half-year commitment, bigger savings rhythm', 180, 1499, 3,
    '["20% off every order","Priority packing","Member gifts","Early access","Events","Milestone gift"]'::jsonb),
  ('yearly', 'Yearly', 'Full year in the circle — best value', 365, 2499, 4,
    '["20% off every order","Priority packing","Member gifts","Early access","Events","Milestone + anniversary gifts"]'::jsonb)
on conflict (slug) do nothing;

-- When 20% member discount applies relative to paid order count
insert into public.site_settings (key, value)
values ('flo_circle_discount_timing', '"second_order"'::jsonb)
on conflict (key) do nothing;
