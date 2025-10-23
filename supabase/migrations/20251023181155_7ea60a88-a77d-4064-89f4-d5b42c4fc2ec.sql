-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_profiles_wallet ON public.profiles(wallet_address);
CREATE INDEX idx_profiles_username ON public.profiles(username);