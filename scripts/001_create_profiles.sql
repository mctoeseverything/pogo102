-- Create profiles table for ClassGo users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'student',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

-- Allow all authenticated users to view profiles
create policy "profiles_select" on public.profiles 
  for select to authenticated using (true);

-- Allow users to insert their own profile
create policy "profiles_insert" on public.profiles 
  for insert to authenticated with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "profiles_update" on public.profiles 
  for update to authenticated using (auth.uid() = id);
