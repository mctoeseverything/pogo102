-- Create assignments table
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  instructions text,
  due_date timestamp with time zone,
  points integer default 100,
  assignment_type text default 'assignment' check (assignment_type in ('assignment', 'quiz', 'material')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create submissions table
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  content text,
  file_url text,
  status text default 'assigned' check (status in ('assigned', 'submitted', 'returned', 'graded')),
  grade integer,
  feedback text,
  submitted_at timestamp with time zone,
  graded_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(assignment_id, student_id)
);

-- Enable RLS
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

-- Assignments policies
drop policy if exists "Teachers can create assignments" on public.assignments;
drop policy if exists "Class members can view assignments" on public.assignments;
drop policy if exists "Teachers can update their assignments" on public.assignments;
drop policy if exists "Teachers can delete their assignments" on public.assignments;

create policy "Teachers can create assignments" on public.assignments
  for insert with check (auth.uid() = teacher_id);

create policy "Class members can view assignments" on public.assignments
  for select using (
    exists (
      select 1 from public.class_members
      where class_members.class_id = assignments.class_id
      and class_members.user_id = auth.uid()
    )
  );

create policy "Teachers can update their assignments" on public.assignments
  for update using (auth.uid() = teacher_id);

create policy "Teachers can delete their assignments" on public.assignments
  for delete using (auth.uid() = teacher_id);

-- Submissions policies
drop policy if exists "Students can create submissions" on public.submissions;
drop policy if exists "Students can view own submissions" on public.submissions;
drop policy if exists "Teachers can view class submissions" on public.submissions;
drop policy if exists "Students can update own submissions" on public.submissions;
drop policy if exists "Teachers can grade submissions" on public.submissions;

create policy "Students can create submissions" on public.submissions
  for insert with check (auth.uid() = student_id);

create policy "Students can view own submissions" on public.submissions
  for select using (auth.uid() = student_id);

create policy "Teachers can view class submissions" on public.submissions
  for select using (
    exists (
      select 1 from public.assignments a
      join public.classes c on a.class_id = c.id
      where a.id = submissions.assignment_id
      and c.teacher_id = auth.uid()
    )
  );

create policy "Students can update own submissions" on public.submissions
  for update using (auth.uid() = student_id and status in ('assigned', 'submitted'));

create policy "Teachers can grade submissions" on public.submissions
  for update using (
    exists (
      select 1 from public.assignments a
      join public.classes c on a.class_id = c.id
      where a.id = submissions.assignment_id
      and c.teacher_id = auth.uid()
    )
  );
