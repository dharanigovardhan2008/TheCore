-- Migration: Dynamic Plan Configs, Prices, and Discounts
-- Allows administrators to change prices, discounts, and add new tiers

create table if not exists public.plan_configs (
  id text primary key,
  name text not null,
  badge text not null default '',
  description text not null default '',
  
  price_month_rupees integer not null default 0,
  price_year_rupees integer not null default 0,
  discount_percent integer not null default 0,
  discount_label text default '',
  max_projects integer, -- null means unlimited (Infinity)
  max_env_files integer, -- null means unlimited (Infinity)
  features text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.plan_configs enable row level security;

-- Everyone can read active plans
drop policy if exists "Allow public read active plan_configs" on public.plan_configs;
create policy "Allow public read active plan_configs"
  on public.plan_configs
  for select
  using (true);

-- Only service role / admins can mutate
drop policy if exists "Allow service role manage plan_configs" on public.plan_configs;
create policy "Allow service role manage plan_configs"
  on public.plan_configs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Insert default Free and Pro configurations
insert into public.plan_configs (
  id,
  name,
  badge,
  description,
  price_month_rupees,
  price_year_rupees,
  discount_percent,
  discount_label,
  max_projects,
  max_env_files,
  features,
  is_active,
  is_featured,
  sort_order
) values 
(
  'free',
  'Free',
  'Starter',
  'Perfect for students and developers getting started with personal projects.',
  0,
  0,
  0,
  'Free Forever',
  3,
  1,
  array[
    'Up to 3 active projects',
    '1 encrypted .env file per project',
    'Client-side AES-256-GCM vault',
    'To-do task manager & platform tracker',
    'Full JSON data export & import',
    'Dark and light mode support'
  ],
  true,
  false,
  0
),
(
  'pro',
  'Pro',
  'Unlimited',
  'For freelancers, indie hackers, and professional builders managing multiple apps.',
  99,
  999,
  16,
  'Save 16%',
  null,
  null,
  array[
    'Unlimited projects',
    'Unlimited encrypted .env files per project',
    'Multi-environment configurations (.env, .env.local, .env.prod)',
    'Priority platform and database sync',
    'Direct developer support',
    'Early access to new features'
  ],
  true,
  true,
  1
)
on conflict (id) do nothing;

