import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, BarChart3, Store } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const ALL_TABS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "leadership", "coordinator", "requester", "maintenance"] },
  { path: "/requester/new", label: "New", icon: ClipboardList, roles: ["admin", "requester"] },
  { path: "/reporting", label: "Reports", icon: BarChart3, roles: ["admin", "leadership", "coordinator"] },
  { path: "/stores", label: "Stores", icon: Store, roles: ["admin", "leadership", "coordinator", "requester"] },
];

export default function MobileBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || "";
  const tabs = ALL_TABS.filter(t => t.roles.includes(role));

  const tabHistory = useRef({});

  if (tabs.length === 0) return null;

  const handleTabPress = (path) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path + "/");

    if (isActive) {
      navigate(path, { replace: true });
    } else {
      const saved = tabHistory.current[path];
      const currentRoot = tabs.find(t => location.pathname.startsWith(t.path))?.path;
      if (currentRoot) tabHistory.current[currentRoot] = location.pathname;
      navigate(saved || path);
    }
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t-2 border-sidebar-border flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
        return (
          <button
            key={path}
            onClick={() => handleTabPress(path)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] font-mono tracking-wider transition-colors",
              isActive
                ? "text-sidebar-primary"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label.toUpperCase()}</span>
          </button>
        );
      })}
    </nav>
  );
}
