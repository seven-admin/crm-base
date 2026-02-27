-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule monthly cleanup: 1st of each month at 03:00 UTC
SELECT cron.schedule(
  'cleanup-webhook-logs-monthly',
  '0 3 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://pizerpoxuqopekmbvohh.supabase.co/functions/v1/cleanup-webhook-logs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpemVycG94dXFvcGVrbWJ2b2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTg4MzUsImV4cCI6MjA4MjY3NDgzNX0.btGv07xrKKSaoR0bybT4tNVU8AjsfOO5jFgd5aG8VUU"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);