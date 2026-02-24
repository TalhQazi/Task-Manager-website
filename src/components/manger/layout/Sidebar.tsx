import { NavLink } from "@/components/manger/NavLink";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Calendar,
  Clock,
  Car,
  Wrench,
  MapPin,
  UserX,
  ClipboardCheck,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/manger/utils";
import { clearAuthState } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/manger/api";
import { getAuthState } from "@/lib/auth";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/manager" },
  { icon: ClipboardList, label: "Tasks", path: "/manager/tasks" },
  { icon: Users, label: "Employees", path: "/manager/employees" },
  { icon: Calendar, label: "Scheduling", path: "/manager/scheduling" },
  { icon: Clock, label: "Time Tracking", path: "/manager/time-tracking" },
  { icon: Car, label: "Vehicles", path: "/manager/vehicles" },
  { icon: Wrench, label: "Appliances", path: "/manager/appliances" },
  { icon: MapPin, label: "Locations", path: "/manager/locations" },
  { icon: UserX, label: "Do Not Hire", path: "/manager/do-not-hire" },
  { icon: ClipboardCheck, label: "Onboarding", path: "/manager/onboarding" },
  { icon: BarChart3, label: "Reports", path: "/manager/reports" },
  { icon: MessageSquare, label: "Messages", path: "/manager/messages" },
];

type SidebarMode = "desktop" | "mobile";

interface SidebarProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
}

export function Sidebar({ mode = "desktop", onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      return apiFetch<{ item: { fullName?: string; email?: string; role?: string } }>("/api/settings");
    },
  });

  const auth = getAuthState();
  const fullName = String(settingsQuery.data?.item?.fullName || "").trim() || "User";
  const email = String(settingsQuery.data?.item?.email || "").trim();
  const role = String(settingsQuery.data?.item?.role || auth.role || "").trim();
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onLogout = () => {
    clearAuthState();
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  const handleNavigate = () => {
    if (mode === "mobile") {
      onNavigate?.();
    }
  };

  return (
    <aside
      className={cn(
        mode === "mobile"
          ? "h-full bg-sidebar flex flex-col w-64"
          : "fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
        mode === "mobile" ? "w-64" : collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sidebar-foreground">TaskManager</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-muted hover:text-sidebar-foreground transition-colors",
            mode === "mobile" && "hidden",
          )}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn("nav-item nav-item-inactive", collapsed && "justify-center px-2")}
            activeClassName="nav-item-active"
            onClick={handleNavigate}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to="/manager/settings"
          className={cn("nav-item nav-item-inactive", collapsed && "justify-center px-2")}
          activeClassName="nav-item-active"
          onClick={handleNavigate}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "nav-item nav-item-inactive w-full",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {!collapsed && (
          <div className="mt-4 p-3 rounded-lg bg-sidebar-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {initials || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {fullName}
                </p>
                <p className="text-xs text-sidebar-muted truncate">{email || role || auth.username || ""}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
