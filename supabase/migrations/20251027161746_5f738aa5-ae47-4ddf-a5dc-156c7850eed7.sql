-- Add streak tracking to daily_quests
ALTER TABLE public.daily_quests ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0;

-- Add last_streak_date to track consecutive days
ALTER TABLE public.daily_quests ADD COLUMN IF NOT EXISTS last_streak_date date;

-- Insert social tasks
INSERT INTO public.tasks (name, description, points_reward, task_type, external_link, max_completions)
VALUES 
  ('Follow Founder on X', 'Follow our founder on X (Twitter) for updates and insights', 5, 'social', 'https://x.com/your_founder_handle', 1),
  ('Join Telegram', 'Join our Telegram community to stay connected', 5, 'social', 'https://t.me/your_telegram', 1),
  ('Follow Project on X', 'Follow our official project account on X', 5, 'social', 'https://x.com/your_project_handle', 1)
ON CONFLICT DO NOTHING;