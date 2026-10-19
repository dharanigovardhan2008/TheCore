-- =============================================================================
-- TheCore - COMPLETE DATABASE SETUP (single migration for a brand-new Supabase)
-- =============================================================================
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   Run it ONCE on the new, empty project. It is also safe to re-run (idempotent).
--   Do NOT run the 13 old files in supabase/migrations/ - this file replaces all
--   of them (they conflict with each other and reference tables that were never
--   created, e.g. plan_grants / recompute_entitlement).
--
-- WHAT IT BUILDS
--   Tables : profiles, projects, services, todos, env_files, activity_log,
--            plan_configs, orders, payment_events, polar_webhook_events,
--            admin_audit_log
--   Security: RLS on every table, column-level grants on profiles, protected
--            billing/role columns, project-ownership checks on child tables,
--            plan limits enforced in the database, disabled-account lockout,
--            append-only audit log, service_role-only payment functions.
--   Billing: fulfill_payment / refund_payment / apply_polar_subscription_state
--            (the exact names + arguments the Next.js code calls).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Shared helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
do $do$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'project_status') then
    create type public.project_status as enum ('idea', 'in_progress', 'deployed', 'paused');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'service_kind') then
    create type public.service_kind as enum ('frontend', 'backend', 'database', 'domain', 'other');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'todo_priority') then
    create type public.todo_priority as enum ('low', 'med', 'high');
  end if;
end
$do$;

-- -----------------------------------------------------------------------------
-- 2. profiles (one row per auth user)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                        uuid primary key references auth.users (id) on delete cascade,
  display_name              text
    check (display_name is null or char_length(display_name) <= 200),
  avatar_url                text
    check (avatar_url is null or avatar_url = ''
           or (char_length(avatar_url) <= 2048 and avatar_url ~ '^(https://|/avatars/)')),
  profession                text check (profession is null or char_length(profession) <= 200),
  workplace                 text check (workplace is null or char_length(workplace) <= 200),
  vault_verifier            jsonb,
  terms_version             text,
  terms_accepted_at         timestamptz,
  -- Billing / access state: written ONLY by the server (service_role) or SQL editor.
  plan                      text        not null default 'free' check (plan in ('free', 'pro')),
  plan_expires_at           timestamptz,
  plan_provider             text        check (plan_provider is null or plan_provider in ('cashfree', 'polar')),
  polar_customer_id         text,
  polar_subscription_id     text,
  polar_subscription_status text,
  cancel_at_period_end      boolean     not null default false,
  polar_state_at            timestamptz,
  role                      text        not null default 'user' check (role in ('user', 'admin')),
  is_disabled               boolean     not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists idx_profiles_created_at on public.profiles (created_at desc);
create index if not exists idx_profiles_plan       on public.profiles (plan);
create index if not exists idx_profiles_role       on public.profiles (role) where role = 'admin';

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Second line of defence (the first is column-level grants below): a browser
-- session can never change or pre-set plan / role / billing fields.
-- SECURITY INVOKER on purpose: current_user is then the real caller
-- ('anon' / 'authenticated' for browser calls, 'service_role' for the server,
-- the function owner when called from inside our SECURITY DEFINER functions).
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      if new.plan is distinct from 'free'
         or new.plan_expires_at is not null
         or new.role is distinct from 'user'
         or new.is_disabled is distinct from false
         or new.plan_provider is not null
         or new.polar_customer_id is not null
         or new.polar_subscription_id is not null
         or new.polar_subscription_status is not null
         or new.cancel_at_period_end is distinct from false
         or new.polar_state_at is not null then
        raise exception 'Security violation: protected profile fields cannot be set directly';
      end if;
    else
      if new.plan                      is distinct from old.plan
         or new.plan_expires_at        is distinct from old.plan_expires_at
         or new.role                   is distinct from old.role
         or new.is_disabled            is distinct from old.is_disabled
         or new.plan_provider          is distinct from old.plan_provider
         or new.polar_customer_id      is distinct from old.polar_customer_id
         or new.polar_subscription_id  is distinct from old.polar_subscription_id
         or new.polar_subscription_status is distinct from old.polar_subscription_status
         or new.cancel_at_period_end   is distinct from old.cancel_at_period_end
         or new.polar_state_at         is distinct from old.polar_state_at
         or new.created_at             is distinct from old.created_at then
        raise exception 'Security violation: protected profile fields cannot be modified directly';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Disabled-account lockout, part 1: block sign-in / token refresh in Supabase Auth.
