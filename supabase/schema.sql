-- ============================================================
-- CYBER COMMAND CENTER — Supabase Schema
-- Run this in Supabase SQL Editor (Settings > SQL Editor)
-- ============================================================

-- 1. User profiles (auto-created on signup)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Task progress (checkbox state)
create table public.task_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id text not null,
  completed boolean default false,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, task_id)
);

alter table public.task_progress enable row level security;

create policy "Users can view own progress"
  on public.task_progress for select using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.task_progress for insert with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.task_progress for update using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on public.task_progress for delete using (auth.uid() = user_id);


-- 3. Task notes
create table public.task_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id text not null,
  content text default '',
  updated_at timestamptz default now(),
  unique(user_id, task_id)
);

alter table public.task_notes enable row level security;

create policy "Users can view own notes"
  on public.task_notes for select using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.task_notes for insert with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.task_notes for update using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.task_notes for delete using (auth.uid() = user_id);


-- 4. Study sessions (timer logs)
create table public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  label text not null default 'Untitled session',
  duration_seconds integer not null,
  session_date date not null default current_date,
  created_at timestamptz default now()
);

alter table public.study_sessions enable row level security;

create policy "Users can view own sessions"
  on public.study_sessions for select using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.study_sessions for insert with check (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.study_sessions for delete using (auth.uid() = user_id);


-- 5. Indexes for performance
create index idx_task_progress_user on public.task_progress(user_id);
create index idx_task_notes_user on public.task_notes(user_id);
create index idx_study_sessions_user_date on public.study_sessions(user_id, session_date desc);
