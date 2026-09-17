import { useState, useEffect, useRef } from "react";
import { AppNotification } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { Bell, X, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TYPE_LABELS = {
  task_created: "New Request",
  task_assigned: "Task Assigned",
  task_updated: "Task Updated",
  task_escalated: "Escalated",
  task_resolved: "Resolved",
  task_closed: "Closed",
};

export default function NotificationBell({ collapsed = false }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!user?.email) return;
    AppNotification.filter(
      { recipient_email: user.email }, "-created_date", 50
    ).then(setNotifications);
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub = AppNotification.subscribe((event) => {
      if (event.data?.recipient_email !== user.email) return;
      if (event.type === "create") {
        setNotifications(prev => [event.data, ...prev]);
      } else if (event.type === "update") {
        setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
      } else if (event.type === "delete") {
        setNotifications(prev => prev.filter(n => n.id !== event.id));
      }
    });
    return unsub;
  }, [user?.email]);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = notifications.filter(n => !n.read);

  const markAllRead = () => {
    unread.forEach(n => AppNotification.update(n.id, { read: true }));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (n) => {
    if (n.read) return;
    AppNotification.update(n.id, { read: true });
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground w-full transition-colors relative",
          open && "text-sidebar-foreground"
        )}
      >
        <div className="relative flex-shrink-0">
          <Bell className="w-5 h-5" />
          {unread.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber text-foreground text-[9px] font-black rounded-full flex items-center justify-center leading-none">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </div>
        {!collapsed && <span>Notifications</span>}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-card border-2 border-border shadow-2xl z-50 flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border flex-shrink-0">
            <div className="font-mono text-xs tracking-[0.2em] font-bold">
              NOTIFICATIONS
              {unread.length > 0 && (
                <span className="ml-2 text-amber">{unread.length} NEW</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread.length > 0 && (
                <button onClick={markAllRead} className="text-muted-foreground hover:text-foreground transition-colors" title="Mark all read">
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center font-mono text-xs text-muted-foreground">NO NOTIFICATIONS</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={cn(
                    "px-4 py-3 border-b border-border cursor-pointer transition-colors hover:bg-secondary/50",
                    !n.read && "bg-amber/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className={cn("font-mono text-[10px] tracking-wider", !n.read ? "text-amber" : "text-muted-foreground")}>
                      {TYPE_LABELS[n.type] || n.type}
                      {n.task_code && ` · ${n.task_code}`}
                    </span>
                    {!n.read && <span className="w-2 h-2 bg-amber rounded-full flex-shrink-0 mt-0.5" />}
                  </div>
                  <div className="text-sm font-medium leading-snug mb-0.5">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                  {n.created_date && (
                    <div className="font-mono text-[10px] text-muted-foreground mt-1">
                      {format(new Date(n.created_date), "MMM dd, HH:mm")}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