-- (If this ever fails, the RLS lockout below still applies, so it never blocks the admin action.)
create or replace function public.sync_profile_ban()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  begin
    update auth.users
       set banned_until = case when new.is_disabled then now() + interval '100 years' else null end
     where id = new.id;
  exception when others then
    raise warning 'sync_profile_ban: could not update auth.users (%)', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_sync_profile_ban on public.profiles;
create trigger trg_sync_profile_ban
  after update of is_disabled on public.profiles
  for each row
  when (old.is_disabled is distinct from new.is_disabled)
  execute function public.sync_profile_ban();

-- Disabled-account lockout, part 2: used by RLS so it takes effect immediately,
-- even while the user still holds a valid access token.
create or replace function public.account_enabled()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not coalesce((select p.is_disabled from public.profiles p where p.id = auth.uid()), false);
$$;

-- Auto-create the profile when someone signs up (email/password or Google).
-- Never fails the signup: bad metadata is trimmed or dropped instead.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name   text;
  v_avatar text;
begin
  v_name := left(coalesce(
              nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
              nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
              nullif(split_part(coalesce(new.email, ''), '@', 1), '')
            ), 200);

  v_avatar := new.raw_user_meta_data ->> 'avatar_url';
  if v_avatar is null or char_length(v_avatar) > 2048 or v_avatar !~ '^(https://|/avatars/)' then
    v_avatar := null;
  end if;

  insert into public.profiles (id, display_name, avatar_url, profession, workplace)
  values (
    new.id,
    v_name,
    v_avatar,
    left(nullif(btrim(new.raw_user_meta_data ->> 'profession'), ''), 200),
    left(nullif(btrim(new.raw_user_meta_data ->> 'workplace'), ''), 200)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Back-fill: any auth users that already exist get a profile too.
insert into public.profiles (id, display_name)
select u.id, left(nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 200)
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 3. plan_configs (prices, limits, features) - needed before limit triggers
-- -----------------------------------------------------------------------------
create table if not exists public.plan_configs (
  id                  text primary key check (id ~ '^[a-z0-9_-]{1,40}$'),
  name                text    not null check (char_length(name) between 1 and 100),
  badge               text    not null default '',
  description         text    not null default '',
  price_month_rupees  integer not null default 0 check (price_month_rupees >= 0),
  price_year_rupees   integer not null default 0 check (price_year_rupees  >= 0),
  price_month_usd     numeric(10, 2) not null default 0 check (price_month_usd >= 0),
  price_year_usd      numeric(10, 2) not null default 0 check (price_year_usd  >= 0),
  discount_percent    integer not null default 0 check (discount_percent between 0 and 100),
  discount_label      text             default '',
  max_projects        integer check (max_projects is null or max_projects >= 0),   -- null = unlimited
  max_env_files       integer check (max_env_files is null or max_env_files >= 0), -- null = unlimited
  features            text[]  not null default '{}',
  is_active           boolean not null default true,
  is_featured         boolean not null default false,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_plan_configs_updated_at on public.plan_configs;
create trigger trg_plan_configs_updated_at
  before update on public.plan_configs
  for each row execute function public.set_updated_at();

insert into public.plan_configs (
  id, name, badge, description,
  price_month_rupees, price_year_rupees, price_month_usd, price_year_usd,
  discount_percent, discount_label, max_projects, max_env_files, features,
  is_active, is_featured, sort_order
) values
(
  'free', 'Free', 'Starter',
  'Perfect for students and developers getting started with personal projects.',
  0, 0, 0, 0,
  0, 'Free Forever', 3, 1,
  array[
    'Up to 3 active projects',
    '1 encrypted .env file per project',
    'Client-side AES-256-GCM vault',
    'To-do task manager & platform tracker',
    'Full JSON data export & import',
    'Dark and light mode support'
  ],
  true, false, 0
),
(
  'pro', 'Pro', 'Unlimited',
  'For freelancers, indie hackers, and professional builders managing multiple apps.',
  99, 999, 5, 30,           -- USD prices MUST equal your Polar product prices ($5 / $30)
  16, 'Save 16%', null, null,
  array[
    'Unlimited projects',
    'Unlimited encrypted .env files per project',
    'Multi-environment configurations (.env, .env.local, .env.prod)',
    'Priority platform and database sync',
    'Direct developer support',
    'Early access to new features'
  ],
  true, true, 1
)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 4. projects / services / todos / env_files / activity_log
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 100),
  description  text check (description is null or char_length(description) <= 500),
  status       public.project_status not null default 'idea',
  stack        text[] not null default '{}' check (cardinality(stack) <= 20),
  repo_url     text check (repo_url is null or repo_url = '' or (char_length(repo_url) <= 2048 and repo_url ~* '^https?://')),
  live_url     text check (live_url is null or live_url = '' or (char_length(live_url) <= 2048 and live_url ~* '^https?://')),
  logo_url     text check (logo_url is null or logo_url = '' or (char_length(logo_url) <= 2048 and logo_url ~* '^https?://')),
  notes        text check (notes is null or char_length(notes) <= 10000),
  accent       text check (accent is null or char_length(accent) <= 20),
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_projects_user_updated on public.projects (user_id, updated_at desc);
create index if not exists idx_projects_archived_at  on public.projects (archived_at);

create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  kind         public.service_kind not null,
  custom_kind  text check (custom_kind is null or char_length(custom_kind) <= 40),
  platform     text not null check (char_length(btrim(platform)) between 1 and 100),
  login_email  text not null check (char_length(login_email) <= 255),
  created_at   timestamptz not null default now()
);

