-- AIscoutX Founder OS: profiles extension, workspaces, daily_tasks

-- 1. Puraane galti se lage constraints ko safely drop karenge agar exist karte hain
alter table public.profiles drop constraint if exists profiles_persona_check;
alter table public.profiles drop constraint if exists profiles_goal_check;
alter table public.profiles drop constraint if exists profiles_niche_focus_check;

-- 2. Columns ko bina strict CHECK constraints ke safely add karenge
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists persona text,
  add column if not exists goal text,
  add column if not exists niche_focus text;

-- 3. Data ko migrate aur coalesce karenge jaisa pehle tha
update public.profiles
set
  persona = coalesce(persona, workspace_mode),
  niche_focus = coalesce(niche_focus, current_niche)
where persona is null or niche_focus is null;

-- 4. Workspaces Table banayein
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  opportunity_name text not null,
  summary_json jsonb not null default '{}'::jsonb,
  current_stage text not null default 'discover'
    check (current_stage in ('discover', 'validate', 'build', 'launch', 'grow')),
  validation_score integer not null default 0 check (validation_score >= 0 and validation_score <= 100),
  mvp_score integer not null default 0 check (mvp_score >= 0 and mvp_score <= 100),
  launch_score integer not null default 0 check (launch_score >= 0 and launch_score <= 100),
  sales_score integer not null default 0 check (sales_score >= 0 and sales_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_user_id_idx on public.workspaces (user_id);
create index if not exists workspaces_stage_idx on public.workspaces (current_stage);

-- 5. Daily Tasks Table banayein
create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  task_text text not null,
  is_completed boolean not null default false,
  stage_type text not null
    check (stage_type in ('validation', 'mvp', 'launch', 'sales')),
  created_at timestamptz not null default now()
);

create index if not exists daily_tasks_workspace_id_idx on public.daily_tasks (workspace_id);

-- 6. RLS Policies Enable karein
alter table public.workspaces enable row level security;
alter table public.daily_tasks enable row level security;

-- 7. Workspaces ki RLS Policies (Safely recreate karne ke liye drop if exists add kar sakte hain)
drop policy if exists "Users read own workspaces" on public.workspaces;
create policy "Users read own workspaces" on public.workspaces for select using (auth.uid() = user_id);

drop policy if exists "Users insert own workspaces" on public.workspaces;
create policy "Users insert own workspaces" on public.workspaces for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own workspaces" on public.workspaces;
create policy "Users update own workspaces" on public.workspaces for update using (auth.uid() = user_id);

drop policy if exists "Users delete own workspaces" on public.workspaces;
create policy "Users delete own workspaces" on public.workspaces for delete using (auth.uid() = user_id);

-- 8. Daily Tasks ki RLS Policies
drop policy if exists "Users read own daily tasks" on public.daily_tasks;
create policy "Users read own daily tasks" on public.daily_tasks for select using (
  exists (select 1 from public.workspaces w where w.id = daily_tasks.workspace_id and w.user_id = auth.uid())
);

drop policy if exists "Users insert own daily tasks" on public.daily_tasks;
create policy "Users insert own daily tasks" on public.daily_tasks for insert with check (
  exists (select 1 from public.workspaces w where w.id = daily_tasks.workspace_id and w.user_id = auth.uid())
);

drop policy if exists "Users update own daily tasks" on public.daily_tasks;
create policy "Users update own daily tasks" on public.daily_tasks for update using (
  exists (select 1 from public.workspaces w where w.id = daily_tasks.workspace_id and w.user_id = auth.uid())
);

drop policy if exists "Users delete own daily tasks" on public.daily_tasks;
create policy "Users delete own daily tasks" on public.daily_tasks for delete using (
  exists (select 1 from public.workspaces w where w.id = daily_tasks.workspace_id and w.user_id = auth.uid())
);

-- 9. Trigger aur Function Settings
create or replace function public.set_workspaces_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspaces_updated_at on public.workspaces;
create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_workspaces_updated_at();
