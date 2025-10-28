-- Add unique constraint to prevent multiple check-ins per day
ALTER TABLE public.daily_quests DROP CONSTRAINT IF EXISTS daily_quests_user_wallet_date_key;
ALTER TABLE public.daily_quests ADD CONSTRAINT daily_quests_user_wallet_date_key UNIQUE (user_wallet, date);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON public.daily_quests(user_wallet, date);