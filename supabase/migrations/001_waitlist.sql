-- Run this in the Supabase SQL Editor to create the waitlist table.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_unique unique (email)
);

-- Allow anonymous inserts from the landing page (anon key + RLS)
alter table public.waitlist enable row level security;

create policy "Allow public waitlist signup"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Optional: prevent public reads of other emails
create policy "No public read on waitlist"
  on public.waitlist
  for select
  to anon
  using (false);
