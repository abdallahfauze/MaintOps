import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench, Store, Users, Zap, ShieldCheck, ArrowRight,
  Building2, Thermometer, Droplets, Fuel, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const CATEGORIES = [
  { label: "CIVIL", icon: Building2, sla: "96h" },
  { label: "ELECTRICAL", icon: Zap, sla: "96h" },
  { label: "COOLING", icon: Thermometer, sla: "24h", urgent: true },
  { label: "PLUMBING", icon: Droplets, sla: "96h" },
  { label: "EQUIPMENT", icon: Wrench, sla: "48h" },
  { label: "GENERATOR", icon: Fuel, sla: "48h" },
  { label: "FIREFIGHTING", icon: ShieldAlert, sla: "24h", urgent: true },
];

const FEATURES = [
  { label: "180 Stores", desc: "Full network coverage across every region." },
  { label: "5 Elite Teams", desc: "Specialized crews for every category." },
  { label: "Real-Time Ops", desc: "Live status, notifications, and escalation." },
  { label: "Zero Friction", desc: "Raise, assign, resolve — in seconds." },
];

const ROLES = [
  { label: "STORE TEAMS", desc: "Raise a request in seconds and track it to resolution.", hover: "hover:border-teal hover:text-teal" },
  { label: "MAINTENANCE CREWS", desc: "See your queue, update status, close the loop.", hover: "hover:border-foreground" },
  { label: "LEADERSHIP", desc: "Full visibility: KPIs, SLA compliance, team performance.", hover: "hover:border-amber hover:text-amber" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export default function Landing() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && user && !user.role?.startsWith("pending_")) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-border px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-foreground flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-background" />
          </div>
          <span className="font-display font-black text-base tracking-tight">
            MAINT<span className="text-amber">OPS</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="font-mono text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            SIGN IN
          </Link>
          <Button asChild size="sm" className="bg-amber text-foreground hover:bg-amber/90 font-mono text-xs tracking-wider">
            <Link to="/request-access">REQUEST ACCESS</Link>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-amber/20" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-36">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="font-mono text-xs tracking-[0.3em] text-background/60 mb-4">
              FACILITY MANAGEMENT ECOSYSTEM
            </div>
            <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight leading-[0.95] mb-6 max-w-3xl">
              OPERATIONAL <span className="text-amber">VELOCITY</span>
            </h1>
            <p className="text-background/70 text-lg max-w-xl mb-10 leading-relaxed">
              Role-based task assignment, automated notifications, SLA tracking, and escalation
              workflows for your entire retail store network — in one command center.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-amber text-foreground hover:bg-amber/90 font-display font-bold tracking-wider py-6 px-8">
                <Link to="/request-access">REQUEST ACCESS <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-background/30 text-background hover:bg-background/10 font-display font-bold tracking-wider py-6 px-8">
                <Link to="/login">SIGN IN</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="border-2 border-border hover:border-amber transition-colors p-6"
            >
              <div className="font-display font-black text-2xl tracking-tight mb-2">{f.label}</div>
              <div className="text-sm text-muted-foreground">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SLA + ESCALATION */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-2">SERVICE LEVELS</div>
        <h2 className="font-display font-black text-3xl tracking-tight mb-8">RESPONSE TIME COMMITMENTS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-0 mb-12">
          {CATEGORIES.map(({ label, icon: Icon, sla, urgent }) => (
            <div
              key={label}
              className={`border-2 p-4 text-center ${urgent ? "border-amber bg-amber/5" : "border-border"}`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${urgent ? "text-amber" : "text-muted-foreground"}`} />
              <div className="font-mono text-[10px] tracking-wider mb-1">{label}</div>
              <div className="font-display font-black text-lg">{sla}</div>
            </div>
          ))}
        </div>

        <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">ESCALATION MATRIX</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="border-2 border-border p-6">
            <div className="font-mono text-xs text-muted-foreground mb-2">LEVEL 0 · TRIGGER</div>
            <div className="font-display font-bold text-base mb-1">SLA Breach Detected</div>
            <p className="text-sm text-muted-foreground">Task not responded to within its category's SLA window.</p>
          </div>
          <div className="border-2 border-amber bg-amber/5 p-6">
            <div className="font-mono text-xs text-amber mb-2">LEVEL 1 · MANAGER</div>
            <div className="font-display font-bold text-base mb-1">Maintenance Manager</div>
            <p className="text-sm text-muted-foreground">Notified immediately on SLA breach.</p>
          </div>
          <div className="border-2 border-destructive bg-destructive/5 p-6">
            <div className="font-mono text-xs text-destructive mb-2">LEVEL 2 · HOD</div>
            <div className="font-display font-bold text-base mb-1">Head of Department</div>
            <p className="text-sm text-muted-foreground">Notified if unresolved 12h after Level 1.</p>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ["180", "STORES"],
            ["5", "TEAMS"],
            ["24/7", "COVERAGE"],
            ["<2h", "AVG RESPONSE"],
          ].map(([value, label]) => (
            <div key={label}>
              <div className="font-display font-black text-5xl md:text-6xl text-amber mb-2">{value}</div>
              <div className="font-mono text-xs tracking-[0.2em] text-background/60">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-2">BUILT FOR EVERY ROLE</div>
        <h2 className="font-display font-black text-3xl tracking-tight mb-8">ONE PLATFORM, EVERY TEAM</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {ROLES.map(({ label, desc, hover }) => (
            <div key={label} className={`border-2 border-border transition-colors p-8 ${hover}`}>
              <Users className="w-7 h-7 mb-4" />
              <div className="font-display font-black text-lg tracking-tight mb-2">{label}</div>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t-2 border-border px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">MaintOps · Operational Velocity</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Store className="w-3.5 h-3.5" /> Facility Management Ecosystem
          </div>
        </div>
      </footer>
    </div>
  );
}
