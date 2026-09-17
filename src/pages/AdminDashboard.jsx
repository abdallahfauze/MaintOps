import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MaintenanceTask, MaintenanceTeam, Users } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import KPICard from "@/components/shared/KPICard";
import { notifyTaskEvent } from "@/lib/notifications";
import TaskCard from "@/components/shared/TaskCard";
import TeamSwimlane from "@/components/admin/TeamSwimlane";
import TaskDetailModal from "@/components/admin/TaskDetailModal";
import { AlertTriangle, Clock, CheckCircle2, Users as UsersIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import MobileSelect from "@/components/shared/MobileSelect";
import PullToRefreshWrapper from "@/components/shared/PullToRefreshWrapper";

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const TASKS_KEY = ["tasks"];

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: TASKS_KEY,
    queryFn: () => MaintenanceTask.list("-created_date", 200),
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => MaintenanceTeam.list(),
  });

  const { data: adminUsers = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => Users.filter({ role: "admin" }),
  });

  const { data: coordinatorUsers = [] } = useQuery({
    queryKey: ["coordinator-users"],
    queryFn: () => Users.filter({ role: "coordinator" }),
  });

  const taskId = searchParams.get("taskId");
  const selectedTask = taskId ? tasks.find(t => t.id === taskId) : null;
  const setSelectedTask = (task) => {
    if (task) setSearchParams({ taskId: task.id });
    else setSearchParams({});
  };

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => MaintenanceTask.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData(TASKS_KEY);
      queryClient.setQueryData(TASKS_KEY, old =>
        (old || []).map(t => t.id === id ? { ...t, ...data } : t)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(TASKS_KEY, context.previous);
    },

    onSuccess: (_, { data, task }) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });

      if (!task) return;

      const statusChanged = data.status && data.status !== task.status;
      const teamChanged = data.assigned_team_name && data.assigned_team_name !== task.assigned_team_name;

      if (statusChanged || teamChanged) {
        const notifType = data.status === "resolved" ? "task_resolved"
          : teamChanged ? "task_assigned"
          : "task_updated";

        const notifTitle = teamChanged && !statusChanged
          ? `${task.task_code} · Assigned to ${data.assigned_team_name}`
          : `${task.task_code} · Status → ${(data.status || task.status).replace(/_/g, " ").toUpperCase()}`;

        const notifBody = `${task.title}\nStore: ${task.store_code} · ${task.store_name}${data.notes ? `\nNotes: ${data.notes}` : ""}`;

        const emailRecipients = [task.created_by].filter(Boolean);
        const userRecipients = [{ email: task.created_by, role: "requester" }].filter(u => u.email);
        adminUsers.forEach(u => { if (u.email) { emailRecipients.push(u.email); userRecipients.push({ email: u.email, role: u.role }); } });
        coordinatorUsers.forEach(u => { if (u.email) { emailRecipients.push(u.email); userRecipients.push({ email: u.email, role: u.role }); } });

        notifyTaskEvent({
          type: notifType,
          title: notifTitle,
          body: notifBody,
          task,
          emails: emailRecipients,
          users: userRecipients,
        });
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });

  const assignedTasks = tasks.filter(t => t.status === "assigned");
  const onHoldTasks = tasks.filter(t => t.status === "on_hold");
  const criticalTasks = tasks.filter(t => t.priority === "critical" && t.status !== "resolved");
  const resolvedToday = tasks.filter(t => {
    if (!t.resolved_date) return false;
    const today = new Date();
    const resolved = new Date(t.resolved_date);
    return resolved.toDateString() === today.toDateString();
  });

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesSearch = !searchQuery ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.task_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.store_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.store_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const isLoading = tasksLoading || teamsLoading;

  const statusOptions = [
    { value: "all", label: "ALL STATUS" },
    { value: "assigned", label: "ASSIGNED" },
    { value: "on_hold", label: "ON HOLD" },
    { value: "resolved", label: "RESOLVED" },
  ];

  return (
    <PullToRefreshWrapper onRefresh={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })} className="min-h-full">
      <div className="p-6 lg:p-8 max-w-[1600px]">
        <div className="mb-8">
          <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-1">
            ADMIN · COMMAND CENTER
          </div>
          <h1 className="font-display font-black text-3xl lg:text-4xl tracking-tight">
            OPERATIONS MATRIX
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="border-2 border-border p-6">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-10 w-16" />
              </div>
            ))
          ) : (
            <>
              <KPICard label="ASSIGNED" value={assignedTasks.length} icon={Clock} accent={assignedTasks.length > 0} />
              <KPICard label="ON HOLD" value={onHoldTasks.length} icon={UsersIcon} accent={onHoldTasks.length > 0} />
              <KPICard label="CRITICAL" value={criticalTasks.length} icon={AlertTriangle} accent={criticalTasks.length > 0} />
              <KPICard label="RESOLVED TODAY" value={resolvedToday.length} icon={CheckCircle2} />
            </>
          )}
        </div>

        <div className="mb-8">
          <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">
            TEAM DEPLOYMENT STATUS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="border-2 border-border p-4">
                  <Skeleton className="h-6 w-32 mb-3" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))
            ) : (
              teams.map(team => (
                <TeamSwimlane
                  key={team.id}
                  team={team}
                  tasks={tasks}
                  onTaskClick={setSelectedTask}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground">
              ALL TASKS · {filteredTasks.length} RECORDS
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 border-2 w-60 font-mono text-xs"
                />
              </div>
              <MobileSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={statusOptions}
                title="Filter by Status"
                triggerClassName="w-40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="border-2 border-border p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
            ) : (
              filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
              ))
            )}
          </div>
          {!isLoading && filteredTasks.length === 0 && (
            <div className="text-center py-16 font-mono text-sm text-muted-foreground">
              NO TASKS FOUND
            </div>
          )}
        </div>

        <TaskDetailModal
          task={selectedTask}
          teams={teams}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(id, data) => updateTask.mutate({ id, data, task: selectedTask })}
        />
      </div>
    </PullToRefreshWrapper>
  );
}
