-- Level Up · Phase 4 (weekly reset, meals, groceries)
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_start date not null,
  went_well text,
  proud text,
  hard text,
  change text,
  next_priority text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  kind text not null default 'lunch' check (kind in ('breakfast','lunch','dinner','snack')),
  notes text,
  is_backup boolean not null default false,
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  slot text not null check (slot in ('breakfast','lunch','dinner')),
  meal_id uuid references public.meals on delete set null,
  label text,
  prepped boolean not null default false,
  unique (user_id, date, slot)
);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  category text,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['weekly_reviews','meals','meal_plan','grocery_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
