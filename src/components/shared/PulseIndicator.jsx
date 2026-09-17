import { cn } from "@/lib/utils";

export default function PulseIndicator({ status = "idle", size = "md" }) {
  const sizeClasses = { sm: "w-2 h-2", md: "w-3 h-3", lg: "w-4 h-4" };
  const colorClasses = { active: "bg-amber", idle: "bg-muted-foreground", on_break: "bg-destructive" };

  return (
    <span className="relative inline-flex">
      <span className={cn("rounded-full", sizeClasses[size], colorClasses[status])} />
      {status === "active" && (
        <span className={cn("absolute rounded-full opacity-75 animate-ping", sizeClasses[size], colorClasses[status])} />
      )}
    </span>
  );
}
