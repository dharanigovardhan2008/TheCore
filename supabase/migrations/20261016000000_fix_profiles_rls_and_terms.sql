-- Migration: Fix profiles RLS and ensure terms acceptance columns exist
-- Idempotent script for profiles table RLS policies and terms tracking

-- 1. Ensure columns exist on public.profiles
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'profiles' 
      and column_name = 'terms_version'
  ) then
    alter table public.profiles add column terms_version text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'profiles' 
      and column_name = 'terms_accepted_at'
  ) then
    alter table public.profiles add column terms_accepted_at timestamptz;
  end if;
end $$;

-- 2. Ensure RLS is enabled on public.profiles
alter table public.profiles enable row level security;

-- 3. Idempotently create or update RLS policies on public.profiles
-- Users can view own profile
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'profiles' 
      and policyname = 'Users can view own profile'
  ) then
    create policy "Users can view own profile" 
      on public.profiles for select 
      using (auth.uid() = id);
  end if;
end $$;

-- Users can insert own profile (REQUIRED for upsert when profile row does not exist yet)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'profiles' 
      and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile" 
      on public.profiles for insert 
      with check (auth.uid() = id);
  end if;
end $$;

-- Users can update own profile
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'profiles' 
      and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile" 
      on public.profiles for update 
      using (auth.uid() = id);
  end if;
end $$;

