-- Create daily check-ins table for streak tracking
CREATE TABLE IF NOT EXISTS public.daily_check_ins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet text NOT NULL,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  streak_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_wallet, check_in_date)
);

-- Enable RLS
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_check_ins
CREATE POLICY "Users can view their own check-ins"
  ON public.daily_check_ins FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own check-ins"
  ON public.daily_check_ins FOR INSERT
  WITH CHECK (true);

-- Create daily quests progress table
CREATE TABLE IF NOT EXISTS public.daily_quests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet text NOT NULL,
  quest_date date NOT NULL DEFAULT CURRENT_DATE,
  categories_created integer NOT NULL DEFAULT 0,
  clips_uploaded integer NOT NULL DEFAULT 0,
  votes_cast integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_wallet, quest_date)
);

-- Enable RLS
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_quests
CREATE POLICY "Users can view their own quests"
  ON public.daily_quests FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own quests"
  ON public.daily_quests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own quests"
  ON public.daily_quests FOR UPDATE
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_daily_check_ins_wallet ON public.daily_check_ins(user_wallet);
CREATE INDEX idx_daily_quests_wallet ON public.daily_quests(user_wallet, quest_date);