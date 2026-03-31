import { NavLink } from "@/components/admin/NavLink";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  UserCircle,
  Wrench,
  Car,
  MapPin,
  Calendar,
  Clock,
  ClipboardList,
  UserX,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Building2,
  Landmark,
  Activity,
  History,
  Wallet,
  Database,
  Globe,
  Lightbulb,
  Archive,
  Quote,
} from "lucide-react";


import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { clearAuthState, getAuthState } from "@/lib/auth";
import { useMemo } from "react";
import { apiFetch } from "@/lib/admin/apiClient";

const navItemsBase = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", end: true },
  { icon: Users, label: "User Management", path: "/admin/users" },
  { icon: CheckSquare, label: "Task Management", path: "/admin/tasks" },
  { icon: UserCircle, label: "Employee Directory", path: "/admin/employees" },
  { icon: Wallet, label: "Payroll", path: "/admin/payroll" },
  { icon: History, label: "Task History", path: "/admin/task-history" },
  { icon: Wrench, label: "Appliances", path: "/admin/appliances" },
  { icon: Car, label: "Vehicles", path: "/admin/vehicles" },
  { icon: MapPin, label: "Locations", path: "/admin/locations" },
  { icon: Landmark, label: "Companies", path: "/admin/companies" },
  { icon: Building2, label: "Vendors", path: "/admin/vendors" },
  { icon: Calendar, label: "Scheduling", path: "/admin/scheduling" },
  { icon: Clock, label: "Time Tracking", path: "/admin/time-tracking" },
  { icon: MessageSquare, label: "Messaging", path: "/admin/messaging" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications" },
  { icon: UserX, label: "Do Not Hire", path: "/admin/do-not-hire" },
  { icon: ClipboardList, label: "Onboarding", path: "/admin/onboarding" },
  { icon: BarChart3, label: "Reports", path: "/admin/reports" },
  { icon: Globe, label: "Digital Assets", path: "/admin/digital-assets" },
  { icon: Lightbulb, label: "Intellectual Property", path: "/admin/intellectual-property" },
  { icon: Database, label: "Imported Asana Data", path: "/admin/asana-data" },
  { icon: Archive, label: "Archive Data", path: "/admin/archive-data" },
  { icon: Quote, label: "Founder Messages", path: "/admin/founder-messages" },
  {
    label: "SignaCore",
    path: "/admin/contracts",
    customIcon: (
      <img
        src="/signa-core.png"
        alt="SignaCore"
        className="h-6 w-6 flex-shrink-0 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
      />
    ),
  },
  { icon: Settings, label: "Settings", path: "/admin/settings" },

];

// Activity Logs only for super-admin
const activityLogNavItem = { icon: Activity, label: "Activity Logs", path: "/admin/activity-logs" };

type SidebarMode = "desktop" | "mobile";

interface SidebarProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
}

export function Sidebar({ mode = "desktop", onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const auth = getAuthState();

  // Build nav items based on role
  const navItems = useMemo(() => {
    const items = [...navItemsBase];
    // Insert Activity Logs before Settings (for super-admin only)
    if (auth.role === "super-admin") {
      const settingsIndex = items.findIndex((i) => i.label === "Settings");
      items.splice(settingsIndex, 0, activityLogNavItem);
    }
    return items;
  }, [auth.role]);

  const onLogout = async () => {
    // Call logout API to log the activity
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout logging failures and continue local sign-out.
    }
    clearAuthState();
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  const isMobile = mode === "mobile";

  const handleNavigate = () => {
    if (isMobile) {
      onNavigate?.();
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col text-white z-40 h-full",
        // Deep matte navy with subtle vertical gradient
        "bg-gradient-to-b from-[#0B1323] via-[#0B1323] to-[#0F172A]",
        isMobile
          ? "w-64"
          : "w-full shadow-floating animate-slide-in"
      )}
    >
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className="group relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-white/60 hover:bg-white/[0.04] hover:text-white hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-100 linear"
            activeClassName="bg-white/[0.06] text-white"
            onClick={handleNavigate}
          >
            {item.customIcon ? (
              item.customIcon
            ) : (
              <item.icon className="h-5 w-5 flex-shrink-0" />
            )}
            {item.label === "SignaCore" ? (
              <span className="text-sm font-bold truncate">
                <span className="text-[#38bdf8]">Signa</span>
                <span className="text-[#f97316]">Core</span>
              </span>
            ) : (
              <span className="text-sm font-medium truncate">{item.label}</span>
            )}
          </NavLink>

        ))}
      </nav>

      <div className="border-t border-white/10 px-2 pb-4 pt-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 h-10 rounded-lg px-3 text-white/60 hover:bg-red-500/10 hover:text-red-200 transition-all duration-[120ms] ease-in-out"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
