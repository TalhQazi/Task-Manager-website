import { NavLink } from "@/components/admin/NavLink";

import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  UserCircle, 
  Bell, 
  Clock, 
  MessageCircle, 
  FileText, 
  ClipboardCheck, 
  Folder, 
  Wallet, 
  Palette, 
  Calendar as CalendarIcon, 
  ShoppingCart, 
  History, 
  FileStack, 
  Bug, 
  Megaphone,
  Settings,
  Mail,
  MapPin
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { getAuthState } from "@/lib/auth";
import { useMemo } from "react";

const navItemsBase = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/employee", end: true },
  { icon: ClipboardCheck, label: "Compliance Center", path: "/employee/compliance-center" },
  { icon: Megaphone, label: "Announcements", path: "/employee/announcements" },
  { icon: ClipboardList, label: "My Tasks", path: "/employee/tasks" },
  { icon: MapPin, label: "Daily Itinerary", path: "/employee/itinerary" },
  { icon: Calendar, label: "Events", path: "/employee/schedule" },
  { icon: ClipboardCheck, label: "Scrum Records", path: "/employee/scrum-records" },
  { icon: Clock, label: "Attendance", path: "/employee/clocked" },
  { icon: History, label: "Time Logs", path: "/employee/timeLogs" },
  { icon: Wallet, label: "Payroll", path: "/employee/payroll" },
  // { icon: FileStack, label: "Documents", path: "/employee/documents" },
  { icon: CalendarIcon, label: "Leave Requests", path: "/employee/leave-requests" },
  { icon: Calendar, label: "Travel Calendar", path: "/employee/travel-calendar" },
  { icon: MessageCircle, label: "Messages", path: "/employee/messages" },
  { icon: Folder, label: "Images", path: "/employee/asset-library" },
  { icon: FileText, label: "Company Information", path: "/employee/company-information" },
  // { icon: UserCircle, label: "Profile", path: "/employee/profile" },
  { icon: Bell, label: "Notifications", path: "/employee/notifications" },
  { icon: FileText, label: "Personal Notes", path: "/employee/personal-notes" },
  { icon: Palette, label: "Theme Engine", path: "/employee/ui-customization" },
  { icon: ShoppingCart, label: "Shopping Lists", path: "/employee/shopping-lists" },
  { icon: Bug, label: "Bugs", path: "/employee/bugs" },
  { icon: FileText, label: "EOD Reports", path: "/employee/eod-reports" },
  { icon: Mail, label: "Email Settings", path: "/employee/email-settings" },
  
  // 👇 Settings item ko yahan add karein (ye sort se pehle filter ho jayega)
  { icon: Settings, label: "Settings", path: "/employee/settings" },
];

type SidebarMode = "desktop" | "mobile";

interface EmployeeSidebarProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
}

export function EmployeeSidebar({ mode = "desktop", onNavigate }: EmployeeSidebarProps) {
  const navigate = useNavigate();
  const auth = getAuthState();
  const topOffset = 300;
  const [sidebarBg, setSidebarBg] = useState("var(--tb-sidebar-bg, #0B1323)");

  const navItems = useMemo(() => {
    let items = [...navItemsBase];
    const settingsItem = items.find(item => item.label === "Settings");
    const otherItems = items.filter(item => item.label !== "Settings");
    return [
      ...otherItems.sort((a, b) => a.label.localeCompare(b.label)),
      ...(settingsItem ? [settingsItem] : [])
    ];
  }, []);

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
          : "fixed left-0 top-40 sm:top-[220px] md:top-[300px] bottom-0 w-56 shadow-floating"
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
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={(item as any).end}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-lg text-white/60 hover:bg-white/[0.04] hover:text-white transition-all duration-100 linear",
              isMobile ? "h-16 px-4" : "h-10 px-3"
            )}
            activeClassName="bg-white/[0.06] text-white"
            onClick={handleNavigate}
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                <span 
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full",
                    "bg-gradient-to-b from-[#00C6FF] to-[#0072FF]",
                    "transition-all duration-150 ease-in-out",
                    isActive ? "opacity-100" : "opacity-0",
                    isMobile ? "h-10" : "h-6"
                  )} 
                />
                <item.icon
                  className={cn(
                    "flex-shrink-0 transition-all duration-100 linear relative z-10 group-hover:brightness-[108%]",
                    isMobile ? "h-7 w-7" : "h-5 w-5"
                  )}
                  style={{ color: "var(--tb-sidebar-icon-color)" }}
                />
                <span 
                  className={cn("truncate", isMobile ? "text-lg font-semibold" : "text-sm font-medium")}
                  style={{ color: "var(--tb-sidebar-text-color)" }}
                >
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