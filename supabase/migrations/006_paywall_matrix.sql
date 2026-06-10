-- Paywall matrix: monthly opportunity-expansion counter for the Analyze gate

alter table public.usage_wallets
  add column if not exists opportunity_expansions_this_month integer not null default 0,
  add column if not exists expansions_month_key text not null default to_char(current_date, 'YYYY-MM');
