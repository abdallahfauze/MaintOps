import PulseIndicator from "../shared/PulseIndicator";
import StatusBadge from "../shared/StatusBadge";
import { cn } from "@/lib/utils";
import { Users, MapPin } from "lucide-react";

export default function TeamSwimlane({ team, tasks, onTaskClick }) {
  // Match by name OR id to handle tasks created before team IDs were stored
  const teamTasks = tasks.filter(t =>
    t.assigned_team_id === team.id || t.assigned_team_name === team.name
  );
  const activeTasks = teamTasks.filter(t => !["resolved"].includes(t.status));

  return (
    <div className="border-2 border-border bg-card">
      <div className="p-4 border-b-2 border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PulseIndicator status={team.status} size="md" />
          <div>
            <h3 className="font-display font-bold text-sm tracking-tight">{team.name}</h3>
            <span className="font-mono text-xs text-muted-foreground">{team.team_code}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" /> {team.member_count}
          </span>
          <span className={cn(
            "font-mono text-xs px-2 py-0.5 border-2",
            team.specialization === "electrical" && "border-amber text-amber",
            team.specialization === "plumbing" && "border-[#005F61] text-teal",
            team.specialization === "hvac" && "border-foreground text-foreground",
            team.specialization === "structural" && "border-muted-foreground text-muted-foreground",
            team.specialization === "general" && "border-border text-muted-foreground"
          )}>
            {team.specialization?.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-2 min-h-[80px]">
        {activeTasks.length === 0 && (
          <div className="text-center py-4 text-xs font-mono text-muted-foreground">
            NO ACTIVE TASKS
          </div>
        )}
        {activeTasks.map(task => (
          <div
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className={cn(
              "p-3 border-2 border-border hover:border-foreground cursor-pointer transition-colors bg-background",
              task.priority === "critical" && "border-l-amber border-l-4"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-muted-foreground">{task.task_code}</span>
              <StatusBadge type="priority" value={task.priority} />
            </div>
            <p className="font-display font-bold text-xs tracking-tight truncate">{task.title}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {task.store_code}
              </span>
              <StatusBadge value={task.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
