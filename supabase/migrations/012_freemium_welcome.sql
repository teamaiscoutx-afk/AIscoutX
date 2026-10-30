-- Freemium welcome credits + free-tier paywall (no emergency buffer on free)

alter table public.profiles
  add column if not exists welcome_credits_granted boolean not null default false;

alter table public.profiles
  alter column credits_balance set default 20;

alter table public.profiles
  alter column monthly_allowance set default 20;

create or replace function public.grant_welcome_credits(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    credits_balance = 20,
    monthly_allowance = 20,
    subscription_tier = 'free',
    welcome_credits_granted = true,
    buffer_used = false,
    updated_at = now()
  where id = p_user_id
    and welcome_credits_granted = false;
end;
$$;

revoke all on function public.grant_welcome_credits(uuid) from public;
grant execute on function public.grant_welcome_credits(uuid) to service_role;

create or replace function public.maybe_reset_user_credits(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allowance int;
  reset_at timestamptz;
  tier text;
begin
  select monthly_allowance, next_reset_date, subscription_tier
  into allowance, reset_at, tier
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return;
  end if;

  if tier = 'free' then
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
  tier text;
  warning_text text := null;
  new_bal integer;
begin
  if p_amount is null or p_amount < 1 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  perform public.maybe_reset_user_credits(p_user_id);

  select credits_balance, monthly_allowance, buffer_used, subscription_tier
  into bal, allowance, buf, tier
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if bal <= 0 then
    if tier = 'free' then
      return jsonb_build_object(
        'ok', false,
        'error', 'insufficient_credits',
        'remaining', 0,
        'allowance', allowance,
        'buffer_used', buf,
        'subscription_tier', tier
      );
    end if;

    if buf = false then
      bal := 20;
      warning_text := 'Emergency buffer of 20 credits activated. This one-time safety net will not renew.';
      update public.profiles
      set credits_balance = 20, buffer_used = true, updated_at = now()
      where id = p_user_id;
    else
      return jsonb_build_object(
        'ok', false,
        'error', 'insufficient_credits',
        'remaining', 0,
        'allowance', allowance,
        'buffer_used', true,
        'subscription_tier', tier
      );
    end if;
  end if;

  if bal < p_amount then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits',
      'remaining', bal,
      'allowance', allowance,
      'buffer_used', buf,
      'subscription_tier', tier
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
    'warning', warning_text,
    'subscription_tier', tier
  );
end;
$$;
