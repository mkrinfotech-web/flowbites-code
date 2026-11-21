-- Customer account: link guest orders by email + stronger RLS

create index if not exists orders_customer_email_idx
  on public.orders (lower(customer_email));

-- Customers can read orders tied to their auth user OR matching email (guest checkout claim)
drop policy if exists "Customer read own orders" on public.orders;
create policy "Customer read own orders"
  on public.orders for select to authenticated
  using (
    public.is_staff()
    or user_id = auth.uid()
    or lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Customer read own order items" on public.order_items;
create policy "Customer read own order items"
  on public.order_items for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.user_id = auth.uid()
          or lower(o.customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

-- Claim guest orders when a customer registers / signs in
create or replace function public.link_guest_orders_for_user(p_user_id uuid, p_email text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if p_user_id is null or p_email is null or length(trim(p_email)) = 0 then
    return 0;
  end if;

  update public.orders
  set user_id = p_user_id
  where user_id is null
    and lower(customer_email) = lower(trim(p_email));

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.link_guest_orders_for_user(uuid, text) from public;
grant execute on function public.link_guest_orders_for_user(uuid, text) to service_role;
