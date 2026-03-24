import { NavLink } from "@/components/admin/NavLink";
import { LayoutDashboard, ClipboardList, Calendar, UserCircle, Bell, LogOut, Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { clearEmployeeAuth } from "@/Employee/lib/auth";
import { employeeApiFetch } from "@/Employee/lib/api";

const navItemsBase = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/employee", end: true },
  { icon: ClipboardList, label: "My Tasks", path: "/employee/tasks" },
  { icon: Calendar, label: "Schedule", path: "/employee/schedule" },
  { icon: Clock, label: "Clocked", path: "/employee/clocked" },
  { icon: MessageCircle, label: "Messages", path: "/employee/messages" },
  { icon: UserCircle, label: "Profile", path: "/employee/profile" },
  { icon: Bell, label: "Notifications", path: "/employee/notifications" },
];

type SidebarMode = "desktop" | "mobile";

interface EmployeeSidebarProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
}

export function EmployeeSidebar({ mode = "desktop", onNavigate }: EmployeeSidebarProps) {
  const navigate = useNavigate();

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
        "flex flex-col text-white",
        isMobile
          ? "h-full w-64 bg-gradient-to-b from-[#0b2f6b] via-[#10428b] to-[#0a2a5c]"
          : "fixed left-0 top-36 bottom-0 w-20 bg-gradient-to-b from-[#0b2f6b] via-[#10428b] to-[#0a2a5c] shadow-floating animate-slide-in border-r-2 border-white/20"
      )}
    >
      <nav className="flex-1 flex flex-col items-center gap-5 py-4 overflow-y-auto overflow-x-hidden no-scrollbar mt-4">
        {navItemsBase.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={(item as any).end}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-md text-white/70 hover:bg-white/15 hover:text-white transition-colors",
              isMobile && "h-10 w-full rounded-md justify-start px-4 gap-3"
            )}
            activeClassName={cn("bg-white text-[#0b3f86] shadow-md pt-1 pb-1", isMobile && "bg-white/90")}
            onClick={handleNavigate}
          >
            <item.icon className="h-6 w-6 flex-shrink-0" />
            {isMobile && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={cn("border-t border-white/10 px-3 pb-4 pt-3", isMobile ? "" : "flex flex-col items-center")}>
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "flex items-center justify-center h-10 w-10 rounded-full text-white/80 hover:bg-red-500/20 hover:text-red-100 transition-colors",
            isMobile && "w-full rounded-xl justify-start px-4 gap-3"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isMobile && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
