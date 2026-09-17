# MaintOps

Facility maintenance management platform for a retail store network —
role-based task assignment, automated notifications, SLA tracking,
escalation workflows, and team performance reporting.

This is a rebuild of the original Base44 app on an open stack:

- **Frontend:** React 18 + Vite, Tailwind CSS, shadcn/ui, react-router-dom,
  @tanstack/react-query, recharts, framer-motion.
- **Backend:** [Supabase](https://supabase.com) — Postgres with Row-Level
  Security, Auth (magic-link email), Storage (task photos), Realtime
  (notifications), and Edge Functions (email + SLA escalation cron).
- **Email:** [Resend](https://resend.com), called from a Supabase Edge
  Function.

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**.

## 2. Apply the database schema

Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push   # applies supabase/migrations/*.sql
```

This creates the `profiles`, `stores`, `maintenance_teams`,
`maintenance_tasks`, and `app_notifications` tables with RLS policies
mirroring the original role model (admin / leadership / coordinator /
maintenance / requester, plus `pending_*` variants awaiting approval), the
`task-photos` storage bucket, and the escalation cron job.

Alternatively, paste each file in `supabase/migrations/` (in order) into
the SQL Editor in the Supabase dashboard.

## 3. Configure email (Resend) and escalation contacts

Deploy the two Edge Functions and set their secrets:

```bash
supabase functions deploy send-email
supabase functions deploy escalate-tasks

supabase secrets set \
  RESEND_API_KEY=re_xxx \
  RESEND_FROM_EMAIL="MaintOps <notifications@yourdomain.com>" \
  ESCALATION_MANAGER_NAME="..." \
  ESCALATION_MANAGER_EMAIL="..." \
  ESCALATION_HOD_NAME="..." \
  ESCALATION_HOD_EMAIL="..."
```

`send-email` is called by the frontend for every task lifecycle
notification. `escalate-tasks` is invoked every 15 minutes by the
`maintops-escalate-tasks` pg_cron job (see
`supabase/migrations/0003_escalation_cron.sql`) to apply the two-level SLA
escalation matrix. That migration reads the function URL and service role
key from Postgres settings — set them once after deploying:

```sql
alter database postgres set app.settings.escalate_tasks_url =
  'https://<project-ref>.functions.supabase.co/escalate-tasks';
alter database postgres set app.settings.service_role_key = '<service-role-key>';
```

## 4. Configure Auth

In **Authentication → Providers**, email/magic-link sign-in is enabled by
default — no extra setup needed. In **Authentication → URL Configuration**,
add your deployed site URL (and `http://localhost:5173` for local dev) to
the redirect allow-list, since sign-in links redirect to `/post-signup`.

The first user you want as `admin` needs their role set manually once —
sign up via **Request Access**, then in the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@company.com';
```

From then on, that admin can approve everyone else from **Admin → User
Access**.

## 5. Seed stores & teams

See `supabase/seed.example.sql` for the shape. Run it (adjusted for your
real store/team list) in the SQL Editor, then invite users and assign
their stores/team from **Admin → User Access**.

## 6. Run locally

```bash
npm install
npm run dev
```

```bash
npm run build     # production build -> ./dist
```

## Project layout

```
src/
  api/            Supabase client + entity CRUD helpers
  lib/            AuthContext, notifications, storage, theme, query client
  hooks/          usePullToRefresh, useIsMobile
  components/
    ui/           shadcn/ui primitives
    shared/       layout, nav, cards, badges, notification bell
    admin/        task detail modal, team swimlane
    requester/    category/sub-category/location pickers
  pages/          one file per route (see src/App.jsx for the route map)
supabase/
  migrations/     schema, RLS, storage bucket, escalation cron
  functions/      send-email, escalate-tasks (Deno Edge Functions)
```

## Key domain rules

- **Roles:** `admin`, `leadership`, `coordinator`, `maintenance`,
  `requester`, plus `pending_*` variants awaiting approval.
- **Task statuses (3 only):** `assigned` → `on_hold` → `resolved`.
- **SLA hours by category:** cooling/firefighting = 24h, equipment/generator
  = 48h, civil/electrical/plumbing = 96h.
- **Escalation:** SLA breach → Maintenance Manager (level 1); unresolved 12h
  later → Head of Department (level 2). Handled by `escalate-tasks`.

See the original design/spec documents (KINETIC_OPS_*.md, exported from the
Base44 app) for the full behavioral reference this rebuild follows.
