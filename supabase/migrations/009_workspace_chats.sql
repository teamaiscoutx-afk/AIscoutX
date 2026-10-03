-- Mentor chat history, pinned chats, and trash — scoped to the signed-in user.

create table if not exists public.workspace_chats (
  id text not null,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  messages jsonb not null default '[]'::jsonb,
  is_deleted boolean not null default false,
  is_pinned boolean not null default false,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);

create index if not exists workspace_chats_user_idx
  on public.workspace_chats (user_id, workspace_id);

alter table public.workspace_chats enable row level security;

drop policy if exists "Users read own workspace chats" on public.workspace_chats;
create policy "Users read own workspace chats"
  on public.workspace_chats for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own workspace chats" on public.workspace_chats;
create policy "Users insert own workspace chats"
  on public.workspace_chats for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own workspace chats" on public.workspace_chats;
create policy "Users update own workspace chats"
  on public.workspace_chats for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own workspace chats" on public.workspace_chats;
create policy "Users delete own workspace chats"
  on public.workspace_chats for delete
  using (auth.uid() = user_id);
