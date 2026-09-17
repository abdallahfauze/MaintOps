import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "pending_requester", label: "STORE REQUESTER", desc: "I work at a store and need to raise maintenance requests." },
  { value: "pending_maintenance", label: "MAINTENANCE TEAM", desc: "I'm part of a maintenance crew and handle repair tasks." },
  { value: "pending_coordinator", label: "MAINTENANCE COORDINATOR", desc: "I coordinate outsourced repairs and assist teams with tasks outside their expertise." },
  { value: "pending_leadership", label: "LEADERSHIP", desc: "I'm a manager or executive who needs full operational visibility." },
];

export default function RequestAccess() {
  const [selectedRole, setSelectedRole] = useState("");
  const navigate = useNavigate();

  const handleProceed = () => {
    if (!selectedRole) return;
    navigate("/login", { state: { requestedRole: selectedRole } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-2 border-border px-6 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-foreground flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-background" />
          </div>
          <span className="font-display font-black text-base tracking-tight">
            MAINT<span className="text-amber">OPS</span>
          </span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> BACK TO HOME
          </Link>

          <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-2">
            NEW USER · STEP 1 OF 2
          </div>
          <h1 className="font-display font-black text-3xl tracking-tight mb-2">
            REQUEST ACCESS
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Select your role. An admin will review and approve your account before you can log in.
          </p>

          <div className="space-y-0 mb-8">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={cn(
                  "w-full border-2 p-6 text-left transition-all",
                  selectedRole === role.value
                    ? "border-amber bg-amber/5"
                    : "border-border hover:border-foreground"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display font-black text-base tracking-tight mb-1">
                      {role.label}
                    </div>
                    <div className="text-sm text-muted-foreground">{role.desc}</div>
                  </div>
                  <div className={cn(
                    "w-5 h-5 border-2 rounded-full flex-shrink-0 ml-4 transition-colors",
                    selectedRole === role.value ? "border-amber bg-amber" : "border-border"
                  )} />
                </div>
              </button>
            ))}
          </div>

          <Button
            onClick={handleProceed}
            disabled={!selectedRole}
            className="w-full bg-amber text-foreground hover:bg-amber/90 font-display font-bold tracking-wider py-6 text-base"
          >
            CONTINUE TO SIGN UP
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Already have an approved account?{" "}
            <Link to="/login" className="underline hover:text-foreground transition-colors font-medium">
              Sign in here
            </Link>
          </p>

          <div className="mt-8 border-2 border-border p-4 bg-secondary/30">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">HOW IT WORKS</div>
            <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
              <li>Select your role above and continue to create an account</li>
              <li>Your request is sent to the admin for review</li>
              <li>Once approved, you'll receive an email and can sign in</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
