-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the reset-daily-quests function to run every day at midnight UTC
SELECT cron.schedule(
  'reset-daily-quests-midnight',
  '0 0 * * *', -- Every day at 00:00 UTC (midnight)
  $$
  SELECT
    net.http_post(
        url:='https://pcvhetatlmydhmppzxak.supabase.co/functions/v1/reset-daily-quests',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdmhldGF0bG15ZGhtcHB6eGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzgyNjUsImV4cCI6MjA3NjcxNDI2NX0.vAidNahHamdDPRK995pwP3CTBkn70gh3YzlvTgA46QU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
