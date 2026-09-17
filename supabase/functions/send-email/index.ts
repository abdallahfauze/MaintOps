// Sends transactional email via Resend. Invoked by the frontend
// (supabase.functions.invoke('send-email', { body: { to, subject, body } }))
// wherever the original app called base44.integrations.Core.SendEmail.
//
// Secrets required (set with `supabase secrets set ...`):
//   RESEND_API_KEY
//   RESEND_FROM_EMAIL   e.g. "MaintOps <notifications@yourdomain.com>"

import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "MaintOps <onboarding@resend.dev>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Require a logged-in caller (any approved or pending user may trigger a
  // notification email as part of the task lifecycle).
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured — skipping email send.");
    return new Response(JSON.stringify({ skipped: true, reason: "RESEND_API_KEY not configured" }), { status: 200 });
  }

  const { to, subject, body } = await req.json();
  if (!to || !subject) {
    return new Response(JSON.stringify({ error: "`to` and `subject` are required" }), { status: 400 });
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject,
      text: body ?? "",
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error("Resend error", resendRes.status, errText);
    return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