create index if not exists idx_services_project on public.services (project_id);
create index if not exists idx_services_user    on public.services (user_id);

create table if not exists public.todos (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  text         text not null check (char_length(btrim("text")) between 1 and 500),
  done         boolean not null default false,
  priority     public.todo_priority,
  due_date     timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_todos_project on public.todos (project_id);
create index if not exists idx_todos_user    on public.todos (user_id);

-- Encrypted in the browser (AES-256-GCM). The database only ever sees ciphertext.
create table if not exists public.env_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  file_name    text not null default '.env' check (char_length(btrim(file_name)) between 1 and 100),
  label        text check (label is null or char_length(label) <= 100),
  ciphertext   text not null check (char_length(ciphertext) <= 500000),
  iv           text not null check (char_length(iv) <= 200),
  salt         text not null check (char_length(salt) <= 200),
  iterations   integer not null check (iterations between 1000 and 5000000),
  version      text not null check (char_length(version) <= 50),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint env_files_project_id_file_name_key unique (project_id, file_name)
);

create index if not exists idx_env_files_project on public.env_files (project_id);
create index if not exists idx_env_files_user    on public.env_files (user_id);

-- No FK on project_id on purpose: the app logs "project_deleted" AFTER deleting the project.
create table if not exists public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  project_id   uuid,
  action       text not null check (char_length(action) between 1 and 50),
  summary      text not null check (char_length(summary) between 1 and 500),
  created_at   timestamptz not null default now()
);

create index if not exists idx_activity_log_user_created on public.activity_log (user_id, created_at desc);

drop trigger if exists handle_projects_updated_at on public.projects;
create trigger handle_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists handle_env_files_updated_at on public.env_files;
create trigger handle_env_files_updated_at
  before update on public.env_files
  for each row execute function public.set_updated_at();

-- Plan limits enforced in the DATABASE, so nobody can bypass the app and call the
-- API directly with their own token. Reads the limits from plan_configs
-- (falls back to 3 projects / 1 env file for Free if the row is missing/hidden).
-- Only browser sessions are limited; the server (service_role) is not.
create or replace function public.enforce_project_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_plan   text;
  v_exp    timestamptz;
  v_pro    boolean;
  v_limit  integer;
  v_count  integer;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('projects:' || new.user_id::text, 0));

  select p.plan, p.plan_expires_at into v_plan, v_exp from public.profiles p where p.id = new.user_id;
  v_pro := (v_plan = 'pro' and (v_exp is null or v_exp > now()));

  select c.max_projects into v_limit from public.plan_configs c where c.id = case when v_pro then 'pro' else 'free' end;
  if not found then
    v_limit := case when v_pro then null else 3 end;
  end if;

  if v_limit is not null then
    select count(*) into v_count from public.projects where user_id = new.user_id;
    if v_count >= v_limit then
      raise exception 'PLAN_LIMIT_REACHED: Free plan limit of % projects reached. Upgrade to Pro for unlimited projects.', v_limit;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_project_limit on public.projects;
create trigger trg_enforce_project_limit
  before insert on public.projects
  for each row execute function public.enforce_project_limit();

