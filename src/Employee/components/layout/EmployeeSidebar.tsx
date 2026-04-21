import { useEffect, useState } from "react";
import { NavLink } from "@/components/admin/NavLink";

import { LayoutDashboard, ClipboardList, Calendar, UserCircle, Bell, LogOut, Clock, MessageCircle, FileText, ClipboardCheck ,Wallet} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { clearEmployeeAuth } from "@/Employee/lib/auth";
import { employeeApiFetch } from "@/Employee/lib/api";

const navItemsBase = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/employee", end: true },
  { icon: ClipboardList, label: "My Tasks", path: "/employee/tasks" },
  { icon: Calendar, label: "Events", path: "/employee/schedule" },

  { icon: ClipboardCheck, label: "Scrum Records", path: "/employee/scrum-records" },

  { icon: Clock, label: "Time Tracking", path: "/employee/clocked" },
  { icon: Wallet, label: "Payroll", path: "/employee/payroll" },
  { icon: FileText, label: "Documents", path: "/employee/documents" },

  { icon: MessageCircle, label: "Messages", path: "/employee/messages" },
  { icon: UserCircle, label: "Profile", path: "/employee/profile" },
  { icon: Bell, label: "Notifications", path: "/employee/notifications" },
  { icon: FileText, label: "My Notes", path: "/employee/personal-notes" },
];

type SidebarMode = "desktop" | "mobile";

interface EmployeeSidebarProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
}

export function EmployeeSidebar({ mode = "desktop", onNavigate }: EmployeeSidebarProps) {
  const navigate = useNavigate();
  const [topOffset, setTopOffset] = useState(250);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setTopOffset(120);
      } else if (window.innerWidth < 1024) {
        setTopOffset(180);
      } else {
        setTopOffset(250);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = mode === "mobile";

  const handleNavigate = () => {
    if (isMobile) {
      onNavigate?.();
    }
  };

  const onLogout = async () => {
    try {
      await employeeApiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore errors
    }
    clearEmployeeAuth();
    localStorage.removeItem("token");
    onNavigate?.();
    navigate("/login/employee", { replace: true });
  };

  return (
    <aside
      className={cn(
        "flex flex-col text-white z-40",
        // Deep matte navy with subtle vertical gradient (matching admin sidebar)
        isMobile
          ? "h-full w-64 bg-gradient-to-b from-[#0B1323] via-[#0B1323] to-[#0F172A]"
          : "fixed left-0 bottom-0 w-56 bg-gradient-to-b from-[#0B1323] via-[#0B1323] to-[#0F172A] shadow-floating border-r border-white/5"
      )}
      style={!isMobile ? { top: `${topOffset}px` } : undefined}
    >
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
                <item.icon className="h-5 w-5 flex-shrink-0 transition-all duration-100 linear relative z-10 group-hover:brightness-[108%]" />
                <span className="text-sm font-medium truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-2 pb-4 pt-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 h-10 rounded-lg px-3 text-white/60 hover:bg-white/[0.04] hover:text-white transition-all duration-100 linear"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
