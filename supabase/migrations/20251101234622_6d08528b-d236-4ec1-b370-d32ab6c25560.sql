-- Add timezone and personalization columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS timezone_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS personalization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_genres TEXT[] DEFAULT '{}';

-- Add genre column to categories
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS genre TEXT;

-- Create index for faster genre filtering
CREATE INDEX IF NOT EXISTS idx_categories_genre ON public.categories(genre);

-- Create index for profiles personalization lookup
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_personalization ON public.profiles(wallet_address, personalization);