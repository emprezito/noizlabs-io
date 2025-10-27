-- Enable realtime for daily_quests table
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_quests;

-- Enable realtime for user_tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_tasks;

-- Enable realtime for user_points table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_points;