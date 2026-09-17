import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronLeft, Wrench, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";

const ROLE_LABELS = {
  pending_requester: "Store Requester",
  pending_maintenance: "Maintenance Team",
  pending_coordinator: "Maintenance Coordinator",
  pending_leadership: "Leadership",
};

/** Magic-link sign-in. Replaces base44's hosted OAuth login screen. */
export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const requestedRole = location.state?.requestedRole;

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError("");
    try {
      await login(email, requestedRole);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send sign-in link.");
    } finally {
      setSending(false);
    }
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
        <div className="max-w-md w-full">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> BACK TO HOME
          </Link>

          <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-2">
            {requestedRole ? "NEW USER · STEP 2 OF 2" : "SIGN IN"}
          </div>
          <h1 className="font-display font-black text-3xl tracking-tight mb-2">
            {sent ? "CHECK YOUR EMAIL" : "SIGN IN"}
          </h1>
          {requestedRole && !sent && (
            <p className="text-sm text-muted-foreground mb-6">
              Signing up as <strong>{ROLE_LABELS[requestedRole] || requestedRole}</strong>.
            </p>
          )}

          {sent ? (
            <div className="border-2 border-border p-6 space-y-3">
              <Mail className="w-8 h-8 text-amber" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                We sent a sign-in link to <strong className="text-foreground">{email}</strong>.
                Click the link in that email to finish signing in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-2">EMAIL ADDRESS</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2"
                  placeholder="you@company.com"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={sending || !email}
                className="w-full bg-amber text-foreground hover:bg-amber/90 font-display font-bold tracking-wider py-6 text-base"
              >
                {sending ? "SENDING LINK..." : "SEND SIGN-IN LINK"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {!requestedRole && !sent && (
            <p className="text-xs text-muted-foreground text-center mt-6">
              Don't have an account yet?{" "}
              <Link to="/request-access" className="underline hover:text-foreground transition-colors font-medium">
                Request access
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
