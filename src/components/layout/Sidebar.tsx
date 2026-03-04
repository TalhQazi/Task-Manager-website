import { NavLink } from "@/components/NavLink";
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
  ChevronLeft,
  Menu,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ClipboardList, label: "Tasks", path: "/tasks" },
  { icon: Users, label: "Employees", path: "/employees" },
  { icon: Calendar, label: "Scheduling", path: "/scheduling" },
  { icon: Clock, label: "Time Tracking", path: "/time-tracking" },
  { icon: Car, label: "Vehicles", path: "/vehicles" },
  { icon: Wrench, label: "Appliances", path: "/appliances" },
  { icon: MapPin, label: "Locations", path: "/locations" },
  { icon: Building2, label: "Vendors", path: "/vendors" },
  { icon: UserX, label: "Do Not Hire", path: "/do-not-hire" },
  { icon: ClipboardCheck, label: "Onboarding", path: "/onboarding" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
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
          className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn("nav-item nav-item-inactive", collapsed && "justify-center px-2")}
            activeClassName="nav-item-active"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className={cn("nav-item nav-item-inactive", collapsed && "justify-center px-2")}
          activeClassName="nav-item-active"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {!collapsed && (
          <div className="mt-4 p-3 rounded-lg bg-sidebar-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  John Doe
                </p>
                <p className="text-xs text-sidebar-muted truncate">Manager</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