create or replace function public.enforce_env_file_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_plan   text;
  v_exp    timestamptz;
  v_pro    boolean;
  v_limit  integer;
  v_count  integer;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  -- An upsert that overwrites an existing file is not a new file.
  if exists (select 1 from public.env_files e
              where e.project_id = new.project_id
                and (e.file_name = new.file_name or e.id = new.id)) then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('env:' || new.project_id::text, 0));

  select p.plan, p.plan_expires_at into v_plan, v_exp from public.profiles p where p.id = new.user_id;
  v_pro := (v_plan = 'pro' and (v_exp is null or v_exp > now()));

  select c.max_env_files into v_limit from public.plan_configs c where c.id = case when v_pro then 'pro' else 'free' end;
  if not found then
    v_limit := case when v_pro then null else 1 end;
  end if;

  if v_limit is not null then
    select count(*) into v_count from public.env_files where project_id = new.project_id;
    if v_count >= v_limit then
      raise exception 'PLAN_LIMIT_REACHED: Free plan allows up to % .env file per project. Upgrade to Pro for unlimited .env files.', v_limit;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_env_file_limit on public.env_files;
create trigger trg_enforce_env_file_limit
  before insert on public.env_files
  for each row execute function public.enforce_env_file_limit();

-- -----------------------------------------------------------------------------
-- 5. Payments: orders, webhook logs, admin audit log
-- -----------------------------------------------------------------------------
-- Amount columns hold MINOR units: paise for INR, cents for USD.
-- orders.cf_order_id is OUR order reference (prefix core_) for BOTH providers.
create table if not exists public.orders (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references public.profiles (id) on delete cascade,
  plan_id                   text not null default 'pro',
  billing_cycle             text not null check (billing_cycle in ('month', 'year')),
  amount_paise              integer not null check (amount_paise >= 0),
  currency                  text not null default 'INR' check (currency in ('INR', 'USD')),
  cf_order_id               text not null unique,
  cf_payment_session_id     text,
  provider                  text not null default 'cashfree' check (provider in ('cashfree', 'polar')),
  product                   text not null default 'core',
  provider_checkout_id      text,
  provider_order_id         text,
  provider_subscription_id  text,
  status                    text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded')),
  refunded_amount           integer not null default 0 check (refunded_amount >= 0),
  refunded_at               timestamptz,
  created_at                timestamptz not null default now(),
  paid_at                   timestamptz,
  receipt_url               text
);

create index if not exists idx_orders_user_created on public.orders (user_id, created_at desc);
create index if not exists idx_orders_status       on public.orders (status);
create index if not exists idx_orders_created_at   on public.orders (created_at desc);
create unique index if not exists uq_orders_provider_order
  on public.orders (provider, provider_order_id) where provider_order_id is not null;
create index if not exists idx_orders_provider_checkout
  on public.orders (provider_checkout_id) where provider_checkout_id is not null;
create index if not exists idx_orders_provider_subscription
  on public.orders (provider_subscription_id) where provider_subscription_id is not null;

-- Cashfree webhook audit log (unique per order + event type -> idempotent upsert).
create table if not exists public.payment_events (
  id           uuid primary key default gen_random_uuid(),
  cf_order_id  text not null,
  event_type   text not null,
  payload      jsonb not null default '{}'::jsonb,
  received_at  timestamptz not null default now(),
  constraint unique_order_event unique (cf_order_id, event_type)
);

-- Polar webhook de-duplication (by the webhook-id header).
create table if not exists public.polar_webhook_events (
  webhook_id    text primary key,
  event_type    text not null,
  payload       jsonb not null default '{}'::jsonb,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz
);

