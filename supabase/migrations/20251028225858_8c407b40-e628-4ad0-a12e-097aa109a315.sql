-- Add IP tracking to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ip_address text;

-- Create index for faster IP lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ip_address ON public.profiles(ip_address);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.ip_address IS 'IP address used during wallet authentication for Sybil protection';