import { useState } from "react";
import { Store, MaintenanceTask } from "@/api/entities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TaskCard from "@/components/shared/TaskCard";
import KPICard from "@/components/shared/KPICard";
import MobileSelect from "@/components/shared/MobileSelect";
import PullToRefreshWrapper from "@/components/shared/PullToRefreshWrapper";
import { Plus, ClipboardList, Clock, CheckCircle2 } from "lucide-react";

export default function RequesterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  const myStoreIds = user?.store_ids?.length
    ? user.store_ids
    : user?.store_id
    ? [user.store_id]
    : [];

  const [storeId, setStoreId] = useState("");

  const { data: allStores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => Store.list("store_code"),
  });

  const stores = isAdmin ? allStores : allStores.filter(s => myStoreIds.includes(s.id));

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["requester-tasks", user?.email, myStoreIds.join(",")],
    queryFn: () => {
      if (isAdmin) return MaintenanceTask.list("-created_date", 200);
      if (myStoreIds.length === 1) {
        return MaintenanceTask.filter({ store_id: myStoreIds[0] }, "-created_date", 200);
      }
      if (myStoreIds.length > 1) {
        return MaintenanceTask.list("-created_date", 200).then(all =>
          all.filter(t => myStoreIds.includes(t.store_id))
        );
      }
      return MaintenanceTask.filter({ created_by: user?.email }, "-created_date", 100);
    },
    enabled: !!user,
  });

  const storeTasks = storeId && storeId !== "all" ? tasks.filter(t => t.store_id === storeId) : tasks;

  const totalSubmitted = tasks.length;
  const inProgress = tasks.filter(t => t.status === "assigned" || t.status === "on_hold").length;
  const resolved = tasks.filter(t => t.status === "resolved").length;

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-1">
          STORE PORTAL · REQUESTER
        </div>
        <h1 className="font-display font-black text-3xl tracking-tight">MY REQUESTS</h1>
      </div>

      <div className="grid grid-cols-3 gap-0 mb-8">
        <KPICard label="TOTAL SUBMITTED" value={totalSubmitted} icon={ClipboardList} />
        <KPICard label="IN PROGRESS" value={inProgress} icon={Clock} accent={inProgress > 0} />
        <KPICard label="RESOLVED" value={resolved} icon={CheckCircle2} />
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <MobileSelect
          value={storeId}
          onValueChange={setStoreId}
          placeholder="FILTER BY STORE"
          title="Filter by Store"
          triggerClassName="w-64"
          options={[
            { value: "all", label: "ALL STORES" },
            ...stores.map(s => ({ value: s.id, label: `${s.store_code} · ${s.name}` })),
          ]}
        />
        <Button onClick={() => navigate("/requester/new")} className="bg-amber text-foreground hover:bg-amber/90 font-display font-bold tracking-wider">
          <Plus className="w-4 h-4 mr-2" /> NEW REQUEST
        </Button>
      </div>

      <PullToRefreshWrapper
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["requester-tasks"] });
          await queryClient.invalidateQueries({ queryKey: ["stores"] });
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {isLoading ? (
            <div className="col-span-2 text-center py-16 font-mono text-sm text-muted-foreground">LOADING...</div>
          ) : storeTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
        {!isLoading && storeTasks.length === 0 && (
          <div className="text-center py-16 font-mono text-sm text-muted-foreground">
            NO REQUESTS YET
          </div>
        )}
      </PullToRefreshWrapper>
    </div>
  );
}
