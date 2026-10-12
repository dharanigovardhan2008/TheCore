-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  avatar_url text,
  vault_verifier jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROJECTS
create type project_status as enum ('idea', 'in_progress', 'deployed', 'paused');

create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  status project_status default 'idea' not null,
  stack text[] default '{}',
  repo_url text,
  live_url text,
  notes text,
  accent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SERVICES
create type service_kind as enum ('frontend', 'backend', 'database', 'domain', 'other');

create table public.services (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  kind service_kind not null,
  platform text not null,
  login_email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TODOS
create type todo_priority as enum ('low', 'med', 'high');

create table public.todos (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  text text not null,
  done boolean default false not null,
  priority todo_priority,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENV FILES
create table public.env_files (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects on delete cascade not null unique,
  user_id uuid references auth.users on delete cascade not null,
  ciphertext text not null,
  iv text not null,
  salt text not null,
  iterations integer not null,
  version text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.todos enable row level security;
alter table public.env_files enable row level security;

-- Profiles: Users can view and update their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Projects: Users can CRUD their own projects
create policy "Users can select own projects" on projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects" on projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on projects for delete using (auth.uid() = user_id);

-- Services: CRUD based on user_id and project ownership
create policy "Users can select own services" on services for select using (auth.uid() = user_id);
create policy "Users can insert own services" on services for insert with check (auth.uid() = user_id);
create policy "Users can update own services" on services for update using (auth.uid() = user_id);
create policy "Users can delete own services" on services for delete using (auth.uid() = user_id);

-- Todos: CRUD based on user_id and project ownership
create policy "Users can select own todos" on todos for select using (auth.uid() = user_id);
create policy "Users can insert own todos" on todos for insert with check (auth.uid() = user_id);
create policy "Users can update own todos" on todos for update using (auth.uid() = user_id);
create policy "Users can delete own todos" on todos for delete using (auth.uid() = user_id);

-- Env Files: CRUD based on user_id and project ownership
create policy "Users can select own env_files" on env_files for select using (auth.uid() = user_id);
create policy "Users can insert own env_files" on env_files for insert with check (auth.uid() = user_id);
create policy "Users can update own env_files" on env_files for update using (auth.uid() = user_id);
create policy "Users can delete own env_files" on env_files for delete using (auth.uid() = user_id);

-- TRIGGERS
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger handle_env_files_updated_at
  before update on public.env_files
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
