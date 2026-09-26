-- Schedules the escalate-tasks Edge Function to run every 15 minutes.
-- Requires the pg_cron and pg_net extensions (both available on Supabase).
--
-- NOTE: hosted Supabase does not grant the exposed `postgres` role
-- permission to run `alter database ... set app.settings.x` (that needs
-- true superuser). So this job is created with a placeholder command —
-- after deploying the `escalate-tasks` function, update it with the real
-- function URL + service role key via `cron.alter_job` (see README
-- "Escalation cron" section for the exact statement). Do not commit real
-- secret values into this file.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select
  cron.schedule(
    'maintops-escalate-tasks',
    '*/15 * * * *',
    $$
    select net.http_post(
      url := 'REPLACE_WITH_ESCALATE_TASKS_FUNCTION_URL',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer REPLACE_WITH_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    );
    $$
  );
