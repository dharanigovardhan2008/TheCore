-- Migration: Multi-provider payments (Cashfree INR + Polar USD)
-- Policy: see Opsyl payments.md
--   * India -> Cashfree (INR). Rest of world -> Polar (USD, merchant of record).
--   * Only service_role may fulfil / refund. Never callable from the browser.
--   * Fulfilment is atomic and idempotent (guard: status 'created' -> 'paid').
-- Amount columns hold MINOR units: paise for INR, cents for USD.
-- orders.cf_order_id is our own merchant order reference (prefix core_) for BOTH providers.

-- ---------------------------------------------------------------------------
-- 1. orders: provider, product, refund tracking
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists provider text not null default 'cashfree';
alter table public.orders add column if not exists product text not null default 'core';
alter table public.orders add column if not exists provider_checkout_id text;
alter table public.orders add column if not exists provider_order_id text;
alter table public.orders add column if not exists provider_subscription_id text;
alter table public.orders add column if not exists refunded_amount integer not null default 0;
alter table public.orders add column if not exists refunded_at timestamptz;

alter table public.orders drop constraint if exists orders_provider_check;
alter table public.orders add constraint orders_provider_check
  check (provider in ('cashfree', 'polar'));

alter table public.orders drop constraint if exists orders_currency_check;
alter table public.orders add constraint orders_currency_check
  check (currency in ('INR', 'USD'));

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('created', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded'));

-- One Polar order can only ever be recorded once.
create unique index if not exists uq_orders_provider_order
  on public.orders (provider, provider_order_id)
  where provider_order_id is not null;
create index if not exists idx_orders_provider_checkout
  on public.orders (provider_checkout_id) where provider_checkout_id is not null;
create index if not exists idx_orders_provider_subscription
  on public.orders (provider_subscription_id) where provider_subscription_id is not null;

-- Browser clients must NOT be able to create orders. Only the server writes.
drop policy if exists "Users can insert own pending orders" on public.orders;

-- ---------------------------------------------------------------------------
-- 2. profiles: Polar subscription state (server-written only)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists plan_provider text;
alter table public.profiles add column if not exists polar_customer_id text;
alter table public.profiles add column if not exists polar_subscription_id text;
alter table public.profiles add column if not exists polar_subscription_status text;
alter table public.profiles add column if not exists cancel_at_period_end boolean not null default false;
alter table public.profiles add column if not exists polar_state_at timestamptz;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
begin
  if (auth.role() = 'authenticated'
      and coalesce(current_setting('thecore.internal_fulfillment', true), 'false') <> 'true') then
    if new.plan is distinct from old.plan then
      raise exception 'Security violation: plan cannot be modified directly';
    end if;
    if new.plan_expires_at is distinct from old.plan_expires_at then
      raise exception 'Security violation: plan_expires_at cannot be modified directly';
    end if;
    if new.role is distinct from old.role then
      raise exception 'Security violation: role cannot be modified directly';
    end if;
    if new.is_disabled is distinct from old.is_disabled then
      raise exception 'Security violation: is_disabled cannot be modified directly';
    end if;
    if new.plan_provider is distinct from old.plan_provider
       or new.polar_customer_id is distinct from old.polar_customer_id
       or new.polar_subscription_id is distinct from old.polar_subscription_id
       or new.polar_subscription_status is distinct from old.polar_subscription_status
       or new.cancel_at_period_end is distinct from old.cancel_at_period_end
       or new.polar_state_at is distinct from old.polar_state_at then
      raise exception 'Security violation: billing fields cannot be modified directly';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

-- ---------------------------------------------------------------------------
-- 3. plan_configs: separate USD prices (cents are derived in code)
-- ---------------------------------------------------------------------------
alter table public.plan_configs add column if not exists price_month_usd numeric(10,2) not null default 0;
alter table public.plan_configs add column if not exists price_year_usd numeric(10,2) not null default 0;

-- Must equal the fixed price of the matching Polar product ($5 monthly, $30 yearly).
-- Checkout refuses to start if the two ever differ.
update public.plan_configs
set price_month_usd = 5, price_year_usd = 30
where id = 'pro' and price_month_usd = 0 and price_year_usd = 0;

-- ---------------------------------------------------------------------------
-- 4. Polar webhook events (idempotency by the webhook-id header)
-- ---------------------------------------------------------------------------
create table if not exists public.polar_webhook_events (
  webhook_id text primary key,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.polar_webhook_events enable row level security;
-- No policies: only service_role (which bypasses RLS) can read or write.

-- ---------------------------------------------------------------------------
-- 5. fulfill_payment: atomic + idempotent. service_role ONLY.
--    Returns: fulfilled | duplicate | mismatch | not_found
-- ---------------------------------------------------------------------------
create or replace function public.fulfill_payment(
  p_provider text,
  p_order_ref text,            -- our reference (orders.cf_order_id)
  p_provider_order_id text,    -- Polar order id (null for Cashfree)
  p_user_id uuid,
  p_billing_cycle text,        -- 'month' | 'year'
  p_paid_amount integer,       -- minor units, pre-tax
  p_currency text,
  p_period_end timestamptz default null,   -- Polar: end of paid period
  p_subscription_id text default null,
  p_customer_id text default null
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order public.orders%rowtype;
  v_current timestamptz;
  v_base timestamptz;
  v_new timestamptz;
  v_expected integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'fulfill_payment is restricted to service_role';
  end if;
  if p_provider not in ('cashfree', 'polar') or p_billing_cycle not in ('month', 'year') then
    raise exception 'invalid provider or billing cycle';
  end if;

  -- Find (and lock) our order.
  select * into v_order from public.orders
  where cf_order_id = p_order_ref and provider = p_provider
  for update;

  -- Polar renewals have no pre-created order: create one from the plan price.
  if not found and p_provider = 'polar' and p_provider_order_id is not null then
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
      'created', 'polar', 'core', p_provider_order_id, p_subscription_id
    )
    on conflict (cf_order_id) do nothing;
    select * into v_order from public.orders
    where cf_order_id = p_order_ref and provider = p_provider
    for update;
  end if;

  if not found then
    return 'not_found';
  end if;
  if v_order.user_id <> p_user_id then
    raise exception 'order does not belong to this user';
  end if;

  -- Idempotency guard: only a 'created' order can be fulfilled.
  if v_order.status <> 'created' then
    return 'duplicate';
  end if;

  -- Amount + currency must match the order exactly.
  if v_order.amount_paise <> p_paid_amount or upper(v_order.currency) <> upper(p_currency) then
    insert into public.payment_events (cf_order_id, event_type, payload)
    values (p_order_ref, 'AMOUNT_MISMATCH', jsonb_build_object(
      'provider', p_provider,
      'expected_amount', v_order.amount_paise, 'expected_currency', v_order.currency,
      'paid_amount', p_paid_amount, 'paid_currency', p_currency, 'at', now()))
    on conflict (cf_order_id, event_type) do nothing;
    return 'mismatch';
  end if;

  -- The one and only transition to paid.
  update public.orders
  set status = 'paid',
      paid_at = now(),
      provider_order_id = coalesce(p_provider_order_id, provider_order_id),
      provider_subscription_id = coalesce(p_subscription_id, provider_subscription_id)
  where id = v_order.id and status = 'created';
  if not found then
    return 'duplicate';
  end if;

  -- Grant / extend Pro.
  select plan_expires_at into v_current from public.profiles where id = p_user_id;
  if p_provider = 'polar' and p_period_end is not null then
    v_new := p_period_end + interval '1 day';   -- small grace for webhook delay
    if v_current is not null and v_current > v_new then
      v_new := v_current;
    end if;
  else
    v_base := case when v_current is not null and v_current > now() then v_current else now() end;
    v_new := case when p_billing_cycle = 'year' then v_base + interval '365 days'
                  else v_base + interval '30 days' end;
  end if;

  perform set_config('thecore.internal_fulfillment', 'true', true);
  update public.profiles
  set plan = 'pro',
      plan_expires_at = v_new,
      plan_provider = p_provider,
      polar_customer_id = coalesce(p_customer_id, polar_customer_id),
      polar_subscription_id = coalesce(p_subscription_id, polar_subscription_id),
      polar_subscription_status = case when p_provider = 'polar' then 'active' else polar_subscription_status end,
      cancel_at_period_end = case when p_provider = 'polar' then false else cancel_at_period_end end
  where id = p_user_id;

  insert into public.payment_events (cf_order_id, event_type, payload)
  values (p_order_ref, 'FULFILLED', jsonb_build_object(
    'provider', p_provider, 'amount', p_paid_amount, 'currency', p_currency,
    'billing_cycle', p_billing_cycle, 'expires_at', v_new, 'at', now()))
  on conflict (cf_order_id, event_type) do nothing;

  return 'fulfilled';
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. refund_payment: full refund revokes Pro; partial refund only records.
--    Idempotent (refunded_amount only ever grows). service_role ONLY.
--    Returns: revoked | recorded | not_found
-- ---------------------------------------------------------------------------
create or replace function public.refund_payment(
  p_provider text,
  p_order_ref text default null,
  p_provider_order_id text default null,
  p_refunded_total integer default 0,   -- total refunded so far, minor units
  p_is_full boolean default false
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order public.orders%rowtype;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'refund_payment is restricted to service_role';
  end if;

  select * into v_order from public.orders
  where provider = p_provider
    and ((p_order_ref is not null and cf_order_id = p_order_ref)
      or (p_provider_order_id is not null and provider_order_id = p_provider_order_id))
  for update;
  if not found then
    return 'not_found';
  end if;

  update public.orders
  set refunded_amount = greatest(refunded_amount, p_refunded_total),
      refunded_at = coalesce(refunded_at, now()),
      status = case
        when p_is_full or greatest(refunded_amount, p_refunded_total) >= amount_paise then 'refunded'
        else 'partially_refunded' end
  where id = v_order.id;

  if p_is_full or p_refunded_total >= v_order.amount_paise then
    perform set_config('thecore.internal_fulfillment', 'true', true);
    update public.profiles
    set plan = 'free',
        plan_expires_at = null,
        plan_provider = null,
        polar_subscription_status = case when p_provider = 'polar' then 'revoked' else polar_subscription_status end,
        cancel_at_period_end = false
    where id = v_order.user_id;
    return 'revoked';
  end if;

  return 'recorded';
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. apply_polar_subscription_state: non-granting state sync. service_role ONLY.
--    Never grants Pro (only fulfill_payment does). Ignores stale/out-of-order events.
-- ---------------------------------------------------------------------------
create or replace function public.apply_polar_subscription_state(
  p_user_id uuid,
  p_subscription_id text,
  p_status text,
  p_cancel_at_period_end boolean,
  p_event_at timestamptz,
  p_revoke boolean default false
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_prof public.profiles%rowtype;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'apply_polar_subscription_state is restricted to service_role';
  end if;

  select * into v_prof from public.profiles where id = p_user_id for update;
  if not found then
    return 'not_found';
  end if;

  -- Only act on the user's current subscription (or if none is recorded yet).
  if v_prof.polar_subscription_id is not null and v_prof.polar_subscription_id <> p_subscription_id then
    return 'ignored';
  end if;
  if v_prof.polar_state_at is not null and p_event_at < v_prof.polar_state_at then
    return 'stale';
  end if;

  perform set_config('thecore.internal_fulfillment', 'true', true);
  if p_revoke then
    update public.profiles
    set plan = 'free',
        plan_expires_at = null,
        plan_provider = null,
        polar_subscription_status = p_status,
        cancel_at_period_end = false,
        polar_state_at = p_event_at
    where id = p_user_id;
    return 'revoked';
  end if;

  update public.profiles
  set polar_subscription_id = p_subscription_id,
      polar_subscription_status = p_status,
      cancel_at_period_end = p_cancel_at_period_end,
      polar_state_at = p_event_at
  where id = p_user_id;
  return 'updated';
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. LOCK DOWN: the old browser-callable function is removed (it let any
--    signed-in user grant themselves Pro). New functions: service_role only.
-- ---------------------------------------------------------------------------
drop function if exists public.fulfill_order_and_activate_pro(text, uuid, text, int);

revoke all on function public.fulfill_payment(text, text, text, uuid, text, integer, text, timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.refund_payment(text, text, text, integer, boolean) from public, anon, authenticated;
revoke all on function public.apply_polar_subscription_state(uuid, text, text, boolean, timestamptz, boolean) from public, anon, authenticated;

grant execute on function public.fulfill_payment(text, text, text, uuid, text, integer, text, timestamptz, text, text) to service_role;
grant execute on function public.refund_payment(text, text, text, integer, boolean) to service_role;
grant execute on function public.apply_polar_subscription_state(uuid, text, text, boolean, timestamptz, boolean) to service_role;
