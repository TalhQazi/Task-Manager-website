import { NavLink } from "@/components/admin/NavLink";

import { LayoutDashboard, ClipboardList, Calendar, UserCircle, Bell, Clock, MessageCircle, FileText, ClipboardCheck, Folder, Wallet, Palette } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItemsBase = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/employee", end: true },
  { icon: ClipboardList, label: "My Tasks", path: "/employee/tasks" },
  { icon: Calendar, label: "Events", path: "/employee/schedule" },

  { icon: ClipboardCheck, label: "Scrum Records", path: "/employee/scrum-records" },

  { icon: Clock, label: "Time Tracking", path: "/employee/clocked" },
  { icon: Wallet, label: "Payroll", path: "/employee/payroll" },

  { icon: MessageCircle, label: "Messages", path: "/employee/messages" },
  { icon: Folder, label: "Company Information/Images", path: "/employee/asset-library" },
  { icon: UserCircle, label: "Profile", path: "/employee/profile" },
  { icon: Bell, label: "Notifications", path: "/employee/notifications" },
  { icon: FileText, label: "My Notes", path: "/employee/personal-notes" },
  { icon: Palette, label: "UI Customization", path: "/employee/ui-customization" },
];

type SidebarMode = "desktop" | "mobile";

interface EmployeeSidebarProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
}

export function EmployeeSidebar({ mode = "desktop", onNavigate }: EmployeeSidebarProps) {
  const navigate = useNavigate();
  const topOffset = 300;
  const [sidebarBg, setSidebarBg] = useState("var(--tb-sidebar-bg, #0B1323)");

  const isMobile = mode === "mobile";

  const handleNavigate = () => {
    if (isMobile) {
      onNavigate?.();
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col z-40 bg-[#0b1323]",
        isMobile
          ? "h-full w-64"
          : "fixed left-0 top-[300px] bottom-0 w-56 shadow-floating"
      )}
    >
      <div className="px-5 py-6 mb-3 flex flex-col items-center border-b border-white/5 bg-white/[0.03] backdrop-blur-md">
        <div className="relative w-full rounded-xl bg-white shadow-2xl border-4 border-white/20 group flex items-center justify-center overflow-hidden">
          <img
            src="/new_logo.jpeg"
            alt="Task Manager logo"
            className="w-full h-auto object-contain transition-all duration-500 hover:scale-105 active:scale-95"
            style={{ maxHeight: '150px' }}
          />
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-2 py-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItemsBase.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={(item as any).end}
            className="group relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-white/60 hover:bg-white/[0.04] hover:text-white transition-all duration-100 linear"
            activeClassName="bg-white/[0.06] text-white"
            onClick={handleNavigate}
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                <span 
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full",
                    "bg-gradient-to-b from-[#00C6FF] to-[#0072FF]",
                    "transition-all duration-[120ms] ease-in-out",
                    isActive ? "opacity-100" : "opacity-0"
                  )} 
                />
                <item.icon
                  className="h-5 w-5 flex-shrink-0 transition-all duration-100 linear relative z-10 group-hover:brightness-[108%]"
                  style={{ color: "var(--tb-sidebar-icon-color)" }}
                />
                <span className="text-sm font-medium truncate" style={{ color: "var(--tb-sidebar-text-color)" }}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
