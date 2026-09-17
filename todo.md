# MaintOps Rebuild — Progress Tracker

Tracks the rebuild of the Kinetic Ops / MaintOps app off Base44 onto
Supabase. Check items off as they're completed — update this file whenever
progress is made so status stays visible at a glance.

**Legend:** `[x]` done · `[~]` in progress / partially done · `[ ]` not started

---

## 1. Frontend rebuild (code)

- [x] Scaffold Vite + React project, Tailwind config, shadcn/ui config
- [x] Port design tokens (`index.css`, `tailwind.config.js`) — colors, fonts, spacing, dark mode
- [x] Port all shadcn/ui primitives (button, input, select, dialog, textarea, skeleton, drawer, tabs, badge, toast)
- [x] Port shared components (AppLayout, AppSidebar, MobileBottomTabs, MobileSelect, PullToRefreshWrapper, StatusBadge, KPICard, TaskCard, NotificationBell, PageTransition, PulseIndicator, AccountDeletion)
- [x] Port admin components (TaskDetailModal, TeamSwimlane)
- [x] Port requester components (CategoryGrid, SubCategoryGrid, SubLocationGrid)
- [x] Port all pages (Dashboard, AdminDashboard, Executor, RequesterDashboard, RequesterNew, Stores, AdminUsers)
- [x] Rebuild Reporting page from design spec (full source wasn't in the export) — KPIs, 8 charts, 2 tables, Excel export
- [x] Rebuild Landing page from design spec, incl. restoring the original hero image
- [x] New auth pages (Login, RequestAccess, PostSignup, PendingApproval) adapted to Supabase magic-link auth
- [x] Favicon + PWA manifest matching brand
- [x] `npm run build` / `npm run lint` passing
- [x] Basic CI workflow (GitHub Actions: install, lint, build)

## 2. Backend code (Supabase)

- [x] Postgres schema: `profiles`, `stores`, `maintenance_teams`, `maintenance_tasks`, `app_notifications`
- [x] RLS policies mirroring the original role model (admin/leadership/coordinator/maintenance/requester + `pending_*`)
- [x] Auto-create-profile trigger on signup (`handle_new_user`)
- [x] `create_app_notification` RPC (controlled notification inserts)
- [x] Storage bucket + policies for task photos
- [x] Realtime enabled on `app_notifications` (notification bell)
- [x] `send-email` edge function (Resend)
- [x] `escalate-tasks` edge function + pg_cron schedule (SLA escalation matrix)
- [x] Frontend integration layer (`src/api/entities.js`, `AuthContext`, `notifications.js`, `storage.js`)

## 3. Infrastructure provisioning — ⏳ needs manual steps in the Supabase dashboard

> **Why manual:** this Claude Code sandbox's network policy blocks all outbound
> traffic to Supabase (confirmed: the Management API host, the project's own
> REST API host, and raw Postgres/pooler TCP connections on every host tried
> all fail — DNS resolves fine, but the connection itself is refused or hangs).
> Credentials alone can't fix this; it's a hard block on this environment, so
> every step below has to be run by you in the Supabase dashboard UI. Once
> done, everything downstream (the app itself) works exactly as if I'd run it.

- [x] Create Supabase project (`jakeaubtdzwwlditwxxt`)
- [x] Get project URL + publishable/anon key + service role key
- [ ] Run `supabase/migrations/0001_schema.sql` in the SQL Editor
- [ ] Run `supabase/migrations/0002_storage.sql` in the SQL Editor
- [ ] Run `supabase/migrations/0003_escalation_cron.sql` in the SQL Editor
- [ ] Create + deploy `send-email` edge function (paste from repo)
- [ ] Create + deploy `escalate-tasks` edge function (paste from repo)
- [ ] Create Resend account, get API key
- [ ] Set edge function secrets: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ESCALATION_MANAGER_NAME`, `ESCALATION_MANAGER_EMAIL`, `ESCALATION_HOD_NAME`, `ESCALATION_HOD_EMAIL`
- [ ] Run the two `alter database postgres set app.settings...` statements (SQL Editor) once `escalate-tasks` is deployed
- [ ] Add site URL(s) to Supabase Auth → URL Configuration redirect allow-list
- [ ] Promote your own account to `admin` (one-time SQL update after first sign-up)

## 4. Data seeding

- [ ] Real store list (`stores` table — code, name, region, contacts, maintenance team)
- [ ] Real maintenance team list (`maintenance_teams` table)
- [ ] Invite/approve real users, assign stores/teams via Admin → User Access

## 5. End-to-end verification (needs a live project)

- [ ] Sign up → request access → admin approval flow
- [ ] Submit a request as requester → notifications + email fire to admins/team
- [ ] Assign team, change status, resolve a task as admin/coordinator
- [ ] Maintenance role sees only their team's tasks
- [ ] Notification bell realtime updates
- [ ] Reporting charts + Excel export render correctly with real data
- [ ] SLA escalation cron fires correctly after the SLA window (can be tested by backdating a task's `created_date`)
- [ ] Mobile layout (bottom tabs, pull-to-refresh, drawer selects) on an actual phone

## 6. Deployment

- [ ] Choose a host for the frontend (Vercel/Netlify/other)
- [ ] Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as build env vars on the host
- [ ] Deploy and verify production build
- [ ] Point a custom domain (optional)

---

## Current status

**Everything in sections 1–2 (all application code) is complete, committed, and pushed** to
`claude/loving-heisenberg-46ax0q` (currently the repo's default branch).

**Sections 3–6 need you** — they require a Supabase account, a Resend
account, and real business data (stores/teams) that only you have. See
`README.md` for the exact steps. Once you hand over the Supabase/Resend
credentials, I can complete section 3 myself.
