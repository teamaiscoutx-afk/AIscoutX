-- Idempotent Razorpay order fulfillment (client verify + webhooks)

create table if not exists public.razorpay_fulfilled_orders (
  order_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null,
  processed_at timestamptz not null default now()
);

create index if not exists razorpay_fulfilled_orders_user_idx
  on public.razorpay_fulfilled_orders (user_id, processed_at desc);

alter table public.razorpay_fulfilled_orders enable row level security;
