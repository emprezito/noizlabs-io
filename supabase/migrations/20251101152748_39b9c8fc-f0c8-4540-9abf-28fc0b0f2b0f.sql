-- Update categories table to have 7 day expiry instead of 24 hours
ALTER TABLE public.categories 
ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');