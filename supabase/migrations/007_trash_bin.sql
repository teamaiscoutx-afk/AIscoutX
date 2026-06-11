-- 007: Multi-project trash bin architecture.
-- Soft-delete support for workspaces (projects) and venture_packs (blueprints).

alter table public.workspaces
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

alter table public.venture_packs
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_workspaces_user_deleted
  on public.workspaces (user_id, is_deleted);

create index if not exists idx_venture_packs_user_deleted
  on public.venture_packs (user_id, is_deleted);
