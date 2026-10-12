-- Migration: Cashfree Plans, Subscriptions, and Admin Panel
-- Idempotent script for profiles extensions, orders, payment_events, and admin_audit_log

-- 1. Extend public.profiles
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'plan'
  ) then
    alter table public.profiles add column plan text default 'free';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'plan_expires_at'
  ) then
    alter table public.profiles add column plan_expires_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles add column role text default 'user';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_disabled'
  ) then
    alter table public.profiles add column is_disabled boolean default false;
  end if;
end $$;

-- 2. Trigger on profiles to prevent privilege escalation from browser
create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
begin
  -- If executed in an authenticated user session (client browser call)
  if (auth.role() = 'authenticated') then
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

drop trigger if exists trg_prevent_profile_escalation on public.profiles;
create trigger trg_prevent_profile_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_profile_privilege_escalation();

-- 3. Table: orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null default 'pro',
  billing_cycle text not null check (billing_cycle in ('month', 'year')),
  amount_paise integer not null,
  currency text not null default 'INR',
  cf_order_id text not null unique,
  cf_payment_session_id text,
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  receipt_url text
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_cf_order_id on public.orders(cf_order_id);
create index if not exists idx_orders_status on public.orders(status);

-- 4. Table: payment_events (for idempotent webhook processing)
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  cf_order_id text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  constraint unique_order_event unique (cf_order_id, event_type)
);

create index if not exists idx_payment_events_order_id on public.payment_events(cf_order_id);

-- 5. Table: admin_audit_log
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_admin_id on public.admin_audit_log(admin_id);
create index if not exists idx_admin_audit_created_at on public.admin_audit_log(created_at desc);

-- 6. Enable RLS
alter table public.orders enable row level security;
alter table public.payment_events enable row level security;
alter table public.admin_audit_log enable row level security;

-- 7. Policies for orders: users can view own orders, write is server-only
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'orders' and policyname = 'Users can view own orders'
  ) then
    create policy "Users can view own orders"
      on public.orders for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- Notice: No insert/update/delete policies for orders, payment_events, or admin_audit_log.
-- These tables are strictly written via Supabase Service Role on the server.

