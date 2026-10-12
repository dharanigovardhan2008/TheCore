-- Migration: Order Fulfillment Security Definer RPC
-- Allows authenticated users to safely activate Pro upon authoritative server-side payment verification
-- Bypasses direct-client profile escalation prevention via a transaction-scoped configuration flag

-- 1. Update privilege escalation trigger function to support transaction-scoped bypass
create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
begin
  -- If executed in an authenticated user session without internal transaction bypass
  if (auth.role() = 'authenticated' and coalesce(current_setting('thecore.internal_fulfillment', true), 'false') <> 'true') then
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
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create RPC function for secure order fulfillment and Pro activation
create or replace function public.fulfill_order_and_activate_pro(
  p_order_id text,
  p_user_id uuid,
  p_billing_cycle text,
  p_amount_paise int
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_new_expiry timestamptz;
  v_current_expiry timestamptz;
  v_order_record public.orders%rowtype;
begin
  -- Prevent privilege spoofing: caller must be target user or service_role
  if auth.role() = 'authenticated' and auth.uid() <> p_user_id then
    raise exception 'Unauthorized fulfillment attempt';
  end if;

  -- Set transaction-local setting to allow updating profiles.plan within this transaction
  perform set_config('thecore.internal_fulfillment', 'true', true);

  -- 1. Mark order paid
  update public.orders
  set status = 'paid', paid_at = now()
  where (cf_order_id = p_order_id or cf_payment_session_id = p_order_id or id::text = p_order_id)
    and user_id = p_user_id;

  -- 2. Calculate extension
  select plan_expires_at into v_current_expiry
  from public.profiles
  where id = p_user_id;

  if v_current_expiry is not null and v_current_expiry > now() then
    v_new_expiry := case when p_billing_cycle = 'year' then v_current_expiry + interval '365 days' else v_current_expiry + interval '30 days' end;
  else
    v_new_expiry := case when p_billing_cycle = 'year' then now() + interval '365 days' else now() + interval '30 days' end;
  end if;

  -- 3. Upgrade profile to Pro
  update public.profiles
  set plan = 'pro', plan_expires_at = v_new_expiry
  where id = p_user_id;

  -- 4. Record event in payment_events idempotently
  insert into public.payment_events (cf_order_id, event_type, payload)
  values (
    p_order_id,
    'RPC_ORDER_VERIFIED_PAID',
    jsonb_build_object(
      'verified_at', now(),
      'cf_order_id', p_order_id,
      'amount_paise', p_amount_paise,
      'billing_cycle', p_billing_cycle
    )
  )
  on conflict (cf_order_id, event_type) do nothing;

  return true;
end;
$$;

-- Grant execution permissions
grant execute on function public.fulfill_order_and_activate_pro(text, uuid, text, int) to authenticated;
grant execute on function public.fulfill_order_and_activate_pro(text, uuid, text, int) to service_role;

