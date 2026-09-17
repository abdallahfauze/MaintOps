import { supabase } from '@/api/supabaseClient'

/**
 * Creates in-app notifications + sends emails for a task lifecycle event.
 *
 * @param {object} opts
 * @param {string} opts.type - notification type key
 * @param {string} opts.title - short headline
 * @param {string} opts.body - detail text
 * @param {object} opts.task - task object (must have id, task_code etc.)
 * @param {string[]} opts.emails - list of recipient emails for email
 * @param {object[]} opts.users - list of {email, role} objects for in-app notifications
 */
export async function notifyTaskEvent({ type, title, body, task, emails = [], users = [] }) {
  await Promise.all(
    users.filter((u) => u.email).map((u) =>
      supabase.rpc('create_app_notification', {
        p_recipient_email: u.email,
        p_recipient_role: u.role || 'user',
        p_type: type,
        p_title: title,
        p_body: body,
        p_task_id: task?.id ?? null,
        p_task_code: task?.task_code ?? null,
      })
    )
  )

  const unique = [...new Set(emails.filter(Boolean))]
  await Promise.all(
    unique.map((email) =>
      supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: `[MaintOps] ${title}`,
          body: `${body}\n\nLog in to take action: ${window.location.origin}`,
        },
      })
    )
  )
}
