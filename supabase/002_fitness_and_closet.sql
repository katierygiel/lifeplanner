-- Level Up · Phase 2 (fitness) and Phase 3 (closet)
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once. Run schema.sql first if you haven't.

-- ---------- Fitness ----------
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  kind text not null default 'strength' check (kind in ('strength','run','walk','pilates','mobility','hyrox','other')),
  exercises jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  kind text not null default 'strength' check (kind in ('strength','run','walk','pilates','mobility','hyrox','other')),
  title text not null,
  version text check (version in ('full','short','recovery')),
  plan_id uuid references public.workouts_planned on delete set null,
  duration_min int check (duration_min >= 0),
  distance_km numeric(6,2) check (distance_km >= 0),
  exercises jsonb not null default '[]'::jsonb,
  effort smallint check (effort between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists workout_logs_user_date on public.workout_logs (user_id, date);

create table if not exists public.pullup_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  variation text not null default 'strict' check (variation in ('negative','band','assisted','chinup','strict')),
  best_reps int not null check (best_reps >= 0),
  sets int check (sets >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  date date not null,
  division text,
  result text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- Closet ----------
create table if not exists public.closet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  category text not null default 'tops',
  color text,
  seasons text[] not null default '{}',
  occasions text[] not null default '{}',
  photo_path text,
  favorite boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text,
  occasion text,
  item_ids uuid[] not null default '{}',
  favorite boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.outfit_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  outfit_id uuid not null references public.outfits on delete cascade,
  worn boolean not null default false,
  unique (user_id, date)
);

-- ---------- Privacy ----------
do $$
declare t text;
begin
  foreach t in array array['workout_templates','workout_logs','pullup_logs','races','closet_items','outfits','outfit_days'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ---------- Private photo storage for the closet ----------
-- Each person's photos live in a folder named with their account id; only they can see them.
insert into storage.buckets (id, name, public) values ('closet', 'closet', false) on conflict (id) do nothing;

drop policy if exists "closet photos are private" on storage.objects;
create policy "closet photos are private" on storage.objects
  for all to authenticated
  using (bucket_id = 'closet' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'closet' and (storage.foldername(name))[1] = auth.uid()::text);
