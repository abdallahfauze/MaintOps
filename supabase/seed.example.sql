-- Example seed data. Copy to seed.sql (or run manually in the SQL editor)
-- and adjust to your real store/team list before running.

insert into public.stores (store_code, name, region, maintenance_team) values
  ('ST01', 'Downtown Flagship', 'Riyadh', 'Team Alpha'),
  ('ST02', 'Airport Road', 'Jeddah', 'Team Bravo');

insert into public.maintenance_teams (team_code, name, specialization, status, member_count) values
  ('TEAM-A', 'Team Alpha', 'general', 'idle', 4),
  ('TEAM-B', 'Team Bravo', 'hvac', 'idle', 4);

-- After running this, invite users (Authentication -> Users -> Invite),
-- then use the Admin -> User Access page (once approved) to assign
-- stores/teams to each requester/maintenance user.
