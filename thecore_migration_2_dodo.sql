-- =============================================================================
-- TheCore - MIGRATION 2: add Dodo Payments as the international provider
-- Run ONCE in Supabase SQL Editor AFTER thecore_complete_migration.sql.
-- Safe to re-run. Old 'polar' values stay valid; new payments use 'dodo'.
-- (Column names polar_customer_id / polar_subscription_id are kept; they now hold the Dodo IDs.)
-- =============================================================================

begin;

-- 1. Allow 'dodo' in the provider columns (drops the old check, whatever its name).
do $do$
declare r record;
begin
  for r in
    select c.conname, c.conrelid::regclass as tbl
      from pg_constraint c
     where c.contype = 'c'
       and c.conrelid in ('public.orders'::regclass, 'public.profiles'::regclass)
       and (pg_get_constraintdef(c.oid) ilike '%provider in%' or pg_get_constraintdef(c.oid) ilike '%provider = any%')
       and pg_get_constraintdef(c.oid) ilike '%cashfree%'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end
$do$;

alter table public.orders
  add constraint orders_provider_check check (provider in ('cashfree', 'polar', 'dodo'));
alter table public.profiles
  add constraint profiles_plan_provider_check check (plan_provider is null or plan_provider in ('cashfree', 'polar', 'dodo'));

