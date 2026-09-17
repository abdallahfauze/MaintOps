import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BarChart3, Wrench, ClipboardList, Store,
  LogOut, ChevronLeft, ChevronRight, Users, Menu, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import AccountDeletion from "./AccountDeletion";
import NotificationBell from "./NotificationBell";

const ALL_NAV = [
  { path: "/dashboard", label: "Command Center", icon: LayoutDashboard, roles: ["admin", "leadership", "coordinator", "requester", "maintenance"] },
  { path: "/requester/new", label: "New Request", icon: ClipboardList, roles: ["admin", "requester"] },
  { path: "/reporting", label: "Reports", icon: BarChart3, roles: ["admin", "leadership", "coordinator"] },
  { path: "/stores", label: "Stores", icon: Store, roles: ["admin", "leadership", "coordinator", "requester"] },
  { path: "/admin-users", label: "User Access", icon: Users, roles: ["admin"] },
];

export default function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const role = user?.role || "";
  const navItems = ALL_NAV.filter(item => item.roles.includes(role));

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const NavContent = ({ isMobile = false }) => (
    <>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path === "/dashboard" && location.pathname === "/dashboard");
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(isMobile || !collapsed) && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t-2 border-sidebar-border space-y-0.5">
        <NotificationBell collapsed={!isMobile && collapsed} />
        <AccountDeletion collapsed={!isMobile && collapsed} />
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground w-full transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(isMobile || !collapsed) && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b-2 border-sidebar-border flex items-end justify-between px-4 pb-3"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          height: "calc(3.5rem + env(safe-area-inset-top))",
        }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sidebar-primary flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-black text-sm tracking-tight text-sidebar-foreground">
            MAINT<span className="text-sidebar-primary">OPS</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground p-1"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <div className={cn(
        "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-sidebar text-sidebar-foreground border-r-2 border-sidebar-border flex flex-col transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-14 px-4 border-b-2 border-sidebar-border flex items-center justify-between flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sidebar-primary flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-display font-black text-sm tracking-tight text-sidebar-foreground">
              MAINT<span className="text-sidebar-primary">OPS</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <NavContent isMobile={true} />
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className={cn(
        "hidden lg:flex h-screen bg-sidebar text-sidebar-foreground border-r-2 border-sidebar-border flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}>
        <div className="p-4 border-b-2 border-sidebar-border flex items-center justify-between">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary flex items-center justify-center">
                <Wrench className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              <span className="font-display font-black text-sm tracking-tight">
                MAINT<span className="text-sidebar-primary">OPS</span>
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-sidebar-primary flex items-center justify-center mx-auto">
              <Wrench className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <NavContent isMobile={false} />
      </aside>
    </>
  );
}
