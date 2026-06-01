import { SidebarProfile } from "./SidebarProfile";
import { NavLink } from "@/components/admin/NavLink";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  UserCircle,
  Wrench,
  Car,
  MapPin,
  Compass,
  Calendar,
  Clock,
  Coffee,
  ClipboardList,
  UserX,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Building2,
  Landmark,
  Building,
  Activity,
  History,
  Wallet,
  Database,
  Globe,
  Lightbulb,
  Archive,
  Quote,
  Image as ImageIcon,
  Layers,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Bug,
  Palette,
  CalendarCheck,
  Megaphone,
  Shield,
  UserPlus,
  Video,

  ShoppingCart,
  Mail,
  Book,
} from "lucide-react";


import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { clearAuthState, getAuthState } from "@/lib/auth";
import React, { useMemo, useState, useEffect } from "react";
import { apiFetch } from "@/lib/admin/apiClient";

type NavItem = {
  icon?: React.ComponentType<{ className?: string }>;
  customIcon?: React.ReactNode;
  label: string;
  path?: string;
  end?: boolean;
  children?: NavItem[];
};

const navItemsBase: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", end: true },
  {
    label: "AtlasBook",
    customIcon: (
      <img
        src="/atlas.png"
        alt="AtlasBook"
        className="h-5 w-5 flex-shrink-0 object-contain rounded opacity-80 group-hover:opacity-100 transition-opacity"
      />
    ),
    children: [
      { label: "AtlasBook Dashboard", path: "/admin/atlas-book" },
      { label: "Company Management", path: "/admin/atlas-book/company" },
      { label: "Property Management", path: "/admin/atlas-book/property" },
      { label: "Unit Management", path: "/admin/atlas-book/unit" },
      { label: "Chart of Accounts", path: "/admin/atlas-book/coa" },
      { label: "General Ledger", path: "/admin/atlas-book/gl" },
      { label: "Transaction Management", path: "/admin/atlas-book/transactions" },
      { label: "Accounts Payable", path: "/admin/atlas-book/ap" },
      { label: "Accounts Receivable", path: "/admin/atlas-book/ar" },
      { label: "Vendor Management", path: "/admin/atlas-book/vendor" },
      { label: "Customer/Tenant Management", path: "/admin/atlas-book/customer" },
      { label: "Receipt & OCR Module", path: "/admin/atlas-book/ocr" },
      { label: "Inventory Management", path: "/admin/atlas-book/inventory" },
      { label: "Payroll Module", path: "/admin/atlas-book/payroll" },
      { label: "Budget Management", path: "/admin/atlas-book/budget" },
      { label: "Financial Reporting", path: "/admin/atlas-book/reporting" },
      { label: "Fraud Detection", path: "/admin/atlas-book/fraud" },
      { label: "Credit Monitoring", path: "/admin/atlas-book/credit" },
      { label: "Title & Lien Monitoring", path: "/admin/atlas-book/title" },
      { label: "Dashboard & Analytics", path: "/admin/atlas-book/analytics" },
      { label: "Audit & Compliance", path: "/admin/atlas-book/audit" },
      { label: "Multi-Currency Module", path: "/admin/atlas-book/currency" },
      { label: "Tax Management", path: "/admin/atlas-book/tax" },
      { label: "Fixed Asset Management", path: "/admin/atlas-book/fixed-assets" },
      { label: "Loan & Financing", path: "/admin/atlas-book/loans" },
      { label: "Investor Reporting", path: "/admin/atlas-book/investor" },
      { label: "Approval Workflow", path: "/admin/atlas-book/approval" },
      { label: "Search & Analytics", path: "/admin/atlas-book/search" },
    ],
  },
  { icon: Users, label: "User Management", path: "/admin/users", end: true },
  { icon: CheckSquare, label: "Task Management", path: "/admin/tasks" },
  { icon: UserCircle, label: "Employee Directory", path: "/admin/employees" },
  { icon: Compass, label: "Itinerary History", path: "/admin/itineraries" },
  { icon: Megaphone, label: "Announcements", path: "/admin/announcements" },
  { icon: Video, label: "Video Messages", path: "/admin/video-messages" },
  { icon: Wallet, label: "Payroll", path: "/admin/payroll" },
  { icon: ClipboardList, label: "EOD Reports", path: "/admin/eod-reports" },
  { icon: Building, label: "EIN list", path: "/admin/company-registry" },
  { icon: CalendarCheck, label: "Leave Requests", path: "/admin/leave-requests" },
  { icon: Calendar, label: "Travel Calendar", path: "/admin/travel-calendar" },
  { icon: History, label: "Task History", path: "/admin/task-history" },
  { icon: Clock, label: "Time Tracking", path: "/admin/time-tracking" },
  { icon: Coffee, label: "Break History", path: "/admin/break-history" },
  {
    icon: Layers,
    label: "Operations",
    children: [
      { icon: Wrench, label: "Inventory/Appliances", path: "/admin/appliances" },
      { icon: Car, label: "Vehicles", path: "/admin/vehicles" },
      { icon: UserX, label: "Do Not Hire", path: "/admin/do-not-hire" },
      { icon: MapPin, label: "Locations", path: "/admin/locations" },
      { icon: Calendar, label: "Scheduling", path: "/admin/scheduling" },
      { icon: Bell, label: "Notifications", path: "/admin/notifications" },
    ],
  },
  {
    icon: Shield,
    label: "Delegation",
    children: [
      { icon: UserPlus, label: "Team Lead Mappings", path: "/admin/team-lead-mappings" },
      { icon: Shield, label: "Task Permissions", path: "/admin/task-permissions" },
    ],
  },
  { icon: Landmark, label: "Companies", path: "/admin/companies" },
  { icon: Building2, label: "Vendors", path: "/admin/vendors" },
  { icon: Users, label: "Contributors", path: "/admin/contributors" },
  { icon: MessageSquare, label: "Messaging", path: "/admin/messaging" },
  { icon: ClipboardList, label: "Onboarding", path: "/admin/onboarding" },
  { icon: ClipboardList, label: "New Hire Reporting", path: "/admin/new-hire-reporting" },
  {
    icon: FileText,
    label: "CRM",
    children: [
      { icon: CalendarCheck, label: "CRM Dashboard", path: "/admin/crm/dashboard" },
      { icon: Activity, label: "CommandCore®", path: "/admin/crm/commandcore" },
      { icon: Users, label: "Contacts", path: "/admin/crm/contacts" },
      { icon: Building, label: "Companies", path: "/admin/crm/companies" },
      { icon: CheckSquare, label: "CRM Deals", path: "/admin/crm/deals" },
      { icon: ClipboardList, label: "CRM Tasks", path: "/admin/crm/tasks" },
      { icon: FolderOpen, label: "Files", path: "/admin/crm/files" },
    ],
  },
  { icon: FolderOpen, label: "Images", path: "/admin/asset-library" },
  { icon: FileText, label: "Company Information", path: "/admin/company-information" },
  { icon: BarChart3, label: "Reports", path: "/admin/reports" },
  { icon: Globe, label: "Digital Assets", path: "/admin/digital-assets" },
  { icon: Lightbulb, label: "Intellectual Property", path: "/admin/intellectual-property" },
  { icon: Database, label: "Imported Asana Data", path: "/admin/asana-data" },
  { icon: Archive, label: "Archive Data", path: "/admin/archive-data" },
  { icon: Quote, label: "Founder Messages", path: "/admin/founder-messages" },
  { icon: ImageIcon, label: "Memes", path: "/admin/memes" },
  {
    label: "Personal Notes",
    path: "/admin/personal-notes",
    customIcon: (
      <img
        src="/kn_vlt.png"
        alt="Personal Notes"
        className="h-5 w-5 flex-shrink-0 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
      />
    ),
  },
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
  {
    label: "Ultimate Property Holdings",
    path: "/admin/uph-maintenance",
    customIcon: (
      <img
        src="/uph.jpeg"
        alt="UPH"
        className="h-6 w-6 flex-shrink-0 rounded-md object-cover opacity-85 group-hover:opacity-100 transition-opacity"
      />
    ),
  },
  { icon: ShoppingCart, label: "Shopping Lists", path: "/admin/shopping-lists" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
  { icon: Palette, label: "Theme Engine", path: "/admin/theme-engine" },
  { icon: Bug, label: "Bug", path: "/admin/bug-reports" },
];

