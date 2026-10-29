-- Credit ledger on public.profiles (1:1 with auth.users — app "user" record)

alter table public.profiles
  add column if not exists credits_balance integer not null default 200,
  add column if not exists monthly_allowance integer not null default 200,
  add column if not exists buffer_used boolean not null default false,
  add column if not exists next_reset_date timestamptz,
  add column if not exists subscription_tier text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_subscription_tier_check;

alter table public.profiles
  add constraint profiles_subscription_tier_check
  check (subscription_tier in ('monthly', 'six_month', 'annual', 'free'));

update public.profiles
set next_reset_date = coalesce(
  next_reset_date,
  (date_trunc('month', timezone('utc', now())) + interval '1 month') at time zone 'utc'
)
where next_reset_date is null;

create or replace function public.maybe_reset_user_credits(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allowance int;
  reset_at timestamptz;
begin
  select monthly_allowance, next_reset_date
  into allowance, reset_at
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return;
  end if;

  if reset_at is null then
    reset_at := (date_trunc('month', timezone('utc', now())) + interval '1 month') at time zone 'utc';
    update public.profiles
    set next_reset_date = reset_at
    where id = p_user_id;
    return;
  end if;

  if timezone('utc', now()) >= reset_at then
    update public.profiles
    set
      credits_balance = allowance,
      buffer_used = false,
      next_reset_date = reset_at + interval '1 month',
      updated_at = now()
    where id = p_user_id;
  end if;
end;
$$;

create or replace function public.deduct_user_credits(p_user_id uuid, p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  bal integer;
  allowance integer;
  buf boolean;
  warning_text text := null;
  new_bal integer;
begin
  if p_amount is null or p_amount < 1 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  perform public.maybe_reset_user_credits(p_user_id);

  select credits_balance, monthly_allowance, buffer_used
  into bal, allowance, buf
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if bal <= 0 and buf = false then
    bal := 20;
    warning_text := 'Emergency buffer of 20 credits activated. This one-time safety net will not renew.';
    update public.profiles
    set credits_balance = 20, buffer_used = true, updated_at = now()
    where id = p_user_id;
  elsif bal <= 0 then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits',
      'remaining', 0,
      'allowance', allowance,
      'buffer_used', true
    );
  end if;

  if bal < p_amount then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits',
      'remaining', bal,
      'allowance', allowance,
      'buffer_used', buf
    );
  end if;

  new_bal := bal - p_amount;

  update public.profiles
  set credits_balance = new_bal, updated_at = now()
  where id = p_user_id;

  return jsonb_build_object(
    'ok', true,
    'remaining', new_bal,
    'allowance', allowance,
    'used', greatest(0, allowance - new_bal),
    'buffer_used', buf or warning_text is not null,
    'warning', warning_text
  );
end;
$$;

revoke all on function public.maybe_reset_user_credits(uuid) from public;
revoke all on function public.deduct_user_credits(uuid, integer) from public;
grant execute on function public.maybe_reset_user_credits(uuid) to service_role;
grant execute on function public.deduct_user_credits(uuid, integer) to service_role;

create index if not exists profiles_credits_reset_idx
  on public.profiles (next_reset_date)
  where next_reset_date is not null;
