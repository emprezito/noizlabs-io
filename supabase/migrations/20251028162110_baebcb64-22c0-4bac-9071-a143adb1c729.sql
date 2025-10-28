-- ========================================
-- WALLET AUTHENTICATION SCHEMA UPDATE
-- Links profiles to Supabase auth.users
-- ========================================

-- Add user_id column to profiles table to link with auth.users
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index on user_id (one profile per user)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles(user_id);

-- Update existing profiles to have user_id (will be populated by edge function)
-- For now, profiles without user_id will be handled by the auth flow

-- Update RLS policies to use auth.uid() instead of JWT claims
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own quests only" ON public.daily_quests;
DROP POLICY IF EXISTS "Users can insert own quests only" ON public.daily_quests;
DROP POLICY IF EXISTS "Users can update own quests only" ON public.daily_quests;
DROP POLICY IF EXISTS "Users view own tasks only" ON public.user_tasks;
DROP POLICY IF EXISTS "Users insert own tasks only" ON public.user_tasks;
DROP POLICY IF EXISTS "Users update own tasks only" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can vote with own wallet only" ON public.votes;

-- PROFILES: Users can only update their own profile (by user_id)
CREATE POLICY "Users can update own profile by user_id"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid());

-- DAILY_QUESTS: Keep wallet-based for now, but add user_id later
CREATE POLICY "Users can view own quests"
ON public.daily_quests
FOR SELECT
USING (
  user_wallet IN (
    SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own quests"
ON public.daily_quests
FOR INSERT
WITH CHECK (
  user_wallet IN (
    SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own quests"
ON public.daily_quests
FOR UPDATE
USING (
  user_wallet IN (
    SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- USER_TASKS: Wallet-based with auth check
CREATE POLICY "Users can view own tasks"
ON public.user_tasks
FOR SELECT
USING (
  user_wallet IN (
    SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own tasks"
ON public.user_tasks
FOR INSERT
WITH CHECK (
  user_wallet IN (
    SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own tasks"
ON public.user_tasks
FOR UPDATE
USING (
  user_wallet IN (
    SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- VOTES: Wallet-based with auth check
CREATE POLICY "Users can vote with own wallet"
ON public.votes
FOR INSERT
WITH CHECK (
  voter_wallet IN (
    SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Function to get or create user for wallet authentication
CREATE OR REPLACE FUNCTION public.get_or_create_wallet_user(
  p_wallet_address text,
  p_username text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile_exists boolean;
BEGIN
  -- Check if profile exists with this wallet
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE wallet_address = p_wallet_address;
  
  -- If profile doesn't have user_id, we need to create one
  IF v_user_id IS NULL THEN
    -- Check if profile exists without user_id
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE wallet_address = p_wallet_address)
    INTO v_profile_exists;
    
    -- Note: We can't create auth.users from this function
    -- The edge function will handle user creation via admin API
    -- This function just links existing profiles to users
    RETURN NULL;
  END IF;
  
  RETURN v_user_id;
END;
$$;