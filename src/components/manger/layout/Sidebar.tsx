import { SidebarProfile } from "@/components/admin/layout/SidebarProfile";
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
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { clearAuthState, getAuthState } from "@/lib/auth";
import React, { useMemo, useState, useEffect } from "react";
import { apiFetch } from "@/lib/manger/api";

type NavItem = {
  icon?: any;
  customIcon?: React.ReactNode;
  label: string;
  path?: string;
  end?: boolean;
  children?: NavItem[];
};

const navItemsBase: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/manager", end: true },
  { icon: ClipboardList, label: "Tasks", path: "/manager/tasks" },
  { icon: Users, label: "Employees", path: "/manager/employees" },
  { icon: Calendar, label: "Scheduling", path: "/manager/scheduling" },
  { icon: Clock, label: "Time Tracking", path: "/manager/time-tracking" },
  { icon: ClipboardCheck, label: "EOD Reports", path: "/manager/eod-reports" },
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
    ),
  },
  {
    label: "Ultimate Property Holdings",
    path: "/manager/uph-maintenance",
    customIcon: (
      <img
        src="/uph.jpeg"
        alt="UPH"
        className="h-6 w-6 flex-shrink-0 rounded-md object-cover opacity-85 group-hover:opacity-100 transition-opacity"
      />
    ),
  },
  { icon: FileText, label: "Personal Notes", path: "/manager/personal-notes" },
  { icon: Settings, label: "UI Customization", path: "/manager/ui-customization" },
  { icon: Settings, label: "Settings", path: "/manager/settings" },
];

type SidebarMode = "desktop" | "mobile";

interface SidebarProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
}

export function Sidebar({ mode = "desktop", onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const auth = getAuthState();

  const onLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
    }
    clearAuthState();
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  const isMobile = mode === "mobile";

  const location = useLocation();

  const handleNavigate = () => {
    if (isMobile) {
      onNavigate?.();
    }
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (item.children) {
      const isExpanded = true;
      const hasActiveChild = item.children.some(child => child.path && location.pathname.startsWith(child.path));
      
      return (
        <div key={item.label} className="flex flex-col mb-1">
          <button
            className={cn(
              "group relative flex h-10 w-full items-center justify-between rounded-lg px-3 text-white/60 hover:bg-white/[0.04] hover:text-white transition-all duration-100 linear",
              hasActiveChild && "text-white bg-white/[0.02]"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-all", hasActiveChild && "text-[#00C6FF]")} />
              <span className="text-sm font-medium truncate">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 opacity-50 transition-transform" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-50 transition-transform" />
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-1 flex flex-col gap-1 pl-4 ml-2 border-l border-white/10">
              {item.children.map(child => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    if (!item.path) return null;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end}
        className={cn(
          "group relative flex h-10 w-full items-center gap-3 rounded-lg px-3 hover:bg-white/[0.04] hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-100 linear",
          isChild && "h-9 text-[13px]"
        )}
        style={{ color: "var(--tb-sidebar-text-color)" }}
        activeClassName="bg-white/[0.06] text-white"
        onClick={handleNavigate}
      >
        {({ isActive }) => (
          <>
            {/* Active indicator bar */}
            {!isChild && (
              <span 
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full",
                  "bg-gradient-to-b from-[#00C6FF] to-[#0072FF]",
                  "transition-all duration-[120ms] ease-in-out",
                  isActive ? "opacity-100" : "opacity-0"
                )} 
              />
            )}
            {isChild && isActive && (
              <span 
                className="absolute left-[-17px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00C6FF]"
              />
            )}
            
            {/* Dashboard Pulse */}
            {item.label === "Dashboard" && (
              <span 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-b from-[#00C6FF] to-[#0072FF] animate-dashboard-pulse pointer-events-none"
                aria-hidden="true"
              />
            )}
            
            {item.customIcon ? (
              item.customIcon
            ) : (
              <item.icon
                className={cn(
                  "flex-shrink-0 transition-all duration-100 linear relative z-10",
                  isChild ? "h-4 w-4" : "h-5 w-5",
                  isActive && ["brightness-[112%]", "scale-[1.03]"],
                  "group-hover:brightness-[108%]"
                )}
                style={{ color: "var(--tb-sidebar-icon-color)" }}
              />
            )}
            {item.label === "SignaCore" ? (
              <span className="text-sm font-bold truncate">
                <span className="text-[#38bdf8]">Signa</span>
                <span className="text-[#f97316]">Core</span>
              </span>
            ) : item.label === "UPH" ? (
              <span className="text-sm font-black truncate tracking-tight">
                <span className="text-[#5898B8]">U</span>
                <span className="text-[#68B0D0]">P</span>
                <span className="text-[#80B8D8]">H</span>
              </span>
            ) : (
              <span className="font-medium truncate">{item.label}</span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col text-white z-40",
        isMobile
          ? "w-64 h-full"
          : "fixed left-0 top-[300px] bottom-0 w-56 lg:w-64 shadow-floating"
      )}
      style={{ background: "var(--tb-sidebar-bg)" }}
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
        {navItemsBase.map((item) => renderNavItem(item))}
      </nav>
    </aside>
  );
}
