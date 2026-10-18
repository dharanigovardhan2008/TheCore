-- Phase 1: provider-aware orders + service-role-only fulfilment and refunds.
-- Extends the existing design (orders, plan_grants, recompute_entitlement).
-- Safe to run more than once. Does NOT drop fulfill_paid_order yet: drop it in a
-- later migration, after the new code that calls fulfill_payment is deployed.

-- 1. orders: provider-aware columns ----------------------------------------
alter table public.orders add column if not exists provider text not null default 'cashfree';
alter table public.orders add column if not exists product text not null default 'core';
alter table public.orders add column if not exists provider_checkout_id text;
alter table public.orders add column if not exists provider_order_id text;
alter table public.orders add column if not exists provider_subscription_id text;
-- refunded_paise and refunded_at already exist on orders.

update public.orders
   set provider_order_id = cf_order_id
 where provider = 'cashfree' and provider_order_id is null;

-- Replace old status/currency checks (names unknown) with explicit ones.
-- NOT VALID: new rows are checked, existing rows are not re-validated.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%status%' or pg_get_constraintdef(oid) ilike '%currency%')
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('created','pending','paid','failed','expired','refunded','partially_refunded')) not valid;

alter table public.orders drop constraint if exists orders_currency_check;
alter table public.orders add constraint orders_currency_check
  check (currency in ('INR','USD')) not valid;

alter table public.orders drop constraint if exists orders_provider_check;
alter table public.orders add constraint orders_provider_check
  check (provider in ('cashfree','polar'));

create unique index if not exists orders_provider_order_uidx
  on public.orders (provider, provider_order_id) where provider_order_id is not null;

-- Only the server (service_role) may write orders.
drop policy if exists "Users can insert own pending orders" on public.orders;
revoke insert, update, delete on public.orders from anon, authenticated;

-- 2. plan_configs: USD prices (must equal the Polar product prices) --------
alter table public.plan_configs add column if not exists price_month_usd numeric;
alter table public.plan_configs add column if not exists price_year_usd numeric;
-- These columns already exist. Set the pro prices (they must equal the Polar product prices):
--   update public.plan_configs set price_month_usd = 5, price_year_usd = 30 where id = 'pro';

-- 3. fulfil a payment (idempotent, service_role only) ----------------------
create or replace function public.fulfill_payment(
  p_provider text,
  p_order_ref text,
  p_provider_order_id text,
  p_user_id uuid,
  p_billing_cycle text,
  p_paid_amount integer,
  p_currency text,
  p_period_end timestamptz default null,
  p_subscription_id text default null,
  p_customer_id text default null
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders%rowtype;
  v_days integer;
  v_rows integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;
  if p_provider not in ('cashfree','polar') then
    raise exception 'invalid provider';
  end if;

  select * into o from public.orders
   where provider = p_provider and cf_order_id = p_order_ref
   for update;
  if not found then return 'not_found'; end if;

  if o.user_id is distinct from p_user_id then
    update public.orders set review_flag = 'user_mismatch' where id = o.id;
    return 'mismatch';
  end if;

  if o.status in ('paid','refunded','partially_refunded') then return 'duplicate'; end if;

  if p_paid_amount is distinct from o.amount_paise
     or upper(coalesce(p_currency, '')) <> upper(o.currency) then
    update public.orders set review_flag = 'amount_mismatch' where id = o.id;
    return 'mismatch';
  end if;

  -- Guarded transition: only one caller can win.
  update public.orders
     set status = 'paid',
         paid_at = now(),
         provider_order_id = coalesce(p_provider_order_id, provider_order_id),
         provider_subscription_id = coalesce(p_subscription_id, provider_subscription_id),
         cf_payment_session_id = null
   where id = o.id and status not in ('paid','refunded','partially_refunded');
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return 'duplicate'; end if;

  if p_provider = 'polar' and p_period_end is not null then
    v_days := greatest(1, ceil(extract(epoch from (p_period_end - now())) / 86400)::integer + 1);
  else
    v_days := case o.billing_cycle when 'year' then 365 else 30 end;
  end if;

  insert into public.plan_grants (user_id, source, order_id, days, granted_at)
  values (o.user_id, 'order', o.id, v_days, now())
  on conflict (order_id) do nothing;

  perform public.recompute_entitlement(o.user_id);
  return 'fulfilled';
end;
$$;

-- 4. refunds (idempotent, service_role only) --------------------------------
create or replace function public.refund_payment(
  p_provider text,
  p_order_ref text,
  p_provider_order_id text,
  p_refunded_total integer,
  p_is_full boolean
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;

  select * into o from public.orders
   where provider = p_provider and cf_order_id = p_order_ref
   for update;
  if not found then return 'not_found'; end if;

  -- refunded_paise only ever grows, so a repeated event changes nothing.
  if p_refunded_total <= coalesce(o.refunded_paise, 0) then return 'duplicate'; end if;

  if p_is_full then
    update public.orders
       set status = 'refunded', refunded_paise = p_refunded_total, refunded_at = now()
     where id = o.id;
    -- Revoke only this purchase's grant (keeps the audit trail), then recompute.
    update public.plan_grants
       set revoked_at = now(), reason = 'refund'
     where order_id = o.id and revoked_at is null;
    perform public.recompute_entitlement(o.user_id);
    return 'refunded';
  end if;

  update public.orders
     set status = 'partially_refunded', refunded_paise = p_refunded_total, refunded_at = now()
   where id = o.id;
  return 'partially_refunded';
end;
$$;

revoke all on function public.fulfill_payment(text, text, text, uuid, text, integer, text, timestamptz, text, text)
  from public, anon, authenticated;
grant execute on function public.fulfill_payment(text, text, text, uuid, text, integer, text, timestamptz, text, text)
  to service_role;

revoke all on function public.refund_payment(text, text, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.refund_payment(text, text, text, integer, boolean)
  to service_role;