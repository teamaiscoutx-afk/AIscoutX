-- AIscoutX — Supabase schema setup
-- Note: waitlist table lives in supabase/migrations/001_waitlist.sql (landing page)
-- Run in Supabase SQL Editor or via: supabase db push (after linking project)
--
-- Prerequisites: enable Email auth (+ Google OAuth) in Authentication → Providers

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  workspace_mode text not null default 'founder'
    check (workspace_mode in ('founder', 'creator', 'agency', 'solopreneur')),
  current_niche text,
  onboarding_completed boolean not null default false,
  persona text
    check (persona is null or persona in ('founder', 'creator', 'agency', 'solopreneur')),
  goal text
    check (goal is null or goal in (
      'build-startup', 'grow-agency', 'create-saas',
      'build-audience', 'earn-side-income'
    )),
  niche_focus text
    check (niche_focus is null or niche_focus in (
      'ai', 'saas', 'healthcare', 'finance', 'creator-economy', 'education'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User workspace preferences synced from onboarding';

-- ---------------------------------------------------------------------------
-- opportunities (intelligence signals)
-- ---------------------------------------------------------------------------
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  score integer not null default 0 check (score >= 0 and score <= 100),
  growth text not null default '+0%',
  demand integer not null default 0 check (demand >= 0 and demand <= 100),
  competition integer not null default 0 check (competition >= 0 and competition <= 100),
  category text not null,
  workspace_mode text
    check (workspace_mode is null or workspace_mode in ('founder', 'creator', 'agency', 'solopreneur')),
  current_niche text,
  mode_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists opportunities_workspace_niche_idx
  on public.opportunities (workspace_mode, current_niche);

create index if not exists opportunities_category_idx
  on public.opportunities (category);

comment on column public.opportunities.mode_data is
  'JSON: intelligence (founder/creator/agency), drawer copy, metadata (hot, trendStage, sources, keywords, etc.)';

-- ---------------------------------------------------------------------------
-- saved_opportunities
-- ---------------------------------------------------------------------------
create table if not exists public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create index if not exists saved_opportunities_user_id_idx
  on public.saved_opportunities (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for profiles
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, workspace_mode, current_niche)
  values (
    new.id,
    new.email,
    'founder',
    'b2b-saas'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.saved_opportunities enable row level security;

-- profiles: users read/update own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- opportunities: readable by authenticated users (public read for anon optional)
drop policy if exists "opportunities_select_authenticated" on public.opportunities;
create policy "opportunities_select_authenticated"
  on public.opportunities for select
  to authenticated
  using (true);

drop policy if exists "opportunities_select_anon" on public.opportunities;
create policy "opportunities_select_anon"
  on public.opportunities for select
  to anon
  using (true);

-- saved_opportunities: users manage own saves
drop policy if exists "saved_select_own" on public.saved_opportunities;
create policy "saved_select_own"
  on public.saved_opportunities for select
  using (auth.uid() = user_id);

drop policy if exists "saved_insert_own" on public.saved_opportunities;
create policy "saved_insert_own"
  on public.saved_opportunities for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_delete_own" on public.saved_opportunities;
create policy "saved_delete_own"
  on public.saved_opportunities for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed placeholder (replace UUIDs / copy mode_data from app mocks as needed)
-- ---------------------------------------------------------------------------
-- insert into public.opportunities (
--   title, score, growth, demand, competition, category,
--   workspace_mode, current_niche, mode_data
-- ) values (
--   'AI Workflow Automation',
--   87, '+124%', 92, 58, 'B2B SaaS',
--   'founder', 'b2b-saas',
--   '{"hot":true,"trendStage":"Accelerating","drawer":{"whyThisMatters":"...","recommendedAction":"...","targetClients":"...","viralVideoIdeas":[]},"intelligence":{}}'::jsonb
-- );
