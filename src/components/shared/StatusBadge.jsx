import { cn } from "@/lib/utils";

const statusConfig = {
  assigned: { label: "ASSIGNED", borderClass: "border-amber", textClass: "text-amber", bgClass: "bg-amber/10" },
  on_hold: { label: "ON HOLD", borderClass: "border-muted-foreground", textClass: "text-muted-foreground", bgClass: "bg-muted" },
  resolved: { label: "RESOLVED", borderClass: "border-[#005F61]", textClass: "text-teal", bgClass: "bg-teal/10" },
};

const priorityConfig = {
  critical: { label: "CRITICAL", borderClass: "border-destructive", textClass: "text-destructive", bgClass: "bg-destructive/10" },
  high: { label: "HIGH", borderClass: "border-amber", textClass: "text-amber", bgClass: "bg-amber/10" },
  medium: { label: "MEDIUM", borderClass: "border-muted-foreground", textClass: "text-muted-foreground", bgClass: "bg-muted" },
  low: { label: "LOW", borderClass: "border-border", textClass: "text-muted-foreground", bgClass: "bg-background" },
};

export default function StatusBadge({ type = "status", value, className }) {
  const config = type === "priority" ? priorityConfig : statusConfig;
  const badge = config[value] || { label: value?.toUpperCase(), borderClass: "border-border", textClass: "text-muted-foreground", bgClass: "bg-muted" };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 text-xs font-mono tracking-wider border-2",
      badge.borderClass, badge.textClass, badge.bgClass,
      className
    )}>
      {badge.label}
    </span>
  );
}
