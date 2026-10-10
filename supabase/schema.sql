-- Level Up · Phase 1 database
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

create extension if not exists pgcrypto;

-- ---------- Profile (one row per account) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Tasks ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  notes text,
  tier text not null default 'flexible' check (tier in ('must','flexible','optional','recovery')),
  duration_min int,
  planned_date date,
  fixed_time time,
  movable boolean not null default true,
  is_priority boolean not null default false,
  status text not null default 'open' check (status in ('open','done','skipped')),
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_date on public.tasks (user_id, planned_date);

-- ---------- Schedule blocks (work, field, events…) ----------
-- One-off: set `date`. Weekly repeat: set `weekday` (0 = Sunday … 6 = Saturday).
create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  kind text not null default 'event' check (kind in ('work','field','gym','friends','family','event','commute','other')),
  date date,
  weekday smallint check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  repeat_from date,
  repeat_until date,
  skipped_dates date[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  check (date is not null or weekday is not null)
);
create index if not exists blocks_user_date on public.schedule_blocks (user_id, date);

-- ---------- Habits ----------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  tier text not null default 'flexible' check (tier in ('must','flexible','optional','recovery')),
  xp int not null default 15,
  days smallint[] not null default '{0,1,2,3,4,5,6}',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  habit_id uuid not null references public.habits on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

-- ---------- Routines ----------
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  time_of_day text not null default 'morning' check (time_of_day in ('morning','day','evening','weekly')),
  days smallint[] not null default '{0,1,2,3,4,5,6}',
  xp int not null default 20,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.routine_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  routine_id uuid not null references public.routines on delete cascade,
  title text not null,
  duration_min int,
  optional boolean not null default false,
  in_busy_version boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  routine_id uuid not null references public.routines on delete cascade,
  date date not null,
  version text not null default 'full' check (version in ('full','busy')),
  completed_steps uuid[] not null default '{}',
  completed boolean not null default false,
  unique (routine_id, date)
);

-- ---------- Daily check-in ----------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  energy smallint check (energy between 1 and 5),
  mood smallint check (mood between 1 and 5),
  motivation smallint check (motivation between 1 and 5),
  soreness smallint check (soreness between 1 and 5),
  day_mode text not null default 'full' check (day_mode in ('full','short','essentials','busy')),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ---------- Planned workouts (full / short / recovery) ----------
create table if not exists public.workouts_planned (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  full_title text, full_detail text,
  short_title text, short_detail text,
  recovery_title text, recovery_detail text,
  chosen text check (chosen in ('full','short','recovery')),
  completed_at timestamptz,
  source text not null default 'manual' check (source in ('manual','import')),
  created_at timestamptz not null default now()
);
create index if not exists workouts_user_date on public.workouts_planned (user_id, date);

-- ---------- Seasons, goals, milestones ----------
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  theme text,
  start_date date not null,
  end_date date not null,
  notes text,
  reflection text,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  season_id uuid references public.seasons on delete set null,
  title text not null,
  description text,
  category text,
  target_date date,
  notes text,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id uuid not null references public.goals on delete cascade,
  title text not null,
  due_date date,
  done_at timestamptz,
  sort_order int not null default 0
);

create table if not exists public.goal_habits (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id uuid not null references public.goals on delete cascade,
  habit_id uuid not null references public.habits on delete cascade,
  primary key (goal_id, habit_id)
);

-- ---------- XP ledger and achievements ----------
-- XP only ever gets added; un-checking something removes just that row.
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  amount int not null check (amount > 0),
  source_type text not null,
  source_id uuid,
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists xp_user_date on public.xp_events (user_id, date);
create unique index if not exists xp_one_per_source_day on public.xp_events (user_id, source_type, source_id, date) where source_id is not null;

create table if not exists public.achievements_earned (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

-- ---------- Privacy: every row is visible only to its owner ----------
alter table public.profiles enable row level security;
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array[
    'tasks','schedule_blocks','habits','habit_logs','routines','routine_steps','routine_logs',
    'checkins','workouts_planned','seasons','goals','milestones','goal_habits','xp_events','achievements_earned'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
