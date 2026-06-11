-- 007: Multi-project trash bin architecture.
-- Soft-delete support for workspaces (projects) and opportunities (blueprints
-- are stored on the opportunities table under category = 'venture-pack').

alter table public.workspaces
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

alter table public.opportunities
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_workspaces_user_deleted
  on public.workspaces (user_id, is_deleted);

create index if not exists idx_opportunities_deleted
  on public.opportunities (category, is_deleted);

-- Venture packs are user-owned rows inside the shared opportunities catalog.
-- Allow authenticated users to manage ONLY their own 'venture-pack' rows
-- (ownership lives at mode_data->venturePack->>ownerId).

drop policy if exists opportunities_venture_pack_insert on public.opportunities;
create policy opportunities_venture_pack_insert on public.opportunities
  for insert to authenticated
  with check (
    category = 'venture-pack'
    and (mode_data -> 'venturePack' ->> 'ownerId') = auth.uid()::text
  );

drop policy if exists opportunities_venture_pack_update on public.opportunities;
create policy opportunities_venture_pack_update on public.opportunities
  for update to authenticated
  using (
    category = 'venture-pack'
    and (mode_data -> 'venturePack' ->> 'ownerId') = auth.uid()::text
  );

drop policy if exists opportunities_venture_pack_delete on public.opportunities;
create policy opportunities_venture_pack_delete on public.opportunities
  for delete to authenticated
  using (
    category = 'venture-pack'
    and (mode_data -> 'venturePack' ->> 'ownerId') = auth.uid()::text
  );
