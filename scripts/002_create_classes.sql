-- Create classes table
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  section text,
  subject text,
  description text,
  class_code text unique not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  color text default 'bg-blue-500',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create class_members table for student enrollments
create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'student' check (role in ('student', 'co-teacher')),
  joined_at timestamptz default now(),
  unique(class_id, user_id)
);

-- Enable Row Level Security
alter table public.classes enable row level security;
alter table public.class_members enable row level security;

-- Drop existing policies if they exist
drop policy if exists "classes_select" on public.classes;
drop policy if exists "classes_insert" on public.classes;
drop policy if exists "classes_update" on public.classes;
drop policy if exists "classes_delete" on public.classes;

drop policy if exists "class_members_select" on public.class_members;
drop policy if exists "class_members_insert" on public.class_members;
drop policy if exists "class_members_delete" on public.class_members;

-- Classes policies
-- Teachers can see their own classes, students can see classes they're enrolled in
create policy "classes_select" on public.classes 
  for select to authenticated 
  using (
    teacher_id = auth.uid() 
    or id in (select class_id from public.class_members where user_id = auth.uid())
  );

-- Only teachers can create classes
create policy "classes_insert" on public.classes 
  for insert to authenticated 
  with check (teacher_id = auth.uid());

-- Only the teacher can update their class
create policy "classes_update" on public.classes 
  for update to authenticated 
  using (teacher_id = auth.uid());

-- Only the teacher can delete their class
create policy "classes_delete" on public.classes 
  for delete to authenticated 
  using (teacher_id = auth.uid());

-- Class members policies
-- Members can see other members in their classes
create policy "class_members_select" on public.class_members 
  for select to authenticated 
  using (
    class_id in (
      select id from public.classes where teacher_id = auth.uid()
      union
      select class_id from public.class_members where user_id = auth.uid()
    )
  );

-- Students can join classes (insert themselves)
create policy "class_members_insert" on public.class_members 
  for insert to authenticated 
  with check (user_id = auth.uid());

-- Students can leave classes, teachers can remove students
create policy "class_members_delete" on public.class_members 
  for delete to authenticated 
  using (
    user_id = auth.uid() 
    or class_id in (select id from public.classes where teacher_id = auth.uid())
  );

-- Create function to generate unique class codes
create or replace function generate_class_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;
