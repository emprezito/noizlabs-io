-- Create categories table with 24hr expiry
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  creator_wallet TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can read all categories
CREATE POLICY "Anyone can view categories"
ON public.categories
FOR SELECT
USING (expires_at > now());

-- Anyone can create categories (wallet-based)
CREATE POLICY "Anyone can create categories"
ON public.categories
FOR INSERT
WITH CHECK (true);

-- Create audio_clips table
CREATE TABLE public.audio_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  creator_wallet TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_clips ENABLE ROW LEVEL SECURITY;

-- Public can read all clips
CREATE POLICY "Anyone can view clips"
ON public.audio_clips
FOR SELECT
USING (true);

-- Anyone can create clips (wallet-based)
CREATE POLICY "Anyone can create clips"
ON public.audio_clips
FOR INSERT
WITH CHECK (true);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_wallet TEXT NOT NULL,
  clip_id UUID NOT NULL REFERENCES public.audio_clips(id) ON DELETE CASCADE,
  battle_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(voter_wallet, battle_id)
);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Public can read all votes
CREATE POLICY "Anyone can view votes"
ON public.votes
FOR SELECT
USING (true);

-- Anyone can create votes (wallet-based)
CREATE POLICY "Anyone can create votes"
ON public.votes
FOR INSERT
WITH CHECK (true);

-- Create user_points table tied to wallet addresses
CREATE TABLE public.user_points (
  wallet_address TEXT NOT NULL PRIMARY KEY,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Public can read all points
CREATE POLICY "Anyone can view points"
ON public.user_points
FOR SELECT
USING (true);

-- Public can insert/update their own points
CREATE POLICY "Anyone can manage points"
ON public.user_points
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to get vote count for a clip
CREATE OR REPLACE FUNCTION public.get_clip_votes(clip_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.votes
  WHERE clip_id = clip_uuid;
$$;

-- Create function to update user points
CREATE OR REPLACE FUNCTION public.add_user_points(wallet TEXT, points_to_add INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_points (wallet_address, points, updated_at)
  VALUES (wallet, points_to_add, now())
  ON CONFLICT (wallet_address)
  DO UPDATE SET
    points = user_points.points + points_to_add,
    updated_at = now();
END;
$$;

-- Create index for faster queries
CREATE INDEX idx_audio_clips_category ON public.audio_clips(category_id);
CREATE INDEX idx_votes_clip ON public.votes(clip_id);
CREATE INDEX idx_votes_wallet ON public.votes(voter_wallet);
CREATE INDEX idx_categories_expires ON public.categories(expires_at);