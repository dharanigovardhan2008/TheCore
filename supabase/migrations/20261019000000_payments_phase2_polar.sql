-- Phase 2: Polar (USD) support. Run AFTER 20261018000000_payments_phase1.sql.
-- Safe to run more than once. Polar renewals reuse fulfill_payment (Phase 1).

-- 1. profiles: Polar state (users can never write these) --------------------
alter table public.profiles add column if not exists plan_provider text;
alter table public.profiles add column if not exists polar_customer_id text;
alter table public.profiles add column if not exists polar_subscription_id text;
alter table public.profiles add column if not exists polar_subscription_status text;
alter table public.profiles add column if not exists cancel_at_period_end boolean not null default false;
alter table public.profiles add column if not exists polar_state_at timestamptz;
-- Do NOT grant UPDATE on any of these columns to authenticated.

-- Same guard as before (no SECURITY DEFINER on purpose), with the new columns added.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $$
begin
  if current_user in ('anon','authenticated') then
    if new.plan is distinct from old.plan
       or new.plan_expires_at is distinct from old.plan_expires_at
       or new.role is distinct from old.role
       or new.is_disabled is distinct from old.is_disabled
       or new.plan_provider is distinct from old.plan_provider
       or new.polar_customer_id is distinct from old.polar_customer_id
       or new.polar_subscription_id is distinct from old.polar_subscription_id
       or new.polar_subscription_status is distinct from old.polar_subscription_status
       or new.cancel_at_period_end is distinct from old.cancel_at_period_end
       or new.polar_state_at is distinct from old.polar_state_at then
      raise exception 'Security violation: protected profile fields cannot be modified directly';
    end if;
  end if;
  return new;
end;
$$;

-- 2. Webhook de-duplication log (server only) -------------------------------
create table if not exists public.polar_webhook_events (
  webhook_id   text primary key,
  event_type   text not null,
  payload      jsonb,
  received_at  timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.polar_webhook_events enable row level security;
revoke all on public.polar_webhook_events from anon, authenticated;

-- 3. USD prices (must equal the Polar product prices). No-op if the id is not 'pro'.
update public.plan_configs
   set price_month_usd = coalesce(price_month_usd, 5),
       price_year_usd  = coalesce(price_year_usd, 30)
 where id = 'pro';

-- 4. Create the order for a Polar renewal (no checkout existed for it) ------
create or replace function public.create_polar_renewal_order(
  p_user_id uuid,
  p_order_ref text,
  p_polar_order_id text,
  p_billing_cycle text
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_price numeric;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;
  if p_billing_cycle not in ('month','year') then
    raise exception 'invalid cycle';
  end if;

  select case p_billing_cycle when 'year' then price_year_usd else price_month_usd end
    into v_price from public.plan_configs where id = 'pro';
  if v_price is null then
    raise exception 'USD price not configured';
  end if;

  insert into public.orders
    (user_id, plan_id, billing_cycle, amount_paise, currency, cf_order_id,
     status, email_snapshot, provider, provider_order_id)
  values
    (p_user_id, 'pro', p_billing_cycle, round(v_price * 100)::integer, 'USD', p_order_ref,
     'created', (select email from auth.users where id = p_user_id), 'polar', p_polar_order_id)
  on conflict do nothing;

  return p_order_ref;
end;
$$;

-- 5. Subscription state (NEVER grants Pro; stale events are ignored) --------
create or replace function public.apply_polar_subscription_state(
  p_user_id uuid,
  p_subscription_id text,
  p_status text,
  p_cancel_at_period_end boolean,
  p_event_at timestamptz,
  p_revoke boolean default false,
  p_customer_id text default null
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  p public.profiles%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;

  select * into p from public.profiles where id = p_user_id for update;
  if not found then return 'user_not_found'; end if;

  if p.polar_state_at is not null and p_event_at <= p.polar_state_at then
    return 'stale';
  end if;
  if p.polar_subscription_id is not null and p_subscription_id is not null
     and p.polar_subscription_id <> p_subscription_id then
    return 'other_subscription';
  end if;

  update public.profiles
     set polar_subscription_id     = coalesce(p.polar_subscription_id, p_subscription_id),
         polar_customer_id         = coalesce(p_customer_id, p.polar_customer_id),
         polar_subscription_status = p_status,
         cancel_at_period_end      = coalesce(p_cancel_at_period_end, false),
         polar_state_at            = p_event_at,
         plan_provider             = 'polar'
   where id = p_user_id;

  if p_revoke then
    -- Revoke only Polar-paid grants (Cashfree days are kept), then recompute.
    update public.plan_grants g
       set revoked_at = now(), reason = 'polar_revoked'
      from public.orders o
     where g.order_id = o.id and o.provider = 'polar'
       and o.user_id = p_user_id and g.revoked_at is null;
    perform public.recompute_entitlement(p_user_id);
    return 'revoked';
  end if;

  return 'updated';
end;
$$;

-- 6. Lock down: service_role only ---------------------------------------------
revoke all on function public.create_polar_renewal_order(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_polar_renewal_order(uuid, text, text, text) to service_role;

revoke all on function public.apply_polar_subscription_state(uuid, text, text, boolean, timestamptz, boolean, text)
  from public, anon, authenticated;
grant execute on function public.apply_polar_subscription_state(uuid, text, text, boolean, timestamptz, boolean, text) to service_role;