-- Idempotent flags for shipped / delivered status emails

alter table public.orders
  add column if not exists shipped_email_sent_at timestamptz,
  add column if not exists delivered_email_sent_at timestamptz;
