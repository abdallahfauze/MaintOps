import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/shared/MobileSelect";
import StatusBadge from "../shared/StatusBadge";
import { MapPin, Clock, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "@/api/entities";
import { notifyTaskEvent } from "@/lib/notifications";

const STATUSES = ["assigned", "on_hold", "resolved"];

export default function TaskDetailModal({ task, teams, open, onClose, onUpdate }) {
  const [assignTeam, setAssignTeam] = useState(task?.assigned_team_id || "");
  const [assignTeamName, setAssignTeamName] = useState(task?.assigned_team_name || "");
  const [status, setStatus] = useState(task?.status || "assigned");
  const [notes, setNotes] = useState(task?.notes || "");

  const { data: coordinators = [] } = useQuery({
    queryKey: ["coordinators"],
    queryFn: () => Users.filter({ role: "coordinator" }),
    enabled: open,
  });

  if (!task) return null;

  const teamOptions = [
    ...teams.map(t => ({ id: t.id, label: `${t.team_code} · ${t.name}`, name: t.name })),
    ...coordinators.map(c => ({ id: `coord_${c.id}`, label: `COORDINATOR · ${c.full_name}`, name: c.full_name })),
  ];

  const handleTeamChange = (val) => {
    setAssignTeam(val);
    const opt = teamOptions.find(o => o.id === val);
    setAssignTeamName(opt?.name || "");
  };

  const handleSave = () => {
    const updates = {
      status,
      notes,
      assigned_team_id: assignTeam || undefined,
      assigned_team_name: assignTeamName || task.assigned_team_name,
    };
    if (assignTeam && !task.assigned_team_id) {
      updates.assigned_date = new Date().toISOString();
    }
    if (status === "resolved") updates.resolved_date = new Date().toISOString();

    const statusChanged = status !== task.status;
    const teamChanged = assignTeamName && assignTeamName !== task.assigned_team_name;

    const notifType = status === "resolved" ? "task_resolved"
      : teamChanged ? "task_assigned"
      : "task_updated";

    const notifTitle = teamChanged && !statusChanged
      ? `${task.task_code} · Assigned to ${assignTeamName}`
      : `${task.task_code} · Status → ${status.replace(/_/g, " ").toUpperCase()}`;

    notifyTaskEvent({
      type: notifType,
      title: notifTitle,
      body: `${task.title}\nStore: ${task.store_code} · ${task.store_name}${notes ? `\nNotes: ${notes}` : ""}`,
      task,
      emails: [task.created_by].filter(Boolean),
      users: [{ email: task.created_by, role: "requester" }].filter(u => u.email),
    });

    onUpdate(task.id, updates);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-2 border-foreground bg-card p-0">
        <DialogHeader className="p-6 pb-4 border-b-2 border-border">
          <button
            onClick={onClose}
            className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 -ml-1 lg:hidden"
          >
            <ChevronLeft className="w-4 h-4" /> BACK
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-muted-foreground">{task.task_code}</span>
            <StatusBadge type="priority" value={task.priority} />
            <StatusBadge value={task.status} />
          </div>
          <DialogTitle className="font-display font-black text-xl tracking-tight">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" /> {task.store_code} · {task.store_name}
            </span>
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> {task.created_date ? format(new Date(task.created_date), "MMM dd, HH:mm") : "N/A"}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
          )}

          {task.photo_urls?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {task.photo_urls.map((url, i) => (
                <img key={i} src={url} alt="Issue" className="w-24 h-24 object-cover border-2 border-border" />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1.5">ASSIGN TEAM</label>
              <MobileSelect
                value={assignTeam}
                onValueChange={handleTeamChange}
                placeholder="Select team"
                title="Assign Team"
                options={teamOptions.map(opt => ({ value: opt.id, label: opt.label }))}
                triggerClassName="w-full"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1.5">STATUS</label>
              <MobileSelect
                value={status}
                onValueChange={setStatus}
                placeholder="Status"
                title="Status"
                options={STATUSES.map(s => ({ value: s, label: s.replace(/_/g, " ").toUpperCase() }))}
                triggerClassName="w-full"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-1.5">NOTES</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="border-2 min-h-[80px]"
              placeholder="Add notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" className="border-2" onClick={onClose}>CANCEL</Button>
            <Button onClick={handleSave} className="bg-foreground text-background hover:bg-foreground/90 font-display font-bold tracking-wider">
              UPDATE TASK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
