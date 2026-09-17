// Scheduled (via pg_cron, see supabase/migrations/0003_escalation_cron.sql)
// every 15 minutes. Walks open tasks and applies the two-level escalation
// matrix documented in KINETIC_OPS_DESIGN_CONVENTIONS.md section 7:
//
//   Level 0 -> 1: task not resolved within its category's SLA hours
//                 -> email + in-app notification to the Maintenance Manager
//   Level 1 -> 2: still unresolved 12h after the level-1 escalation
//                 -> email + in-app notification to the Head of Department
//
// Runs with the service role key, so it bypasses RLS by design (it acts on
// behalf of the system, not a particular user).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "MaintOps <onboarding@resend.dev>";

const MANAGER_NAME = Deno.env.get("ESCALATION_MANAGER_NAME") ?? "Maintenance Manager";
const MANAGER_EMAIL = Deno.env.get("ESCALATION_MANAGER_EMAIL");
const HOD_NAME = Deno.env.get("ESCALATION_HOD_NAME") ?? "Head of Department";
const HOD_EMAIL = Deno.env.get("ESCALATION_HOD_EMAIL");

const SLA_HOURS: Record<string, number> = {
  civil: 96, electrical: 96, cooling: 24, plumbing: 96,
  equipment: 48, generator: 48, firefighting: 24,
};
const DEFAULT_SLA_HOURS = 96;
const HOD_ESCALATION_DELAY_HOURS = 12;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function sendEmail(to: string | undefined, subject: string, body: string) {
  if (!to || !RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: [to], subject, text: body }),
    });
  } catch (err) {
    console.error("Failed to send escalation email", err);
  }
}

async function notifyAdmins(type: string, title: string, body: string, taskId: string, taskCode: string | null) {
  const { data: admins } = await supabase.from("profiles").select("email, role").in("role", ["admin", "coordinator"]);
  if (!admins?.length) return;
  await supabase.from("app_notifications").insert(
    admins.filter((a) => a.email).map((a) => ({
      recipient_email: a.email, recipient_role: a.role, type, title, body,
      task_id: taskId, task_code: taskCode, read: false,
    }))
  );
}

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { data: tasks, error } = await supabase
    .from("maintenance_tasks")
    .select("*")
    .neq("status", "resolved")
    .lt("escalation_level", 2);

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = Date.now();
  let escalatedToManager = 0;
  let escalatedToHod = 0;

  for (const task of tasks ?? []) {
    const slaHours = SLA_HOURS[task.category] ?? DEFAULT_SLA_HOURS;
    const ageHours = (now - new Date(task.created_date).getTime()) / 3_600_000;

    if (task.escalation_level === 0 && ageHours > slaHours) {
      await supabase.from("maintenance_tasks").update({
        escalation_level: 1,
        escalated_at: new Date().toISOString(),
      }).eq("id", task.id);

      const subject = `[MaintOps] SLA breach: ${task.task_code} · ${task.title}`;
      const body = `Task ${task.task_code} (${task.store_code} · ${task.store_name}) has exceeded its ${slaHours}h SLA for category "${task.category}" and is still ${task.status}.\n\nAssigned team: ${task.assigned_team_name || "UNASSIGNED"}`;
      await sendEmail(MANAGER_EMAIL, subject, `Hi ${MANAGER_NAME},\n\n${body}`);
      await notifyAdmins("task_escalated", subject, body, task.id, task.task_code);
      escalatedToManager++;
      continue;
    }

    if (task.escalation_level === 1 && task.escalated_at) {
      const sinceEscalationHours = (now - new Date(task.escalated_at).getTime()) / 3_600_000;
      if (sinceEscalationHours > HOD_ESCALATION_DELAY_HOURS) {
        await supabase.from("maintenance_tasks").update({
          escalation_level: 2,
          escalated_to_hod_at: new Date().toISOString(),
        }).eq("id", task.id);

        const subject = `[MaintOps] Unresolved SLA breach: ${task.task_code} · ${task.title}`;
        const body = `Task ${task.task_code} (${task.store_code} · ${task.store_name}) was escalated to the Maintenance Manager over ${HOD_ESCALATION_DELAY_HOURS}h ago and is still ${task.status}.\n\nAssigned team: ${task.assigned_team_name || "UNASSIGNED"}`;
        await sendEmail(HOD_EMAIL, subject, `Hi ${HOD_NAME},\n\n${body}`);
        await notifyAdmins("task_escalated", subject, body, task.id, task.task_code);
        escalatedToHod++;
      }
    }
  }

  return new Response(JSON.stringify({ escalatedToManager, escalatedToHod }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
