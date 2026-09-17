import { cn } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import { Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function TaskCard({ task, onClick, compact = false }) {
  return (
    <div
      onClick={() => onClick?.(task)}
      className={cn(
        "border-2 border-border bg-card p-4 cursor-pointer transition-all hover:border-foreground group",
        task.priority === "critical" && "border-l-amber border-l-4",
        compact && "p-3"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs text-muted-foreground tracking-wider">
          {task.task_code}
        </span>
        <StatusBadge type="priority" value={task.priority} />
      </div>

      <h4 className={cn(
        "font-display font-bold tracking-tight mb-2 group-hover:text-amber transition-colors",
        compact ? "text-sm" : "text-base"
      )}>
        {task.title}
      </h4>

      {!compact && task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="font-mono">{task.store_code}</span>
          <span className="hidden sm:inline">· {task.store_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={task.status} />
          {task.created_date && (
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(task.created_date), "MMM dd")}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-border">
        <span className="text-xs font-mono text-muted-foreground">
          TEAM:{" "}
          <span className={task.assigned_team_name ? "text-foreground" : "text-amber"}>
            {task.assigned_team_name || "UNASSIGNED"}
          </span>
        </span>
      </div>
    </div>
  );
}
