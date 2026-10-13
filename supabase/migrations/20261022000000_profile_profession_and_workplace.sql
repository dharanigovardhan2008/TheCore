-- Migration: Add profession and workplace to public.profiles
-- Idempotent script for user onboarding fields

do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'profession'
  ) then
    alter table public.profiles add column profession text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'workplace'
  ) then
    alter table public.profiles add column workplace text;
  end if;
end $$;

-- Update auto-create profile on auth signup to capture full metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url, profession, workplace)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'profession',
    new.raw_user_meta_data->>'workplace'
  )
  on conflict (id) do update set
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    profession = coalesce(excluded.profession, public.profiles.profession),
    workplace = coalesce(excluded.workplace, public.profiles.workplace);
  return new;
end;
$$ language plpgsql security definer;

