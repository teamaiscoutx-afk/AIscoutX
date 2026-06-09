-- MVP plan tiers + usage wallet + venture generation packs

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency'));

CREATE TABLE IF NOT EXISTS public.usage_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_views_today integer NOT NULL DEFAULT 0,
  opportunity_views_date date NOT NULL DEFAULT CURRENT_DATE,
  blueprints_this_month integer NOT NULL DEFAULT 0,
  blueprints_month_key text NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
  chat_messages_this_month integer NOT NULL DEFAULT 0,
  chat_month_key text NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.venture_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  analyze_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  blueprint_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  launch_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venture_packs_user_id_idx ON public.venture_packs(user_id);
CREATE INDEX IF NOT EXISTS venture_packs_created_at_idx ON public.venture_packs(created_at DESC);

ALTER TABLE public.usage_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venture_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_wallets_select_own ON public.usage_wallets;
CREATE POLICY usage_wallets_select_own ON public.usage_wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_wallets_insert_own ON public.usage_wallets;
CREATE POLICY usage_wallets_insert_own ON public.usage_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_wallets_update_own ON public.usage_wallets;
CREATE POLICY usage_wallets_update_own ON public.usage_wallets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS venture_packs_select_own ON public.venture_packs;
CREATE POLICY venture_packs_select_own ON public.venture_packs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS venture_packs_insert_own ON public.venture_packs;
CREATE POLICY venture_packs_insert_own ON public.venture_packs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
