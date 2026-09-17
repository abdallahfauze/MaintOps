import { cn } from "@/lib/utils";

export default function KPICard({ label, value, sub, icon: Icon, accent = false }) {
  return (
    <div className={cn(
      "border-2 p-6 flex flex-col gap-2 transition-colors",
      accent ? "border-amber bg-amber/5" : "border-border bg-card"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
      </div>
      <span className="text-3xl font-display font-black tracking-tight">
        {value}
      </span>
      {sub && (
        <span className="text-sm text-muted-foreground">{sub}</span>
      )}
    </div>
  );
}
