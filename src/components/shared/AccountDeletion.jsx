import { useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function AccountDeletion({ collapsed = false }) {
  const [step, setStep] = useState("idle");
  const { updateMe, logout } = useAuth();

  const handleDelete = async () => {
    setStep("deleting");
    try {
      await updateMe({ role: "deleted", full_name: "Deleted User" });
      await logout();
    } catch (e) {
      console.error("Account deletion failed", e);
      setStep("confirm");
    }
  };

  if (step === "confirm") {
    return (
      <div className="mx-2 mb-3 border-2 border-destructive bg-destructive/10 p-3 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive leading-snug font-mono">
            This will permanently delete your account and all associated data. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDelete} disabled={step === "deleting"} size="sm"
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs">
            {step === "deleting" ? "DELETING..." : "CONFIRM DELETE"}
          </Button>
          <Button onClick={() => setStep("idle")} size="sm" variant="outline" className="border-2">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("confirm")}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-destructive/70 hover:text-destructive w-full transition-colors"
    >
      <Trash2 className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="font-mono text-xs">Delete Account</span>}
    </button>
  );
}