-- Admin actions. Append-only. RESTRICT: an admin with history must be demoted
-- before their account can be deleted, so the trail is never silently lost.
create table if not exists public.admin_audit_log (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid not null references public.profiles (id) on delete restrict,
  action          text not null,
  target_user_id  uuid,
  details         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_admin_audit_admin_id   on public.admin_audit_log (admin_id);
create index if not exists idx_admin_audit_created_at on public.admin_audit_log (created_at desc);

create or replace function public.audit_log_append_only()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'admin_audit_log is append-only';
end;
$$;

drop trigger if exists trg_audit_log_append_only on public.admin_audit_log;
create trigger trg_audit_log_append_only
  before update or delete on public.admin_audit_log
  for each row execute function public.audit_log_append_only();

-- -----------------------------------------------------------------------------
-- 6. Payment functions (service_role ONLY - never callable from a browser)
-- -----------------------------------------------------------------------------
-- fulfill_payment: atomic + idempotent. Returns fulfilled | duplicate | mismatch | not_found
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
  if p_provider not in ('cashfree', 'polar') or p_billing_cycle not in ('month', 'year') then
    raise exception 'invalid provider or billing cycle';
  end if;

  -- Find (and lock) our order.
  select * into v_order from public.orders
   where provider = p_provider and cf_order_id = p_order_ref
   for update;

  -- Polar: maybe we already stored this Polar order under another reference.
  if v_order.id is null and p_provider = 'polar' and p_provider_order_id is not null then
    select * into v_order from public.orders
     where provider = 'polar' and provider_order_id = p_provider_order_id
     for update;
  end if;

  -- Polar renewals have no pre-created order: create one from the plan price.
  if v_order.id is null and p_provider = 'polar' and p_provider_order_id is not null then
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
    on conflict do nothing;

    select * into v_order from public.orders
     where provider = 'polar' and (cf_order_id = p_order_ref or provider_order_id = p_provider_order_id)
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
  if p_provider = 'polar' and p_period_end is not null then
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
         polar_subscription_status = case when p_provider = 'polar' then 'active' else polar_subscription_status end,
         cancel_at_period_end = case when p_provider = 'polar' then false else cancel_at_period_end end
   where id = p_user_id;

  insert into public.payment_events (cf_order_id, event_type, payload)
  values (v_order.cf_order_id, 'FULFILLED', jsonb_build_object(
    'provider', p_provider, 'amount', p_paid_amount, 'currency', p_currency,
    'billing_cycle', v_order.billing_cycle, 'expires_at', v_new, 'at', now()))
  on conflict (cf_order_id, event_type) do nothing;

  return 'fulfilled';
end;
$$;

-- refund_payment: idempotent (refunded_amount only grows).
-- Returns revoked | recorded | not_found | not_paid
-- A full refund removes Pro only if it is the user's most recent paid purchase,
-- so refunding an OLD month can never cancel a newer, still-valid payment.
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
           polar_subscription_status = case when p_provider = 'polar' then 'revoked' else polar_subscription_status end,
           cancel_at_period_end = false
     where id = v_order.user_id;
    return 'revoked';
  end if;

  return 'recorded';
end;
$$;

-- apply_polar_subscription_state: syncs subscription state. NEVER grants Pro
-- (only fulfill_payment does). Ignores stale / out-of-order events.
-- Returns updated | revoked | stale | ignored | not_found
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
           plan            = case when plan_provider = 'polar' then 'free' else plan end,
           plan_expires_at = case when plan_provider = 'polar' then null   else plan_expires_at end,
           plan_provider   = case when plan_provider = 'polar' then null   else plan_provider end
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

-- -----------------------------------------------------------------------------
-- 7. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.projects              enable row level security;
alter table public.services              enable row level security;
alter table public.todos                 enable row level security;
alter table public.env_files             enable row level security;
alter table public.activity_log          enable row level security;
alter table public.plan_configs          enable row level security;
alter table public.orders                enable row level security;
alter table public.payment_events        enable row level security;
alter table public.polar_webhook_events  enable row level security;
alter table public.admin_audit_log       enable row level security;

-- Drop any earlier policies so this file can be re-run cleanly.
do $do$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
     where schemaname = 'public'
       and tablename in ('profiles','projects','services','todos','env_files','activity_log',
                         'plan_configs','orders','payment_events','polar_webhook_events','admin_audit_log')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end
$do$;

-- profiles: own row only. (plan / role / billing columns are additionally locked by grants + trigger.)
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- projects
create policy projects_select_own on public.projects
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()));
create policy projects_insert_own on public.projects
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.account_enabled()));
create policy projects_update_own on public.projects
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()))
  with check (user_id = (select auth.uid()) and (select public.account_enabled()));
create policy projects_delete_own on public.projects
  for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()));

-- services / todos / env_files: must be yours AND attached to a project that is yours
-- (the old policies only checked user_id, so someone could attach rows to another user's project).
create policy services_select_own on public.services
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()));
create policy services_insert_own on public.services
  for insert to authenticated
  with check (
    user_id = (select auth.uid()) and (select public.account_enabled())
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );
create policy services_update_own on public.services
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()))
  with check (
    user_id = (select auth.uid()) and (select public.account_enabled())
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );
create policy services_delete_own on public.services
  for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()));

