-- MaintOps core schema: profiles, stores, maintenance_teams, maintenance_tasks, app_notifications
-- Mirrors the role/RLS model documented in the original Base44 export.

create extension if not exists pgcrypto;

-- ============================================================================
-- profiles (extends auth.users — equivalent to the base44 built-in User entity)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'pending_requester' check (role in (
    'admin', 'leadership', 'coordinator', 'maintenance', 'requester',
    'pending_requester', 'pending_maintenance', 'pending_leadership', 'pending_coordinator',
    'deleted'
  )),
  store_id uuid,
  store_ids uuid[] not null default '{}',
  store_name text,
  team_name text,
  requested_role text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- ============================================================================
-- stores
-- ============================================================================
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  store_code text not null unique,
  name text not null,
  region text,
  address text,
  contact_name text,
  contact_phone text,
  contact_email text,
  maintenance_team text,
  maintenance_team_email text,
  maintenance_team_phone text,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_store_id_fkey foreign key (store_id) references public.stores (id) on delete set null;

-- ============================================================================
-- maintenance_teams
-- ============================================================================
create table public.maintenance_teams (
  id uuid primary key default gen_random_uuid(),
  team_code text not null unique,
  name text not null,
  specialization text check (specialization in ('plumbing', 'electrical', 'structural', 'hvac', 'general')),
  leader_name text,
  leader_phone text,
  leader_email text,
  status text not null default 'idle' check (status in ('active', 'idle', 'on_break')),
  member_count integer not null default 4,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- ============================================================================
-- maintenance_tasks
-- ============================================================================
create table public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  task_code text,
  title text not null,
  description text,
  category text not null check (category in (
    'civil', 'electrical', 'cooling', 'plumbing', 'equipment', 'generator', 'firefighting'
  )),
  sub_category text,
  cooling_issue text check (cooling_issue in ('ice_build_up', 'water_leak', 'temperature', 'electrical')),
  sub_location text,
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  status text not null default 'assigned' check (status in ('assigned', 'on_hold', 'resolved')),
  store_id uuid not null references public.stores (id) on delete restrict,
  store_code text,
  store_name text,
  assigned_team_id uuid references public.maintenance_teams (id) on delete set null,
  assigned_team_name text,
  photo_urls text[] not null default '{}',
  completion_photos text[] not null default '{}',
  notes text,
  resolution_notes text,
  estimated_hours numeric,
  actual_hours numeric,
  assigned_date timestamptz,
  resolved_date timestamptz,
  escalation_level integer not null default 0,
  escalated_at timestamptz,
  escalated_to_hod_at timestamptz,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index maintenance_tasks_store_id_idx on public.maintenance_tasks (store_id);
create index maintenance_tasks_assigned_team_id_idx on public.maintenance_tasks (assigned_team_id);
create index maintenance_tasks_status_idx on public.maintenance_tasks (status);
create index maintenance_tasks_created_by_idx on public.maintenance_tasks (created_by);

-- ============================================================================
-- app_notifications
-- ============================================================================
create table public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  recipient_role text,
  type text not null check (type in (
    'task_created', 'task_assigned', 'task_updated', 'task_escalated', 'task_resolved', 'task_closed'
  )),
  title text not null,
  body text,
  task_id uuid references public.maintenance_tasks (id) on delete cascade,
  task_code text,
  read boolean not null default false,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index app_notifications_recipient_email_idx on public.app_notifications (recipient_email);

-- ============================================================================
-- Helper functions (SECURITY DEFINER so they can read `profiles` without
-- triggering RLS recursion when used inside other tables' policies)
-- ============================================================================
create or replace function public.current_profile()
returns public.profiles
language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_email()
returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles where id = auth.uid();
$$;

create or replace function public.current_store_ids()
returns uuid[]
language sql stable security definer set search_path = public as $$
  select store_ids from public.profiles where id = auth.uid();
$$;

create or replace function public.current_team_name()
returns text
language sql stable security definer set search_path = public as $$
  select team_name from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- created_by / updated_date bookkeeping triggers
-- ============================================================================
create or replace function public.set_created_by()
returns trigger language plpgsql as $$
begin
  if new.created_by is null then
    new.created_by := public.current_email();
  end if;
  return new;
end;
$$;

create or replace function public.set_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date := now();
  return new;
end;
$$;

create trigger stores_set_created_by before insert on public.stores
  for each row execute function public.set_created_by();
create trigger stores_set_updated_date before update on public.stores
  for each row execute function public.set_updated_date();

create trigger maintenance_teams_set_created_by before insert on public.maintenance_teams
  for each row execute function public.set_created_by();
create trigger maintenance_teams_set_updated_date before update on public.maintenance_teams
  for each row execute function public.set_updated_date();

create trigger maintenance_tasks_set_created_by before insert on public.maintenance_tasks
  for each row execute function public.set_created_by();
create trigger maintenance_tasks_set_updated_date before update on public.maintenance_tasks
  for each row execute function public.set_updated_date();

create trigger app_notifications_set_created_by before insert on public.app_notifications
  for each row execute function public.set_created_by();
create trigger app_notifications_set_updated_date before update on public.app_notifications
  for each row execute function public.set_updated_date();

create trigger profiles_set_updated_date before update on public.profiles
  for each row execute function public.set_updated_date();

-- ============================================================================
-- Auto-create a profile row whenever a new auth user signs up.
-- The requested role travels in via signInWithOtp({ options: { data: { requested_role } } }).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, requested_role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'requested_role', 'pending_requester'),
    new.raw_user_meta_data ->> 'requested_role'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- create_app_notification RPC — the only way clients create AppNotification
-- rows. Runs as SECURITY DEFINER so any authenticated user can notify other
-- users about a task event (mirrors "notifications are created server-side
-- with elevated privileges" in the original RLS notes) without granting
-- blanket INSERT access on the table itself.
-- ============================================================================
create or replace function public.create_app_notification(
  p_recipient_email text,
  p_recipient_role text,
  p_type text,
  p_title text,
  p_body text,
  p_task_id uuid,
  p_task_code text
)
returns public.app_notifications
language plpgsql security definer set search_path = public as $$
declare
  result public.app_notifications;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.app_notifications (
    recipient_email, recipient_role, type, title, body, task_id, task_code, created_by
  ) values (
    p_recipient_email, p_recipient_role, p_type, p_title, p_body, p_task_id, p_task_code, public.current_email()
  ) returning * into result;

  return result;
end;
$$;

grant execute on function public.create_app_notification to authenticated;

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.maintenance_teams enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.app_notifications enable row level security;

-- profiles: any authenticated user can read the directory (needed to look up
-- admins/coordinators/teams to notify); only self or an admin can update.
create policy profiles_select on public.profiles
  for select to authenticated using (true);

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.current_role() = 'admin')
  with check (id = auth.uid() or public.current_role() = 'admin');

-- stores
create policy stores_select on public.stores
  for select to authenticated using (
    public.current_role() in ('admin', 'leadership', 'coordinator')
    or id = any (public.current_store_ids())
  );

create policy stores_insert on public.stores
  for insert to authenticated with check (public.current_role() = 'admin');

create policy stores_update on public.stores
  for update to authenticated using (public.current_role() = 'admin');

create policy stores_delete on public.stores
  for delete to authenticated using (public.current_role() = 'admin');

-- maintenance_teams: readable by every approved role, writable by admin/coordinator
create policy maintenance_teams_select on public.maintenance_teams
  for select to authenticated using (
    public.current_role() in ('admin', 'leadership', 'coordinator', 'maintenance', 'requester')
  );

create policy maintenance_teams_insert on public.maintenance_teams
  for insert to authenticated with check (public.current_role() in ('admin', 'coordinator'));

create policy maintenance_teams_update on public.maintenance_teams
  for update to authenticated using (public.current_role() in ('admin', 'coordinator'));

create policy maintenance_teams_delete on public.maintenance_teams
  for delete to authenticated using (public.current_role() = 'admin');

-- maintenance_tasks
create policy maintenance_tasks_select on public.maintenance_tasks
  for select to authenticated using (
    public.current_role() in ('admin', 'leadership', 'coordinator')
    or created_by = public.current_email()
    or assigned_team_name = public.current_team_name()
    or store_id = any (public.current_store_ids())
  );

create policy maintenance_tasks_insert on public.maintenance_tasks
  for insert to authenticated with check (
    public.current_role() in ('requester', 'admin', 'coordinator')
  );

create policy maintenance_tasks_update on public.maintenance_tasks
  for update to authenticated using (
    public.current_role() in ('admin', 'coordinator')
    or assigned_team_name = public.current_team_name()
    or created_by = public.current_email()
  );

create policy maintenance_tasks_delete on public.maintenance_tasks
  for delete to authenticated using (public.current_role() in ('admin', 'coordinator'));

-- app_notifications: no direct INSERT policy — rows are created exclusively
-- through the create_app_notification() RPC above.
create policy app_notifications_select on public.app_notifications
  for select to authenticated using (
    recipient_email = public.current_email()
    or public.current_role() in ('admin', 'leadership', 'coordinator')
  );

create policy app_notifications_update on public.app_notifications
  for update to authenticated using (
    recipient_email = public.current_email()
    or public.current_role() in ('admin', 'leadership', 'coordinator')
  );

create policy app_notifications_delete on public.app_notifications
  for delete to authenticated using (public.current_role() = 'admin');

-- ============================================================================
-- Realtime — the NotificationBell subscribes to AppNotification changes.
-- ============================================================================
alter publication supabase_realtime add table public.app_notifications;
