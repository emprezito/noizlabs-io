-- Fix search_path for get_clip_votes function
CREATE OR REPLACE FUNCTION public.get_clip_votes(clip_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.votes
  WHERE clip_id = clip_uuid;
$$;

-- Fix search_path for add_user_points function
CREATE OR REPLACE FUNCTION public.add_user_points(wallet TEXT, points_to_add INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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