-- 2. Payment functions, now accepting 'dodo' (same logic as before).
create or replace function public.fulfill_payment(
  p_provider          text,
  p_order_ref         text,                 -- our reference (orders.cf_order_id)
  p_provider_order_id text,                 -- Polar order id (null for Cashfree)
  p_user_id           uuid,
  p_billing_cycle     text,                 -- 'month' | 'year'
  p_paid_amount       integer,              -- minor units, before tax
  p_currency          text,
  p_period_end        timestamptz default null,   -- Polar: end of the paid period
  p_subscription_id   text        default null,
  p_customer_id       text        default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order     public.orders%rowtype;
  v_current   timestamptz;
  v_base      timestamptz;
  v_new       timestamptz;
  v_expected  integer;
begin
  if auth.role() in ('anon', 'authenticated') then
    raise exception 'fulfill_payment is restricted to the server';
  end if;
  if p_provider not in ('cashfree', 'polar', 'dodo') or p_billing_cycle not in ('month', 'year') then
    raise exception 'invalid provider or billing cycle';
  end if;

  -- Find (and lock) our order.
  select * into v_order from public.orders
   where provider = p_provider and cf_order_id = p_order_ref
   for update;

  -- Polar: maybe we already stored this Polar order under another reference.
  if v_order.id is null and p_provider in ('polar', 'dodo') and p_provider_order_id is not null then
    select * into v_order from public.orders
     where provider = p_provider and provider_order_id = p_provider_order_id
     for update;
  end if;

  -- Polar renewals have no pre-created order: create one from the plan price.
  if v_order.id is null and p_provider in ('polar', 'dodo') and p_provider_order_id is not null then
    if not exists (select 1 from public.profiles where id = p_user_id) then
      return 'not_found';
    end if;
    select round((case when p_billing_cycle = 'year' then price_year_usd else price_month_usd end) * 100)::integer
      into v_expected from public.plan_configs where id = 'pro';

    insert into public.orders (
      user_id, plan_id, billing_cycle, amount_paise, currency, cf_order_id,
      status, provider, product, provider_order_id, provider_subscription_id
    ) values (
      p_user_id, 'pro', p_billing_cycle, coalesce(v_expected, 0), 'USD', p_order_ref,
      'created', p_provider, 'core', p_provider_order_id, p_subscription_id
    )
    on conflict do nothing;

    select * into v_order from public.orders
     where provider = p_provider and (cf_order_id = p_order_ref or provider_order_id = p_provider_order_id)
     for update;
  end if;

  if v_order.id is null then
    return 'not_found';
  end if;

  -- The order must belong to the user the provider says paid.
  if v_order.user_id is distinct from p_user_id then
    insert into public.payment_events (cf_order_id, event_type, payload)
    values (v_order.cf_order_id, 'USER_MISMATCH', jsonb_build_object('provider', p_provider, 'at', now()))
    on conflict (cf_order_id, event_type) do nothing;
    return 'mismatch';
  end if;

  -- Idempotency: a paid / refunded order is never fulfilled twice.
  -- (created / failed / expired may still be fulfilled: if the provider confirms
  --  money was received, the customer must get what they paid for.)
  if v_order.status in ('paid', 'refunded', 'partially_refunded') then
    return 'duplicate';
  end if;

  -- Amount + currency must match what we asked for, exactly.
  if p_paid_amount is distinct from v_order.amount_paise
     or upper(coalesce(p_currency, '')) <> upper(v_order.currency) then
    insert into public.payment_events (cf_order_id, event_type, payload)
    values (v_order.cf_order_id, 'AMOUNT_MISMATCH', jsonb_build_object(
      'provider', p_provider,
      'expected_amount', v_order.amount_paise, 'expected_currency', v_order.currency,
      'paid_amount', p_paid_amount, 'paid_currency', p_currency, 'at', now()))
    on conflict (cf_order_id, event_type) do nothing;
    return 'mismatch';
  end if;

  -- The one and only transition to paid (guarded again, so only one caller can win).
  update public.orders
     set status = 'paid',
         paid_at = now(),
         cf_payment_session_id = null,
         provider_order_id = coalesce(p_provider_order_id, provider_order_id),
         provider_subscription_id = coalesce(p_subscription_id, provider_subscription_id)
   where id = v_order.id
     and status not in ('paid', 'refunded', 'partially_refunded');
  if not found then
    return 'duplicate';
  end if;

  -- Grant / extend Pro.
  select plan_expires_at into v_current from public.profiles where id = p_user_id;

  v_new := null;
  if p_provider in ('polar', 'dodo') and p_period_end is not null then
    v_new := p_period_end + interval '1 day';          -- small grace for webhook delay
    if v_new <= now() then
      v_new := null;                                   -- nonsense period end: use the plan length
    elsif v_current is not null and v_current > v_new then
      v_new := v_current;
    end if;
  end if;
  if v_new is null then
    v_base := case when v_current is not null and v_current > now() then v_current else now() end;
    v_new := case when v_order.billing_cycle = 'year' then v_base + interval '365 days'
                  else v_base + interval '30 days' end;
  end if;

  update public.profiles
     set plan = 'pro',
         plan_expires_at = v_new,
         plan_provider = p_provider,
         polar_customer_id = coalesce(p_customer_id, polar_customer_id),
         polar_subscription_id = coalesce(p_subscription_id, polar_subscription_id),
         polar_subscription_status = case when p_provider in ('polar', 'dodo') then 'active' else polar_subscription_status end,
         cancel_at_period_end = case when p_provider in ('polar', 'dodo') then false else cancel_at_period_end end
   where id = p_user_id;

  insert into public.payment_events (cf_order_id, event_type, payload)
  values (v_order.cf_order_id, 'FULFILLED', jsonb_build_object(
    'provider', p_provider, 'amount', p_paid_amount, 'currency', p_currency,
    'billing_cycle', v_order.billing_cycle, 'expires_at', v_new, 'at', now()))
  on conflict (cf_order_id, event_type) do nothing;

  return 'fulfilled';
end;
$$;

create or replace function public.refund_payment(
  p_provider          text,
  p_order_ref         text    default null,
  p_provider_order_id text    default null,
  p_refunded_total    integer default 0,      -- total refunded so far, minor units
  p_is_full           boolean default false
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order  public.orders%rowtype;
  v_total  integer;
  v_full   boolean;
begin
  if auth.role() in ('anon', 'authenticated') then
    raise exception 'refund_payment is restricted to the server';
  end if;

  select * into v_order from public.orders
   where provider = p_provider
     and ((p_order_ref is not null and cf_order_id = p_order_ref)
       or (p_provider_order_id is not null and provider_order_id = p_provider_order_id))
   order by created_at
   limit 1
   for update;

  if v_order.id is null then
    return 'not_found';
  end if;
  if v_order.status in ('created', 'failed', 'expired') then
    return 'not_paid';
  end if;

  v_total := greatest(v_order.refunded_amount, coalesce(p_refunded_total, 0));
  v_full  := coalesce(p_is_full, false) or v_total >= v_order.amount_paise or v_order.status = 'refunded';

  update public.orders
     set refunded_amount = v_total,
         refunded_at = coalesce(refunded_at, now()),
         status = case when v_full then 'refunded' else 'partially_refunded' end
   where id = v_order.id;

  if not v_full then
    return 'recorded';
  end if;

  if not exists (
    select 1 from public.orders o
     where o.user_id = v_order.user_id
       and o.id <> v_order.id
       and o.status in ('paid', 'partially_refunded')
       and o.paid_at > coalesce(v_order.paid_at, v_order.created_at)
  ) then
    update public.profiles
       set plan = 'free',
           plan_expires_at = null,
           plan_provider = null,
           polar_subscription_status = case when p_provider in ('polar', 'dodo') then 'revoked' else polar_subscription_status end,
           cancel_at_period_end = false
     where id = v_order.user_id;
    return 'revoked';
  end if;

  return 'recorded';
end;
$$;

create or replace function public.apply_polar_subscription_state(
  p_user_id                uuid,
  p_subscription_id        text,
  p_status                 text,
  p_cancel_at_period_end   boolean,
  p_event_at               timestamptz,
  p_revoke                 boolean default false
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prof public.profiles%rowtype;
begin
  if auth.role() in ('anon', 'authenticated') then
    raise exception 'apply_polar_subscription_state is restricted to the server';
  end if;

  select * into v_prof from public.profiles where id = p_user_id for update;
  if v_prof.id is null then
    return 'not_found';
  end if;

  -- Only act on the user's current subscription (or if none is recorded yet).
  if v_prof.polar_subscription_id is not null and v_prof.polar_subscription_id <> p_subscription_id then
    return 'ignored';
  end if;
  if v_prof.polar_state_at is not null and p_event_at < v_prof.polar_state_at then
    return 'stale';
  end if;

  if coalesce(p_revoke, false) then
    update public.profiles
       set polar_subscription_id     = coalesce(polar_subscription_id, p_subscription_id),
           polar_subscription_status = p_status,
           cancel_at_period_end      = false,
           polar_state_at            = p_event_at,
           -- Only remove Pro if it was paid through Polar (keeps Cashfree / admin-granted time).
           plan            = case when plan_provider in ('polar', 'dodo') then 'free' else plan end,
           plan_expires_at = case when plan_provider in ('polar', 'dodo') then null   else plan_expires_at end,
           plan_provider   = case when plan_provider in ('polar', 'dodo') then null   else plan_provider end
     where id = p_user_id;
    return 'revoked';
  end if;

  update public.profiles
     set polar_subscription_id     = coalesce(polar_subscription_id, p_subscription_id),
         polar_subscription_status = p_status,
         cancel_at_period_end      = coalesce(p_cancel_at_period_end, false),
         polar_state_at            = p_event_at
   where id = p_user_id;
  return 'updated';
end;
$$;

-- 3. Keep the functions private to the server.
revoke all on function public.fulfill_payment(text, text, text, uuid, text, integer, text, timestamptz, text, text)
  from public, anon, authenticated;
revoke all on function public.refund_payment(text, text, text, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.apply_polar_subscription_state(uuid, text, text, boolean, timestamptz, boolean)
  from public, anon, authenticated;
grant execute on function public.fulfill_payment(text, text, text, uuid, text, integer, text, timestamptz, text, text) to service_role;
grant execute on function public.refund_payment(text, text, text, integer, boolean) to service_role;
grant execute on function public.apply_polar_subscription_state(uuid, text, text, boolean, timestamptz, boolean) to service_role;

commit;
