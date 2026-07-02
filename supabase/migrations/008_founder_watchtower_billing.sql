-- Founder Watchtower notifications + subscription renewal tracking

alter table public.profiles
  add column if not exists subscription_renewal_at timestamptz;

alter table public.profiles
  add column if not exists last_renewal_warning_at timestamptz;

alter table public.platform_notifications
  add column if not exists source_link text;

alter table public.platform_notifications
  add column if not exists niche_focus text;

create index if not exists platform_notifications_user_niche_idx
  on public.platform_notifications (user_id, niche_focus, created_at desc);

create index if not exists profiles_subscription_renewal_idx
  on public.profiles (subscription_renewal_at)
  where plan = 'pro';
