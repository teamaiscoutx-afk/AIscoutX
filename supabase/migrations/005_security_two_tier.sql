-- Production lockdown: two-tier plans (free | pro), subscription status, full RLS audit

-- ---------------------------------------------------------------------------
-- 1. Two-tier plan enforcement on profiles
-- ---------------------------------------------------------------------------

-- Migrate legacy paid tiers to pro before tightening the constraint
update public.profiles
set plan = 'pro'
where plan in ('starter', 'agency');

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro'));

alter table public.profiles
  add column if not exists subscription_status text not null default 'active';

alter table public.profiles
  drop constraint if exists profiles_subscription_status_check;

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in ('active', 'canceled'));

alter table public.profiles
  add column if not exists stripe_customer_id text;

create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id);

-- ---------------------------------------------------------------------------
-- 2. RLS audit — fill policy gaps so no user can touch another user's rows
-- ---------------------------------------------------------------------------

-- venture_packs: update/delete own (select/insert exist in 003)
drop policy if exists venture_packs_update_own on public.venture_packs;
create policy venture_packs_update_own on public.venture_packs
  for update using (auth.uid() = user_id);

drop policy if exists venture_packs_delete_own on public.venture_packs;
create policy venture_packs_delete_own on public.venture_packs
  for delete using (auth.uid() = user_id);

-- usage_wallets: delete own (select/insert/update exist in 003)
drop policy if exists usage_wallets_delete_own on public.usage_wallets;
create policy usage_wallets_delete_own on public.usage_wallets
  for delete using (auth.uid() = user_id);

-- platform_notifications: delete own (select/insert/update exist in 004)
drop policy if exists "Users delete own notifications" on public.platform_notifications;
create policy "Users delete own notifications" on public.platform_notifications
  for delete using (auth.uid() = user_id);

-- workspace_signal_snapshots: update/delete via owning workspace
drop policy if exists "Users update own signal snapshots" on public.workspace_signal_snapshots;
create policy "Users update own signal snapshots" on public.workspace_signal_snapshots
  for update using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_signal_snapshots.workspace_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete own signal snapshots" on public.workspace_signal_snapshots;
create policy "Users delete own signal snapshots" on public.workspace_signal_snapshots
  for delete using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_signal_snapshots.workspace_id and w.user_id = auth.uid()
    )
  );

-- profiles: explicitly deny delete from clients (no delete policy = denied under RLS;
-- assert RLS is enabled everywhere)
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.workspaces enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.usage_wallets enable row level security;
alter table public.venture_packs enable row level security;
alter table public.workspace_signal_snapshots enable row level security;
alter table public.platform_notifications enable row level security;
alter table public.waitlist enable row level security;

-- opportunities: shared read-only catalog. Writes only via service role
-- (no insert/update/delete policies for anon/authenticated).
drop policy if exists "opportunities_write_authenticated" on public.opportunities;
