import { SidebarProfile } from "@/components/admin/layout/SidebarProfile";
import { NavLink } from "@/components/manger/NavLink";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Calendar,
  Clock,
  Coffee,
  DollarSign,
  User,
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
  ChevronLeft,
  ShoppingCart,
 
  Megaphone,

   CheckSquare,
   Mail,
FolderOpen,
Building,
CalendarCheck,
Bug,



} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { clearAuthState, getAuthState } from "@/lib/auth";
import React, { useMemo, useState, useEffect } from "react";
import { apiFetch } from "@/lib/manger/api";
import { useTheme } from "@/contexts/ThemeContext";

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
  { icon: ClipboardCheck, label: "Compliance Center", path: "/manager/compliance-center" },
  { icon: ClipboardList, label: "Tasks", path: "/manager/tasks" },
  { icon: Users, label: "Employees", path: "/manager/employees" },
  { icon: Megaphone, label: "Announcements", path: "/manager/announcements" },
  { icon: Calendar, label: "Scheduling", path: "/manager/scheduling" },
  { icon: Clock, label: "Time Tracking", path: "/manager/time-tracking" },
  { icon: Coffee, label: "Break History", path: "/manager/break-history" },
  { icon: Clock, label: "Attendance", path: "/manager/attendance" },
   {
      icon: FileText,
      label: "CRM",
      children: [
        { icon: CalendarCheck, label: "CRM Dashboard", path: "/manager/crm/dashboard" },
        { icon: Users, label: "Contacts", path: "/manager/crm/contacts" },
        { icon: Building, label: "Companies", path: "/manager/crm/companies" },
        { icon: CheckSquare, label: "CRM Deals", path: "/manager/crm/deals" },
        { icon: ClipboardList, label: "CRM Tasks", path: "/manager/crm/tasks" },
        { icon: FolderOpen, label: "Files", path: "/manager/crm/files" },
      ],
    },
  { icon: DollarSign, label: "Payroll", path: "/manager/payroll" },
  { icon: User, label: "Profile", path: "/manager/profile" },
  { icon: ClipboardCheck, label: "EOD Reports", path: "/manager/eod-reports" },
  { icon: Calendar, label: "Leave Requests", path: "/manager/leave-requests" },
  { icon: Calendar, label: "Travel Calendar", path: "/manager/travel-calendar" },
  { icon: Car, label: "Vehicles", path: "/manager/vehicles" },
  { icon: Wrench, label: "Inventory/Appliances", path: "/manager/appliances" },
  { icon: MapPin, label: "Locations", path: "/manager/locations" },
  { icon: MapPin, label: "Daily Itinerary", path: "/manager/itinerary" },
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
    label: "Atlas Properties",
    path: "/manager/uph-maintenance",
    customIcon: (
      <img
        src="/uph.jpeg"
        alt="Atlas Properties"
        className="h-6 w-6 flex-shrink-0 rounded-md object-cover opacity-85 group-hover:opacity-100 transition-opacity"
      />
    ),
  },
  {
    label: "Knowledge Vault",
    path: "/manager/personal-notes",
    customIcon: (
      <img
        src="/kn_vlt.png"
        alt="Knowledge Vault"
        className="h-5 w-5 flex-shrink-0 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
      />
    ),
  },
  { icon: Settings, label: "UI Customization", path: "/manager/ui-customization" },
  { icon: ShoppingCart, label: "Shopping Lists", path: "/manager/shopping-lists" },
  { icon: Settings, label: "Settings", path: "/manager/settings" },
  { icon: Bug, label: "Bugs", path: "/manager/bugs" },
].sort((a, b) => a.label.localeCompare(b.label));

type SidebarMode = "desktop" | "mobile";

