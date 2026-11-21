-- Commerce polish: order confirmation email audit + idempotent stock decrement
-- Depends on 001_init.sql, 002_cms_admin.sql

alter table public.orders
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists stock_decremented_at timestamptz;

-- Atomically decrement stock for a paid order once (idempotent via stock_decremented_at).
create or replace function public.decrement_stock_for_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  already timestamptz;
  item record;
begin
  select stock_decremented_at into already
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return false;
  end if;

  if already is not null then
    return true;
  end if;

  for item in
    select product_id, quantity
    from public.order_items
    where order_id = p_order_id
  loop
    update public.products
    set stock_qty = greatest(0, stock_qty - item.quantity)
    where id = item.product_id;
  end loop;

  update public.orders
  set stock_decremented_at = now()
  where id = p_order_id
    and stock_decremented_at is null;

  return true;
end;
$$;

revoke all on function public.decrement_stock_for_order(uuid) from public;
grant execute on function public.decrement_stock_for_order(uuid) to service_role;