// Activity Logs only for super-admin
const activityLogNavItem = { icon: Activity, label: "Activity Logs", path: "/admin/activity-logs" };
const systemEmailSettingsNavItem = { icon: Mail, label: "System Email Settings", path: "/admin/system-email-settings" };


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
    let items = [...navItemsBase];

    // Add super-admin items
    if (auth.role === "super-admin") {
      items.push(systemEmailSettingsNavItem, activityLogNavItem);
    }

    // Sort children within items first
    items.forEach(item => {
      if (item.children) {
        item.children = [...item.children].sort((a, b) => a.label.localeCompare(b.label));
      }
    });

    // Separate Settings from the list to ensure it's always last
    const settingsItem = items.find((i) => i.label === "Settings");
    const otherItems = items.filter((i) => i.label !== "Settings");

    // Sort all other items alphabetically
    const sortedItems = [...otherItems].sort((a, b) => a.label.localeCompare(b.label));

    // Combine sorted items with Settings at the end
    if (settingsItem) {
      sortedItems.push(settingsItem);
    }

    return sortedItems;
  }, [auth.role]);

  const onLogout = async () => {
    // Call logout API to log the activity
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearAuthState();
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  const isMobile = mode === "mobile";

  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group if a child is active
  useEffect(() => {
    const currentPath = location.pathname;
    navItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => child.path && currentPath.startsWith(child.path));
        if (hasActiveChild) {
          setExpandedGroups(prev => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [location.pathname, navItems]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigate = () => {
    if (isMobile) {
      onNavigate?.();
    }
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (item.children) {
      const isExpanded = expandedGroups[item.label];
      const hasActiveChild = item.children.some(child => child.path && location.pathname.startsWith(child.path));

      return (
        <div key={item.label} className="flex flex-col mb-1">
          <button
            onClick={() => toggleGroup(item.label)}
            className={cn(
              "group relative flex w-full items-center justify-between rounded-lg text-white/60 hover:bg-white/[0.04] hover:text-white transition-all duration-100 linear",
              hasActiveChild && "text-white bg-white/[0.02]",
              isMobile ? "h-16 px-4" : "h-10 px-3"
            )}
          >
            <div className={cn("flex items-center gap-3", isMobile && "[&_img]:h-7 [&_img]:w-7")}>
              {item.customIcon ? (
                item.customIcon
              ) : item.icon ? (
                <item.icon className={cn("flex-shrink-0 transition-all", hasActiveChild && "text-[#00C6FF]", isMobile ? "h-7 w-7" : "h-5 w-5")} />
              ) : null}
              <span className={cn("font-semibold truncate", isMobile ? "text-lg" : "text-sm font-medium")}>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className={cn("opacity-50 transition-transform", isMobile ? "h-5 w-5" : "h-4 w-4")} />
            ) : (
              <ChevronRight className={cn("opacity-50 transition-transform", isMobile ? "h-5 w-5" : "h-4 w-4")} />
            )}
          </button>

          {isExpanded && (
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
          "group relative flex w-full items-center gap-3 rounded-lg text-white/60 hover:bg-white/[0.04] hover:text-white hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-100 linear",
          isChild 
            ? (isMobile ? "h-14 text-base pl-6 [&_img]:h-6 [&_img]:w-6" : "h-9 text-[13px] px-3") 
            : (isMobile ? "h-16 text-lg px-4 [&_img]:h-7 [&_img]:w-7" : "h-10 text-sm px-3")
        )}
        activeClassName="bg-white/[0.06] text-white"
        onClick={handleNavigate}
      >
        {({ isActive }) => (
          <>
            {/* Active indicator bar */}
            {!isChild && (
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full",
                  "bg-gradient-to-b from-[#00C6FF] to-[#0072FF]",
                  "transition-all duration-150 ease-in-out",
                  isActive ? "opacity-100" : "opacity-0",
                  isMobile ? "h-10" : "h-6"
                )}
              />
            )}
            {isChild && isActive && (
              <span
                className={cn("absolute rounded-full bg-[#00C6FF]", isMobile ? "left-[-19px] w-2 h-2" : "left-[-17px] w-1.5 h-1.5")}
              />
            )}

            {/* Dashboard Pulse */}
            {item.label === "Dashboard" && (
              <span
                className={cn(
                  "absolute rounded-full bg-gradient-to-b from-[#00C6FF] to-[#0072FF] animate-dashboard-pulse pointer-events-none",
                  isMobile ? "left-4 w-7 h-7" : "left-3 w-5 h-5"
                )}
                aria-hidden="true"
              />
            )}

            {item.customIcon ? (
              item.customIcon
            ) : item.icon ? (
              <item.icon
                className={cn(
                  "flex-shrink-0 transition-all duration-100 linear relative z-10",
                  isChild ? (isMobile ? "h-5 w-5" : "h-4 w-4") : (isMobile ? "h-7 w-7" : "h-5 w-5"),
                  isActive && ["brightness-[112%]", "scale-[1.03]"],
                  "group-hover:brightness-[108%]"
                )}
              />
            ) : null}
            {item.label === "SignaCore" ? (
              <span className={cn("font-bold truncate", isMobile ? "text-lg" : "text-sm")}>
                <span className="text-[#38bdf8]">Signa</span>
                <span className="text-[#f97316]">Core</span>
              </span>
            ) : item.label === "UPH" ? (
              <span className={cn("font-black truncate tracking-tight", isMobile ? "text-lg" : "text-sm")}>
                <span className="text-[#5898B8]">U</span>
                <span className="text-[#68B0D0]">P</span>
                <span className="text-[#80B8D8]">H</span>
              </span>
            ) : (
              <span className={cn("truncate", isMobile ? "text-lg font-semibold" : "font-medium text-sm")}>{item.label}</span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col text-white z-40 h-full",
        isMobile
          ? "w-64 bg-[#0b1323]"
          : "w-full bg-[#0b1323] shadow-floating animate-slide-in"
      )}
    >
      <div className="px-5 py-6 mb-3 flex flex-col items-center border-b border-white/5 bg-white/[0.03] backdrop-blur-md">
        <div className="relative w-full rounded-xl bg-white shadow-2xl border-4 border-white/20 group flex items-center justify-center overflow-hidden">
          <img
            src={location.pathname.startsWith("/admin/atlas-book") ? "/atlas.png" : "/new_logo.jpeg"}
            alt="Task Manager logo"
            className="w-full h-auto object-contain transition-all duration-500 hover:scale-105 active:scale-95"
          />
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-2 py-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItems.map((item) => renderNavItem(item))}
      </nav>
    </aside>
  );
}
