-- Create daily_quests table for tracking daily quest progress
CREATE TABLE IF NOT EXISTS public.daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  date DATE NOT NULL DEFAULT (now()::date),
  checkin_done BOOLEAN NOT NULL DEFAULT false,
  created_category BOOLEAN NOT NULL DEFAULT false,
  votes_count INTEGER NOT NULL DEFAULT 0,
  rewarded_checkin BOOLEAN NOT NULL DEFAULT false,
  rewarded_votes BOOLEAN NOT NULL DEFAULT false,
  rewarded_category BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_daily_quests_user_date UNIQUE (user_wallet, date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

-- Permissive policies (aligning with existing app patterns)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_quests' AND policyname = 'Anyone can manage daily quests'
  ) THEN
    CREATE POLICY "Anyone can manage daily quests"
    ON public.daily_quests
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_quests' AND policyname = 'Anyone can view daily quests'
  ) THEN
    CREATE POLICY "Anyone can view daily quests"
    ON public.daily_quests
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON public.daily_quests (user_wallet, date);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_daily_quests_set_updated_at ON public.daily_quests;
CREATE TRIGGER trg_daily_quests_set_updated_at
BEFORE UPDATE ON public.daily_quests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();