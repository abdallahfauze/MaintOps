import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function PendingApproval() {
  const { user, logout } = useAuth();

  const roleLabels = {
    pending_requester: "Store Requester",
    pending_maintenance: "Maintenance Team Member",
    pending_coordinator: "Maintenance Coordinator",
    pending_leadership: "Leadership / Management",
  };

  const requestedLabel = roleLabels[user?.role] || "User";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full border-2 border-border bg-card p-10 text-center space-y-6">
        <div className="w-16 h-16 bg-amber/10 border-2 border-amber flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber" />
        </div>
        <div>
          <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-2">
            ACCESS PENDING
          </div>
          <h1 className="font-display font-black text-2xl tracking-tight mb-3">
            AWAITING APPROVAL
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account has been registered as <strong>{requestedLabel}</strong>.
            An administrator will review your request and grant access shortly.
          </p>
        </div>
        <div className="bg-secondary/50 border border-border p-4 text-left space-y-1">
          <div className="font-mono text-xs text-muted-foreground">YOUR DETAILS</div>
          <div className="font-display font-bold text-sm">{user?.full_name}</div>
          <div className="font-mono text-xs text-muted-foreground">{user?.email}</div>
          <div className="font-mono text-xs text-amber mt-1">{requestedLabel.toUpperCase()}</div>
        </div>
        <p className="text-xs text-muted-foreground">
          You will receive an email once your account is approved. If you believe this is an error, please contact your administrator.
        </p>
        <Button
          variant="outline"
          className="w-full border-2 font-display font-bold tracking-wider"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" /> SIGN OUT
        </Button>
      </div>
    </div>
  );
}
