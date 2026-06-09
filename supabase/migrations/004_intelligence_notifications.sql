-- Intelligence engine: workspace watching, signal snapshots, platform notifications

alter table public.workspaces
  add column if not exists is_active boolean not null default false,
  add column if not exists niche_focus text;

create index if not exists workspaces_active_idx on public.workspaces (user_id, is_active);

create table if not exists public.workspace_signal_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  demand_score integer not null default 0 check (demand_score >= 0 and demand_score <= 100),
  competition_score integer not null default 0 check (competition_score >= 0 and competition_score <= 100),
  disruption_score integer not null default 0 check (disruption_score >= 0 and disruption_score <= 100),
  raw_signals jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

create index if not exists workspace_signal_snapshots_workspace_idx
  on public.workspace_signal_snapshots (workspace_id, captured_at desc);

create table if not exists public.platform_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  title text not null,
  body text not null,
  emoji text not null default '🔔',
  signal_type text not null
    check (signal_type in ('pain_point', 'momentum', 'competition', 'system')),
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists platform_notifications_user_idx
  on public.platform_notifications (user_id, created_at desc);

alter table public.workspace_signal_snapshots enable row level security;
alter table public.platform_notifications enable row level security;

drop policy if exists "Users read own signal snapshots" on public.workspace_signal_snapshots;
create policy "Users read own signal snapshots" on public.workspace_signal_snapshots
  for select using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_signal_snapshots.workspace_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own signal snapshots" on public.workspace_signal_snapshots;
create policy "Users insert own signal snapshots" on public.workspace_signal_snapshots
  for insert with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_signal_snapshots.workspace_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "Users read own notifications" on public.platform_notifications;
create policy "Users read own notifications" on public.platform_notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.platform_notifications;
create policy "Users update own notifications" on public.platform_notifications
  for update using (auth.uid() = user_id);

drop policy if exists "Users insert own notifications" on public.platform_notifications;
create policy "Users insert own notifications" on public.platform_notifications
  for insert with check (auth.uid() = user_id);
