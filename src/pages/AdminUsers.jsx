import { useState } from "react";
import { Users } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, Users as UsersIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileSelect from "@/components/shared/MobileSelect";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Store, MaintenanceTeam } from "@/api/entities";

const ROLE_LABELS = {
  pending_requester: "Pending Requester",
  pending_maintenance: "Pending Maintenance",
  pending_leadership: "Pending Leadership",
  pending_coordinator: "Pending Coordinator",
  requester: "Requester",
  maintenance: "Maintenance",
  coordinator: "Coordinator",
  leadership: "Leadership",
  admin: "Admin",
};

const APPROVE_MAP = {
  pending_requester: "requester",
  pending_maintenance: "maintenance",
  pending_leadership: "leadership",
  pending_coordinator: "coordinator",
};

function UserRow({ user, stores, teams, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const showStoreAssign = user.role === "requester";
  const showTeamAssign = user.role === "maintenance";

  const currentStoreIds = user.store_ids?.length
    ? user.store_ids
    : user.store_id
    ? [user.store_id]
    : [];

  const toggleStore = (storeId) => {
    const current = currentStoreIds;
    const updated = current.includes(storeId)
      ? current.filter(id => id !== storeId)
      : [...current, storeId];
    const primary = updated[0] || "";
    const primaryStore = stores.find(s => s.id === primary);
    onUpdate(user.id, {
      store_ids: updated,
      store_id: primary || null,
      store_name: primaryStore?.name || "",
    });
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-sm">{user.full_name}</div>
          <div className="font-mono text-xs text-muted-foreground">{user.email}</div>
          {user.created_date && (
            <div className="font-mono text-xs text-muted-foreground">
              Joined {format(new Date(user.created_date), "MMM dd, yyyy")}
            </div>
          )}
          {showTeamAssign && user.team_name && (
            <div className="font-mono text-xs text-amber mt-0.5">Team: {user.team_name}</div>
          )}
          {showStoreAssign && currentStoreIds.length > 0 && (
            <div className="font-mono text-xs text-amber mt-0.5">
              {currentStoreIds.length} store{currentStoreIds.length > 1 ? "s" : ""} assigned
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MobileSelect
            value={user.role || "requester"}
            onValueChange={(role) => onUpdate(user.id, { role })}
            placeholder="Role"
            title="Role"
            triggerClassName="w-40"
            options={Object.entries(ROLE_LABELS)
              .filter(([val]) => !val.startsWith("pending_"))
              .map(([val, label]) => ({ value: val, label }))}
          />
          {(showStoreAssign || showTeamAssign) && (
            <Button
              size="sm"
              variant="outline"
              className="border-2 font-mono text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
        </div>
      </div>

      {expanded && showStoreAssign && (
        <div className="px-4 pb-4 bg-secondary/20 border-t border-border">
          <div className="font-mono text-xs text-muted-foreground mb-2 pt-3">ASSIGN STORES (select all that apply)</div>
          <div className="flex flex-wrap gap-0">
            {stores.map(store => {
              const isAssigned = currentStoreIds.includes(store.id);
              return (
                <button
                  key={store.id}
                  onClick={() => toggleStore(store.id)}
                  className={`border-2 px-3 py-2 font-mono text-xs transition-all ${
                    isAssigned
                      ? "border-amber bg-amber/10 text-foreground"
                      : "border-border hover:border-foreground text-muted-foreground"
                  }`}
                >
                  {store.store_code} · {store.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {expanded && showTeamAssign && (
        <div className="px-4 pb-4 bg-secondary/20 border-t border-border">
          <div className="font-mono text-xs text-muted-foreground mb-2 pt-3">ASSIGN TEAM</div>
          <div className="flex flex-wrap gap-0">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => onUpdate(user.id, { team_name: team.name })}
                className={`border-2 px-3 py-2 font-mono text-xs transition-all ${
                  user.team_name === team.name
                    ? "border-amber bg-amber/10 text-foreground"
                    : "border-border hover:border-foreground text-muted-foreground"
                }`}
              >
                {team.team_code} · {team.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => Users.list("-created_date", 200),
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => Store.list("store_code"),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => MaintenanceTeam.list(),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }) => Users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast({ title: "User updated" });
    },
  });

  const pendingUsers = users.filter(u => u.role?.startsWith("pending_"));
  const activeUsers = users.filter(u => !u.role?.startsWith("pending_"));

  const handleApprove = (user) => {
    const newRole = APPROVE_MAP[user.role] || "requester";
    updateUser.mutate({ id: user.id, data: { role: newRole } });
    supabase.functions.invoke("send-email", {
      body: {
        to: user.email,
        subject: "MaintOps — Your account has been approved",
        body: `Hi ${user.full_name},\n\nYour account has been approved as ${ROLE_LABELS[newRole]}. You can now log in at ${window.location.origin}.\n\nWelcome aboard!`,
      },
    });
  };

  const handleReject = (user) => {
    updateUser.mutate({ id: user.id, data: { role: "pending_requester" } });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-1">
          ADMIN · USER MANAGEMENT
        </div>
        <h1 className="font-display font-black text-3xl tracking-tight">USER ACCESS</h1>
      </div>

      {pendingUsers.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber" />
            <div className="font-mono text-xs tracking-[0.3em] text-amber">
              PENDING APPROVAL · {pendingUsers.length}
            </div>
          </div>
          <div className="space-y-0 border-2 border-amber/30">
            {pendingUsers.map(user => (
              <div key={user.id} className="border-b border-border last:border-b-0 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-display font-bold text-sm">{user.full_name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{user.email}</div>
                  <div className="font-mono text-xs text-amber mt-0.5">{ROLE_LABELS[user.role]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(user)}
                    className="bg-teal text-background hover:bg-teal/90 font-mono text-xs tracking-wider"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> APPROVE
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(user)}
                    className="border-2 border-destructive text-destructive hover:bg-destructive/10 font-mono text-xs tracking-wider"
                  >
                    <XCircle className="w-3 h-3 mr-1" /> DENY
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <UsersIcon className="w-4 h-4 text-muted-foreground" />
          <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground">
            ACTIVE USERS · {activeUsers.length}
          </div>
        </div>
        <div className="font-mono text-xs text-muted-foreground mb-3 bg-secondary/30 border-2 border-border p-3">
          TIP: After approving a requester, expand their row (▾) to assign stores. For maintenance users, expand to assign their team.
        </div>
        {isLoading ? (
          <div className="text-center py-12 font-mono text-sm text-muted-foreground">LOADING...</div>
        ) : (
          <div className="border-2 border-border">
            {activeUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                stores={stores}
                teams={teams}
                onUpdate={(id, data) => updateUser.mutate({ id, data })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
