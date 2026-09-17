import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const ROLE_LABEL = {
  pending_requester: "Store Requester",
  pending_maintenance: "Maintenance Team",
  pending_leadership: "Leadership",
  pending_coordinator: "Maintenance Coordinator",
};

/**
 * Landing page after clicking the magic-link email. The `profiles` row is
 * already created (and its role already set from signup metadata) by the
 * handle_new_user() database trigger — this page just waits for the auth
 * session + profile to be available, emails admins about a brand-new
 * pending signup, then continues to /dashboard (which shows PendingApproval
 * automatically for pending_* roles).
 */
export default function PostSignup() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const notified = useRef(false);

  useEffect(() => {
    if (isLoadingAuth || !user || notified.current) return;
    notified.current = true;

    const isFreshSignup = user.role?.startsWith("pending_") &&
      Date.now() - new Date(user.created_date).getTime() < 2 * 60 * 1000;

    const run = async () => {
      if (isFreshSignup) {
        const admins = await Users.filter({ role: "admin" });
        const roleLabel = ROLE_LABEL[user.role] || user.role;
        await Promise.all(admins.filter(a => a.email).map(admin =>
          supabase.functions.invoke("send-email", {
            body: {
              to: admin.email,
              subject: `[MaintOps] New user awaiting approval: ${user.full_name}`,
              body: `A new user has signed up and is awaiting your approval.\n\nName: ${user.full_name}\nEmail: ${user.email}\nRequested Role: ${roleLabel}\n\nPlease log in to approve or deny access: ${window.location.origin}/admin-users`,
            },
          })
        ));
      }
      navigate("/dashboard", { replace: true });
    };

    run();
  }, [isLoadingAuth, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-muted border-t-amber rounded-full animate-spin mx-auto" />
        <div className="font-mono text-xs text-muted-foreground">SETTING UP YOUR ACCOUNT...</div>
      </div>
    </div>
  );
}
