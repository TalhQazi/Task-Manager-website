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
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/manger/utils";
import { clearAuthState } from "@/lib/auth";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/manager", end: true },
  { icon: ClipboardList, label: "Tasks", path: "/manager/tasks" },
  { icon: Users, label: "Employees", path: "/manager/employees" },
  { icon: Calendar, label: "Scheduling", path: "/manager/scheduling" },
  { icon: Clock, label: "Time Tracking", path: "/manager/time-tracking" },
  { icon: Car, label: "Vehicles", path: "/manager/vehicles" },
  { icon: Wrench, label: "Appliances", path: "/manager/appliances" },
  { icon: MapPin, label: "Locations", path: "/manager/locations" },
  { icon: Building2, label: "Vendors", path: "/manager/vendors" },
  { icon: UserX, label: "Do Not Hire", path: "/manager/do-not-hire" },
  { icon: ClipboardCheck, label: "Onboarding", path: "/manager/onboarding" },
  { icon: BarChart3, label: "Reports", path: "/manager/reports" },
  { icon: MessageSquare, label: "Messages", path: "/manager/messages" },
  { 
    label: "SignaCore", 
    path: "/manager/contracts",
    customIcon: (
      <img 
        src="/signa-core.png" 
        alt="SignaCore" 
        className="h-6 w-6 flex-shrink-0 object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
      />
    )
  },
  { icon: Settings, label: "Settings", path: "/manager/settings" },
];

type SidebarMode = "desktop" | "mobile";

interface SidebarProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
}

export function Sidebar({ mode = "desktop", onNavigate }: SidebarProps) {
  const navigate = useNavigate();

  const onLogout = () => {
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
        "flex flex-col text-white",
        isMobile
          ? "h-full w-64 bg-gradient-to-b from-[#0B1323] via-[#0B1323] to-[#0F172A]"
          : "fixed left-0 top-[250px] bottom-0 w-56 bg-gradient-to-b from-[#0B1323] via-[#0B1323] to-[#0F172A] shadow-floating animate-slide-in border-r-2 border-white/20"
      )}
    >
      {/* Navigation icons */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto overflow-x-hidden no-scrollbar mt-4" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
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

      {/* Footer - only Logout */}
      <div className="border-t border-white/10 px-2 pb-4 pt-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 h-10 rounded-lg px-3 text-white/80 hover:bg-red-500/20 hover:text-red-100 transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