create policy todos_select_own on public.todos
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()));
create policy todos_insert_own on public.todos
  for insert to authenticated
  with check (
    user_id = (select auth.uid()) and (select public.account_enabled())
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );
create policy todos_update_own on public.todos
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()))
  with check (
    user_id = (select auth.uid()) and (select public.account_enabled())
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );
create policy todos_delete_own on public.todos
  for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()));

create policy env_files_select_own on public.env_files
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()));
create policy env_files_insert_own on public.env_files
  for insert to authenticated
  with check (
    user_id = (select auth.uid()) and (select public.account_enabled())
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );
create policy env_files_update_own on public.env_files
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()))
  with check (
    user_id = (select auth.uid()) and (select public.account_enabled())
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );
create policy env_files_delete_own on public.env_files
  for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()));

-- activity_log: read and append your own entries only (no edit / delete).
create policy activity_log_select_own on public.activity_log
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.account_enabled()));
create policy activity_log_insert_own on public.activity_log
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.account_enabled()));

-- plan_configs: the public pricing page reads ACTIVE plans. Writes: server only.
create policy plan_configs_read_active on public.plan_configs
  for select to anon, authenticated using (is_active);

-- orders: users can read their own orders. All writes: server only.
create policy orders_select_own on public.orders
  for select to authenticated using (user_id = (select auth.uid()));

-- payment_events, polar_webhook_events, admin_audit_log: RLS on, NO policies
-- => invisible to browsers; only the server (service_role) can touch them.

-- -----------------------------------------------------------------------------
-- 8. Privileges (belt and braces on top of RLS)
-- -----------------------------------------------------------------------------
revoke all on public.profiles, public.projects, public.services, public.todos,
              public.env_files, public.activity_log, public.plan_configs, public.orders,
              public.payment_events, public.polar_webhook_events, public.admin_audit_log
  from anon, authenticated;

grant select on public.plan_configs to anon, authenticated;
grant select on public.orders       to authenticated;
grant select, insert, update, delete on public.projects, public.services,
                                         public.todos, public.env_files to authenticated;
grant select, insert on public.activity_log to authenticated;

-- profiles: browsers may read their row and edit ONLY these harmless columns.
grant select on public.profiles to authenticated;
grant insert (id, display_name, avatar_url, profession, workplace, vault_verifier,
              terms_version, terms_accepted_at, updated_at)
  on public.profiles to authenticated;
grant update (id, display_name, avatar_url, profession, workplace, vault_verifier,
              terms_version, terms_accepted_at, updated_at)
  on public.profiles to authenticated;

-- Functions: nothing is callable by browsers except the helper RLS needs.
revoke all on function public.fulfill_payment(text, text, text, uuid, text, integer, text, timestamptz, text, text)
  from public, anon, authenticated;
revoke all on function public.refund_payment(text, text, text, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.apply_polar_subscription_state(uuid, text, text, boolean, timestamptz, boolean)
  from public, anon, authenticated;
grant execute on function public.fulfill_payment(text, text, text, uuid, text, integer, text, timestamptz, text, text)
  to service_role;
grant execute on function public.refund_payment(text, text, text, integer, boolean)
  to service_role;
grant execute on function public.apply_polar_subscription_state(uuid, text, text, boolean, timestamptz, boolean)
  to service_role;

revoke all on function public.account_enabled()        from public, anon;
grant execute on function public.account_enabled()     to authenticated, service_role;
revoke all on function public.handle_new_user()        from public, anon, authenticated;
revoke all on function public.sync_profile_ban()       from public, anon, authenticated;

commit;

-- =============================================================================
-- AFTER RUNNING (separate steps, run them once as needed)
-- =============================================================================
-- 1) Make yourself the admin (sign up in the app first, then run, with YOUR email):
--
--    update public.profiles
--       set role = 'admin'
--     where id = (select id from auth.users where email = 'you@example.com');
--
-- 2) Quick health check - every table below must show rls_enabled = true:
--
--    select c.relname as table_name, c.relrowsecurity as rls_enabled
--      from pg_class c join pg_namespace n on n.oid = c.relnamespace
--     where n.nspname = 'public' and c.relkind = 'r'
--     order by 1;
--
-- 3) Check the seeded plans (pro must show 5 and 30 in USD, matching Polar):
--
--    select id, price_month_rupees, price_year_rupees, price_month_usd, price_year_usd
--      from public.plan_configs;
-- =============================================================================