interface SidebarProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ mode = "desktop", onNavigate, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const auth = getAuthState();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { uiTheme } = useTheme();
  const isMetallic = uiTheme.theme === "metallic-elite";

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

  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuLabel]: !prev[menuLabel]
    }));
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (item.children) {
      const isExpanded = expandedMenus[item.label] ?? false;
      const hasActiveChild = item.children.some(child => child.path && location.pathname.startsWith(child.path));
      
      return (
        <div key={item.label} className="flex flex-col mb-1">
          <button
            onClick={() => toggleMenu(item.label)}
            className={cn(
              "group relative flex w-full items-center justify-between rounded-lg text-white/60 hover:bg-white/[0.04] hover:text-white transition-all duration-100 linear",
              hasActiveChild && "text-white bg-white/[0.02]",
              isMobile ? "h-16 px-4" : "h-10 px-3",
              isCollapsed && !isMobile && "justify-center px-0"
            )}
          >
            <div className={cn("flex items-center gap-3", isMobile && "[&_img]:h-7 [&_img]:w-7")}>
              {isMetallic ? (
                <div className={cn(
                  "flex-shrink-0 flex items-center justify-center transition-all duration-150 rounded-lg overflow-hidden h-9 w-9 bg-black/40 border border-white/10",
                  hasActiveChild ? "border-[#ffd27a]/60 bg-gradient-to-br from-[#2b2c2d] to-[#111315]" : "group-hover:border-[#ffd27a]/30"
                )}>
                  {item.customIcon ? (
                    item.customIcon
                  ) : item.icon ? (
                    <item.icon className="h-5 w-5 text-[#c89537]" />
                  ) : null}
                </div>
              ) : (
                item.customIcon ? (
                  item.customIcon
                ) : item.icon ? (
                  <item.icon className={cn("flex-shrink-0 transition-all", isMobile ? "h-7 w-7" : "h-5 w-5")} style={{ color: "var(--tb-primary)" }} />
                ) : null
              )}
              {!(isCollapsed && !isMobile) && (
                <span className={cn("font-semibold truncate", isMobile ? "text-lg" : "text-sm font-medium")}>{item.label}</span>
              )}
            </div>
            {!(isCollapsed && !isMobile) && (
              isExpanded ? (
                <ChevronDown className={cn("opacity-50 transition-transform", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              ) : (
                <ChevronRight className={cn("opacity-50 transition-transform", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              )
            )}
          </button>
          
          {isExpanded && !isCollapsed && (
            <div className={cn("mt-1 flex flex-col gap-1 pl-4 border-l border-white/10", isMobile ? "ml-4" : "ml-2")}>
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
          "group relative flex w-full items-center gap-3 rounded-lg transition-all duration-100 linear",
          isCollapsed && !isMobile ? "justify-center h-12 px-0" : isChild 
            ? (isMobile ? "h-14 text-base pl-6 [&_img]:h-6 [&_img]:w-6" : "h-9 text-[13px] px-3") 
            : (isMobile ? "h-16 text-lg px-4 [&_img]:h-7 [&_img]:w-7" : "h-10 text-sm px-3")
        )}
        style={{ color: isMetallic ? undefined : "var(--tb-sidebar-text-color)" }}
        activeClassName={isMetallic ? "" : "bg-white/[0.06] text-white"}
        onClick={handleNavigate}
      >
        {({ isActive }) => {
          const pillClass = isMetallic && isActive ? "metallic-pill-active w-full" : "";
          
          return (
            <div className={cn("flex items-center w-full gap-3", isCollapsed && !isMobile ? "justify-center" : "", pillClass)}>
              {/* Active indicator bar */}
              {!isChild && !isMetallic && (
                <span 
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full",
                    "bg-[var(--tb-primary)] shadow-[0_0_8px_var(--tb-primary)]",
                    "transition-all duration-150 ease-in-out",
                    isActive ? "opacity-100" : "opacity-0",
                    isMobile ? "h-10" : "h-6"
                  )} 
                />
              )}
              {isChild && isActive && !isMetallic && (
                <span 
                  className={cn("absolute rounded-full bg-[var(--tb-primary)] shadow-[0_0_5px_var(--tb-primary)]", isMobile ? "left-[-19px] w-2 h-2" : "left-[-17px] w-1.5 h-1.5")}
                />
              )}
              
              {/* Dashboard Pulse */}
              {item.label === "Dashboard" && !isMetallic && (
                <span 
                  className={cn(
                    "absolute rounded-full bg-[var(--tb-primary)] opacity-20 animate-dashboard-pulse pointer-events-none",
                    isMobile ? "left-4 w-7 h-7" : "left-3 w-5 h-5"
                  )}
                  aria-hidden="true"
                />
              )}
              
              {isMetallic ? (
                <div className={cn(
                  "flex-shrink-0 flex items-center justify-center transition-all duration-150 rounded-lg overflow-hidden h-9 w-9 bg-black/40 border",
                  isActive
                    ? "border-[#ffd27a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_0_0_12px_rgba(200,149,55,0.3)] relative"
                    : "border-white/10 group-hover:border-[#ffd27a]/30"
                )}>
                  {isMetallic && isActive && (
                    <span className="absolute inset-0 rounded-lg bg-[#ffd27a]/15 animate-pulse pointer-events-none" />
                  )}
                  {item.customIcon ? (
                    item.customIcon
                  ) : (
                    <item.icon
                      className={cn("h-5 w-5 text-[#c89537] transition-all", isActive && "text-[#ffd27a]")}
                    />
                  )}
                </div>
              ) : (
                item.customIcon ? (
                  item.customIcon
                ) : (
                  <item.icon
                    className={cn(
                      "flex-shrink-0 transition-all duration-100 linear relative z-10",
                      isChild ? (isMobile ? "h-5 w-5" : "h-4 w-4") : (isMobile ? "h-7 w-7" : "h-5 w-5"),
                      isActive && ["brightness-[112%]", "scale-[1.03]"],
                      "group-hover:brightness-[108%]"
                    )}
                    style={{ color: "var(--tb-primary)" }}
                  />
                )
              )}

              {!(isCollapsed && !isMobile) && (
                item.label === "SignaCore" ? (
                  <span className={cn("font-bold truncate", isMobile ? "text-lg" : "text-sm")}>
                    <span className="text-[#38bdf8]">Signa</span>
                    <span className="text-[#f97316]">Core</span>
                  </span>
                ) : item.label === "Atlas Property Holding" ? (
                  <span className={cn("font-black truncate tracking-tight", isMobile ? "text-lg" : "text-sm")}>
                    <span className="text-[#5898B8]">A</span>
                    <span className="text-[#68B0D0]">P</span>
                    <span className="text-[#80B8D8]">H</span>
                  </span>
                ) : (
                  <span className={cn("truncate", isMobile ? "text-lg font-semibold" : "font-medium text-sm", isMetallic ? (isActive ? "text-white font-semibold" : "text-[#cfd7dc]") : "")}>{item.label}</span>
                )
              )}
            </div>
          );
        }}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col text-white z-40 transition-all duration-300",
        isMobile
          ? "w-64 h-full"
          : isCollapsed
          ? "fixed left-0 top-[300px] bottom-0 w-20 shadow-floating"
          : "fixed left-0 top-[300px] bottom-0 w-56 lg:w-64 shadow-floating",
        isMetallic && "border-r border-[#ffd27a]/20 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.8),_inset_0_1px_2px_rgba(255,255,255,0.1)]"
      )}
      style={{
        background: isMetallic
          ? "linear-gradient(90deg, rgba(0,0,0,0.1), rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.15)), repeating-linear-gradient(0deg, #1c1d1f, #1c1d1f 2px, #202224 2px, #202224 4px)"
          : "var(--tb-sidebar-bg)"
      }}
    >
      <div className={cn(
        "flex flex-col items-center border-b border-white/5 bg-white/[0.03] backdrop-blur-md",
        isCollapsed && !isMobile ? "px-2 py-4 mb-3" : "px-5 py-6 mb-3"
      )}>
        {isCollapsed && !isMobile ? (
          <div className={cn(
            "relative h-12 w-12 rounded-xl shadow-2xl border-2 group flex items-center justify-center overflow-hidden font-black text-lg select-none",
            isMetallic 
              ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/30 text-[#ffd27a]"
              : "bg-gradient-to-br from-[#00C6FF] to-[#0072FF] border-white/20 text-white"
          )}>
            {isMetallic && (
              <>
                <div className="metallic-corner-bracket metallic-bracket-tl" style={{ width: '4px', height: '4px' }} />
                <div className="metallic-corner-bracket metallic-bracket-tr" style={{ width: '4px', height: '4px' }} />
                <div className="metallic-corner-bracket metallic-bracket-bl" style={{ width: '4px', height: '4px' }} />
                <div className="metallic-corner-bracket metallic-bracket-br" style={{ width: '4px', height: '4px' }} />
              </>
            )}
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">TB</span>
          </div>
        ) : (
          <div className="relative w-full rounded-xl bg-white shadow-2xl border-4 border-white/20 group flex items-center justify-center overflow-hidden">
            <img
              src="/new_logo.jpeg"
              alt="Task Manager logo"
              className="w-full h-auto object-contain transition-all duration-500 hover:scale-105 active:scale-95"
              style={{ maxHeight: '150px' }}
            />
          </div>
        )}
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-2 py-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItemsBase.map((item) => renderNavItem(item))}
      </nav>
      {!isMobile && onToggleCollapse && (
        <div className="p-3 border-t border-white/5 flex items-center justify-center">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "group p-2 rounded-lg backdrop-blur-sm transition-all duration-150 active:scale-95 flex items-center justify-center w-full",
              isMetallic
                ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border border-[#ffd27a]/25 text-[#ffd27a] hover:border-[#ffd27a]/40 hover:text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                : "bg-black/20 hover:bg-black/40 text-white/70 hover:text-white"
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!isCollapsed && <span className="text-xs font-semibold ml-2">Collapse Panel</span>}
          </button>
        </div>
      )}
    </aside> 
  );
}
