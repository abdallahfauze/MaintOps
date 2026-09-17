import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MaintenanceTask, MaintenanceTeam } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import TaskCard from "@/components/shared/TaskCard";
import TaskDetailModal from "@/components/admin/TaskDetailModal";
import PullToRefreshWrapper from "@/components/shared/PullToRefreshWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const TASKS_KEY = ["tasks"];

const TABS = [
  { key: "open", label: "ASSIGNED", filter: t => t.status === "assigned" },
  { key: "on_hold", label: "ON HOLD", filter: t => t.status === "on_hold" },
  { key: "resolved", label: "RESOLVED", filter: t => t.status === "resolved" },
];

export default function Executor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.role === "admin";
  const isCoordinator = user?.role === "coordinator";
  const myTeamName = user?.team_name;

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: [...TASKS_KEY, myTeamName],
    queryFn: () => {
      if (isAdmin || isCoordinator) {
        return MaintenanceTask.list("-created_date", 200);
      }
      if (myTeamName) {
        return MaintenanceTask.filter({ assigned_team_name: myTeamName }, "-created_date", 200);
      }
      return Promise.resolve([]);
    },
    enabled: !!user,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => MaintenanceTeam.list(),
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });

  const currentTab = TABS.find(t => t.key === activeTab);

  const filteredTasks = tasks.filter(t => {
    const matchesTab = currentTab?.filter(t) ?? true;
    const matchesSearch = !searchQuery ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.task_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.store_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.store_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <PullToRefreshWrapper onRefresh={() => queryClient.invalidateQueries({ queryKey: TASKS_KEY })} className="min-h-full">
      <div className="p-6 lg:p-8 max-w-[1600px]">
        <div className="mb-8">
          <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-1">
            {isCoordinator ? "COORDINATOR · TASK QUEUE" : "MAINTENANCE · COMMAND CENTER"}
          </div>
          <h1 className="font-display font-black text-3xl lg:text-4xl tracking-tight">
            {isCoordinator ? "ALL TASKS" : myTeamName ? myTeamName.toUpperCase() : "MY TASKS"}
          </h1>
        </div>

        <div className="flex border-b-2 border-border mb-6">
          {TABS.map(tab => {
            const count = tasks.filter(tab.filter).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 font-mono text-xs tracking-wider border-b-2 transition-colors -mb-[2px] ${
                  activeTab === tab.key
                    ? "border-amber text-foreground font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-1.5 py-0.5 text-xs font-mono ${
                  activeTab === tab.key ? "bg-amber/20 text-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 border-2 w-60 font-mono text-xs"
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground ml-auto">
            {filteredTasks.length} TASKS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
          {tasksLoading ? (
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

        {!tasksLoading && filteredTasks.length === 0 && (
          <div className="text-center py-16 font-mono text-sm text-muted-foreground">
            NO TASKS IN THIS TAB
          </div>
        )}

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
