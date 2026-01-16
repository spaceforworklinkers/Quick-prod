-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- This command schedules a job (like an alarm clock) to run every day at midnight (UTC).
-- It calls the 'check-subscriptions' function we wrote.
-- 
-- IMPORTANT:
-- You MUST replace 'YOUR_SERVICE_ROLE_KEY' with your real Supabase Service Role Key.
-- This key acts like a password so the database is allowed to run the check.

select cron.schedule(
  'check-subscription-expiry', -- The name of the job
  '0 0 * * *',                 -- Run at 00:00 (Midnight)
  $$
  select
    net.http_post(
      url:='https://rxuezlqrzfkxujkkilnq.supabase.co/functions/v1/check-subscriptions',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- To check if it exists: select * from cron.job;
-- To stop it: select cron.unschedule('check-subscription-expiry');
