-- Schedules the escalate-tasks Edge Function to run every 15 minutes.
-- Requires the pg_cron and pg_net extensions (both available on Supabase).
-- The project ref + service role key are baked in via Vault-backed settings
-- at deploy time — see README "Escalation cron" section.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select
  cron.schedule(
    'maintops-escalate-tasks',
    '*/15 * * * *',
    $$
    select net.http_post(
      url := current_setting('app.settings.escalate_tasks_url', true),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
    $$
  );
