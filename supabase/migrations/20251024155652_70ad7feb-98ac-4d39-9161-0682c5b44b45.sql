-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  points_reward integer NOT NULL DEFAULT 5,
  task_type text NOT NULL,
  external_link text,
  max_completions integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_tasks table to track completions
CREATE TABLE IF NOT EXISTS public.user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet text NOT NULL,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed_at timestamp with time zone DEFAULT now(),
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_wallet, task_id)
);

-- Add referral tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by text,
ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS referred_users text[] DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Anyone can view tasks"
  ON public.tasks FOR SELECT
  USING (true);

-- User tasks policies
CREATE POLICY "Users can view their own task completions"
  ON public.user_tasks FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own task completions"
  ON public.user_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own task completions"
  ON public.user_tasks FOR UPDATE
  USING (true);

-- Insert default tasks
INSERT INTO public.tasks (name, description, points_reward, task_type, external_link, max_completions) VALUES
  ('Follow Founder on X', 'Follow @emprezito1 on X (Twitter)', 5, 'social', 'https://x.com/emprezito1', 1),
  ('Follow NoizLabs on X', 'Follow @noizlabs_io on X (Twitter)', 5, 'social', 'https://x.com/noizlabs_io', 1),
  ('Join Telegram', 'Join the NoizLabs community on Telegram', 5, 'social', 'https://t.me/noizlabs_io', 1),
  ('Refer Friends', 'Refer up to 10 friends. Each verified referral earns you 10 points when they connect a wallet and create a category.', 10, 'referral', NULL, 10)
ON CONFLICT DO NOTHING;

-- Function to handle referral verification
CREATE OR REPLACE FUNCTION public.verify_referral(referrer_wallet text, referred_wallet text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_task_id uuid;
  current_referral_count integer;
BEGIN
  -- Get referral task id
  SELECT id INTO referral_task_id FROM public.tasks WHERE task_type = 'referral' LIMIT 1;
  
  -- Get current referral count
  SELECT referral_count INTO current_referral_count FROM public.profiles WHERE wallet_address = referrer_wallet;
  
  -- Check if referrer hasn't exceeded max referrals (10)
  IF current_referral_count < 10 THEN
    -- Update referrer's profile
    UPDATE public.profiles 
    SET 
      referral_count = referral_count + 1,
      referred_users = array_append(referred_users, referred_wallet)
    WHERE wallet_address = referrer_wallet;
    
    -- Create or update task completion
    INSERT INTO public.user_tasks (user_wallet, task_id, verified)
    VALUES (referrer_wallet, referral_task_id, true)
    ON CONFLICT (user_wallet, task_id) DO NOTHING;
    
    -- Award points
    PERFORM public.add_user_points(referrer_wallet, 10);
  END IF;
END;
$$;