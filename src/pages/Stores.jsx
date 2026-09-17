import { Store, MaintenanceTask } from "@/api/entities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import MobileSelect from "@/components/shared/MobileSelect";
import PullToRefreshWrapper from "@/components/shared/PullToRefreshWrapper";
import { Search, MapPin, Phone, User, Wrench } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";

export default function Stores() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");

  const isAdmin = user?.role === "admin" || user?.role === "leadership" || user?.role === "coordinator";
  const myStoreIds = user?.store_ids?.length
    ? user.store_ids
    : user?.store_id
    ? [user.store_id]
    : [];

  const { data: allStores = [], isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: () => Store.list("store_code"),
  });

  const stores = isAdmin ? allStores : allStores.filter(s => myStoreIds.includes(s.id));

  const { data: tasks = [] } = useQuery({
    queryKey: ["all-tasks-stores"],
    queryFn: () => MaintenanceTask.list("-created_date", 500),
  });

  const filtered = stores.filter(s => {
    const matchesSearch = !search ||
      s.store_code?.toLowerCase().includes(search.toLowerCase()) ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = region === "all" || s.region === region;
    return matchesSearch && matchesRegion;
  });

  const getStoreStats = (storeId) => {
    const storeTasks = tasks.filter(t => t.store_id === storeId);
    return {
      total: storeTasks.length,
      open: storeTasks.filter(t => t.status === "assigned").length,
      active: storeTasks.filter(t => ["assigned", "on_hold"].includes(t.status)).length,
      resolved: storeTasks.filter(t => t.status === "resolved").length,
    };
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px]">
      <div className="mb-8">
        <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-1">
          NETWORK · STORES
        </div>
        <h1 className="font-display font-black text-3xl lg:text-4xl tracking-tight">
          STORE DIRECTORY
        </h1>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 border-2 font-mono text-xs"
            placeholder="Search stores..."
          />
        </div>
        <MobileSelect
          value={region}
          onValueChange={setRegion}
          placeholder="ALL CITIES"
          title="City / Region"
          triggerClassName="w-40"
          options={[
            { value: "all", label: "ALL CITIES" },
            ...[...new Set(stores.map(s => s.region).filter(Boolean))].sort().map(r => ({ value: r, label: r })),
          ]}
        />
        <span className="font-mono text-xs text-muted-foreground">
          {filtered.length} STORES
        </span>
      </div>

      <PullToRefreshWrapper
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["stores"] });
          await queryClient.invalidateQueries({ queryKey: ["all-tasks-stores"] });
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="border-2 border-border p-5">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-40 mb-3" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : (
            filtered.map(store => {
              const stats = getStoreStats(store.id);
              return (
                <div key={store.id} className="border-2 border-border p-5 hover:border-foreground transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-amber tracking-wider">{store.store_code}</span>
                    <span className="font-mono text-xs text-muted-foreground uppercase">{store.region}</span>
                  </div>
                  <h3 className="font-display font-bold text-base tracking-tight mb-3">{store.name}</h3>
                  {store.address && (
                    <a href={store.address} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-amber transition-colors mb-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" /> View on Map
                    </a>
                  )}
                  {store.contact_name && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <User className="w-3 h-3 flex-shrink-0" /> {store.contact_name}
                    </div>
                  )}
                  {store.contact_phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Phone className="w-3 h-3 flex-shrink-0" /> <span className="font-mono">{store.contact_phone}</span>
                    </div>
                  )}
                  {store.maintenance_team && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber mb-1">
                        <Wrench className="w-3 h-3 flex-shrink-0" /> {store.maintenance_team}
                      </div>
                      {store.maintenance_team_phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 flex-shrink-0" /> <span className="font-mono">{store.maintenance_team_phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-4 gap-1 text-center">
                    <div>
                      <div className="font-display font-black text-lg">{stats.total}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">TOTAL</div>
                    </div>
                    <div>
                      <div className="font-display font-black text-lg text-amber">{stats.open}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">OPEN</div>
                    </div>
                    <div>
                      <div className="font-display font-black text-lg">{stats.active}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">ACTIVE</div>
                    </div>
                    <div>
                      <div className="font-display font-black text-lg text-teal">{stats.resolved}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">DONE</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PullToRefreshWrapper>
    </div>
  );
}
