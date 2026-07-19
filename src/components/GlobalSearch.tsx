import React, { useEffect, useState, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  FileText,
  Users,
  Briefcase,
  CornerDownLeft,
  X,
  Loader2,
  ListTodo,
  FolderKanban,
  Building2,
  Megaphone,
  Truck,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEmployee?: boolean;
  basePath?: string;
}

export interface SearchItem {
  id: string;
  type: "page" | "case" | "employee" | "task" | "project" | "crm" | "announcement" | "equipment" | "website";
  title: string;
  subtitle: string;
  url: string;
  category?: string;
  keywords?: string[];
}

export function GlobalSearch({ open, onOpenChange, isEmployee = false, basePath }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [dynamicResults, setDynamicResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define static navigation pages
  const staticPages = useMemo<SearchItem[]>(() => {
    if (isEmployee) {
      return [
        { id: "e-dash", type: "page", title: "Dashboard", subtitle: "Employee Home Overview", url: "/employee/dashboard", keywords: ["home", "main", "dashboard", "overview"] },
        { id: "e-tasks", type: "page", title: "My Tasks", subtitle: "View and update your assigned tasks", url: "/employee/tasks", keywords: ["task", "todo", "jobs", "assignee"] },
        { id: "e-sched", type: "page", title: "Schedule", subtitle: "View your weekly shifts and hours", url: "/employee/schedule", keywords: ["schedule", "shift", "calendar", "work"] },
        { id: "e-clock", type: "page", title: "Clock In/Out", subtitle: "Clock in, clock out, and track break status", url: "/employee/clocked", keywords: ["clock", "punch", "break", "lunch", "hours"] },
        { id: "e-logs", type: "page", title: "Time Logs", subtitle: "Your history of worked hours", url: "/employee/timeLogs", keywords: ["log", "history", "timesheet", "hours"] },
        { id: "e-pay", type: "page", title: "Payroll & Taxes", subtitle: "Paychecks, tax forms, and W4 reports", url: "/employee/payroll", keywords: ["payroll", "tax", "w4", "salary", "pay"] },
        { id: "e-leave", type: "page", title: "Leave Requests", subtitle: "Request time off, vacation, or sick leave", url: "/employee/leave-requests", keywords: ["leave", "pto", "vacation", "sick", "off"] },
        { id: "e-profile", type: "page", title: "My Profile", subtitle: "Manage personal profile and settings", url: "/employee/profile", keywords: ["profile", "me", "account", "bank", "mfa"] },
        { id: "e-news", type: "page", title: "Announcements", subtitle: "Company bulletins and updates", url: "/employee/announcements", keywords: ["news", "announcements", "board", "bulletin"] },
        { id: "e-shop", type: "page", title: "Shopping Lists", subtitle: "Create and view shopping lists", url: "/employee/shopping-lists", keywords: ["shop", "buy", "grocery", "items"] },
        { id: "e-itinerary", type: "page", title: "My Itinerary", subtitle: "View optimized routes and stops for today", url: "/employee/itinerary", keywords: ["itinerary", "route", "map", "stop", "travel"] }
      ];
    }

    return [
      { id: "a-dash", type: "page", title: "Dashboard", subtitle: "Business overview & statistics", url: "/admin", keywords: ["home", "main", "dashboard", "overview"] },
      { id: "a-tasks", type: "page", title: "Tasks Manager", subtitle: "Manage project task lists and assignments", url: "/admin/tasks", keywords: ["task", "todo", "jobs", "project"] },
      { id: "a-emp", type: "page", title: "Employee Directory", subtitle: "Manage staff profiles, pay rates, and shifts", url: "/admin/employees", keywords: ["employees", "staff", "directory", "category"] },
      { id: "a-cases", type: "page", title: "Legal Cases", subtitle: "PACER & federal appellate court case tracking", url: "/admin/legal/cases", keywords: ["cases", "legal", "court", "pacer", "judge", "origin"] },
      { id: "a-dead", type: "page", title: "Legal Deadlines", subtitle: "Track key legal dates and deadlines", url: "/admin/legal/deadlines", keywords: ["deadline", "calendar", "legal", "date"] },
      { id: "a-cont", type: "page", title: "Legal Contacts", subtitle: "Witnesses, clients, opposing counsels, and judges", url: "/admin/legal/contacts", keywords: ["contact", "legal", "lawyer", "witness", "judge"] },
      { id: "a-crm", type: "page", title: "CRM Dashboard", subtitle: "Client relations, deals, and communication", url: "/admin/crm/dashboard", keywords: ["crm", "client", "deal", "company", "communication"] },
      { id: "a-exp", type: "page", title: "Expense Sheets", subtitle: "Track expense reports and company spending", url: "/admin/expense-sheets", keywords: ["expense", "sheet", "cost", "spending", "money"] },
      { id: "a-time", type: "page", title: "Time Tracking", subtitle: "Monitor employee clock-ins and breaks", url: "/admin/time-tracking", keywords: ["clock", "time", "hour", "timesheet", "break"] },
      { id: "a-sched", type: "page", title: "Scheduling Rosters", subtitle: "Plan weekly schedules and shifts", url: "/admin/scheduling", keywords: ["schedule", "shift", "roster", "calendar"] },
      { id: "a-pay", type: "page", title: "Payroll Management", subtitle: "Manage employee payroll periods and gross pay", url: "/admin/payroll", keywords: ["payroll", "salary", "check", "bank", "pay"] },
      { id: "a-settings", type: "page", title: "System Settings", subtitle: "Configure email, templates, and preferences", url: "/admin/settings", keywords: ["settings", "system", "email", "preferences"] },
      { id: "a-profile", type: "page", title: "My Profile", subtitle: "Your account details and preferences", url: "/admin/profile", keywords: ["profile", "me", "account", "settings"] },
      { id: "a-notes", type: "page", title: "Personal Notes", subtitle: "Your personal notes and scratchpad", url: "/admin/personal-notes", keywords: ["notes", "scratchpad", "draft", "personal"] },
      { id: "a-comp", type: "page", title: "Compliance Center", subtitle: "Compliance audits, logs, and monitoring", url: "/admin/compliance-center", keywords: ["compliance", "audit", "logs", "monitor"] }
    ];
  }, [isEmployee]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setActiveIndex(0);
    } else {
      setQuery("");
      setDynamicResults([]);
    }
  }, [open]);

  // Live debounced server search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !open) {
      setDynamicResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "https://task.se7eninc.com";
        let token = localStorage.getItem("token") || "";

        const authKey = isEmployee ? "employee_auth" : "taskflow_auth";
        const authRaw = localStorage.getItem(authKey);
        if (authRaw) {
          try {
            const authObj = JSON.parse(authRaw);
            if (authObj.token) token = authObj.token;
          } catch {}
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const panelBase = basePath || (isEmployee ? "/employee" : "/admin");
        const url = `${API_BASE_URL}/api/global-search?q=${encodeURIComponent(trimmed)}&basePath=${encodeURIComponent(panelBase)}`;

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setDynamicResults(Array.isArray(data.items) ? data.items : []);
        } else {
          setDynamicResults([]);
        }
      } catch (err) {
        console.error("Global search request failed:", err);
        setDynamicResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [query, open, isEmployee, basePath]);

  // Combine static matching pages + live server results
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staticPages; // Default: show all main navigation pages

    // Substring match for offline navigation pages
    const matchedPages = staticPages.filter((p) => {
      const titleStr = p.title.toLowerCase();
      const subStr = p.subtitle.toLowerCase();
      const kwStr = (p.keywords || []).join(" ").toLowerCase();
      return titleStr.includes(q) || subStr.includes(q) || kwStr.includes(q);
    });

    // Deduplicate and return matched pages first, followed by dynamic server search results
    const combined = [...matchedPages, ...dynamicResults];
    const seen = new Set<string>();
    return combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [query, staticPages, dynamicResults]);

  // Reset index selection when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredItems]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[activeIndex];
      if (selected) {
        handleNavigate(selected.url);
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const handleNavigate = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  const getTypeBadge = (type: SearchItem["type"]) => {
    switch (type) {
      case "page":
        return <Badge variant="outline" className="bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20">Navigation</Badge>;
      case "case":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Legal Case</Badge>;
      case "employee":
        return <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20">Staff Profile</Badge>;
      case "task":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">Task</Badge>;
      case "project":
        return <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20">Project</Badge>;
      case "crm":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20">CRM</Badge>;
      case "announcement":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Announcement</Badge>;
      case "equipment":
        return <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Equipment</Badge>;
      case "website":
        return <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/20">Website</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20">Result</Badge>;
    }
  };

  const getTypeIcon = (type: SearchItem["type"]) => {
    switch (type) {
      case "page":
        return <FileText className="h-4 w-4 text-[#818cf8]" />;
      case "case":
        return <Briefcase className="h-4 w-4 text-emerald-400" />;
      case "employee":
        return <Users className="h-4 w-4 text-sky-400" />;
      case "task":
        return <ListTodo className="h-4 w-4 text-amber-400" />;
      case "project":
        return <FolderKanban className="h-4 w-4 text-violet-400" />;
      case "crm":
        return <Building2 className="h-4 w-4 text-rose-400" />;
      case "announcement":
        return <Megaphone className="h-4 w-4 text-purple-400" />;
      case "equipment":
        return <Truck className="h-4 w-4 text-cyan-400" />;
      case "website":
        return <Globe className="h-4 w-4 text-teal-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-[#0F172A]/95 border border-white/10 backdrop-blur-xl shadow-2xl rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Task Manager</DialogTitle>
          <DialogDescription>Search across tasks, projects, staff, legal cases, and system pages.</DialogDescription>
        </DialogHeader>
        {/* Search Input Area */}
        <div className="relative border-b border-white/10 flex items-center p-3.5">
          <SearchIcon className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEmployee ? "Search tasks, projects, announcements, pages..." : "Search tasks, projects, staff, legal cases, CRM, equipment..."}
            className="flex-1 bg-transparent text-white border-0 outline-none placeholder-slate-400 text-base"
          />
          {loading ? (
            <Loader2 className="h-4.5 w-4.5 text-slate-400 animate-spin shrink-0 ml-2" />
          ) : query ? (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-white shrink-0 ml-2 transition-colors">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-slate-400 font-mono shrink-0 select-none hidden sm:block">
              ESC
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No matching results found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNavigate(item.url)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-150 group ${
                    isSelected
                      ? "bg-white/[0.07] border-l-2 border-primary/80 pl-3"
                      : "hover:bg-white/[0.03] border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg transition-colors duration-150 ${
                        isSelected ? "bg-white/10" : "bg-white/[0.04]"
                      }`}
                    >
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white leading-snug group-hover:text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-xs text-slate-400 leading-normal truncate mt-0.5">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getTypeBadge(item.type)}
                    {isSelected && (
                      <span className="text-slate-400 text-[10px] bg-white/5 px-1 py-0.5 rounded flex items-center gap-0.5">
                        <CornerDownLeft className="h-2.5 w-2.5" />
                        <span>Enter</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-white/5 bg-black/30 p-2.5 px-4 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">↑↓</span> Arrow keys
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">Enter</span> Select
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-wide opacity-50">Real-time Global Search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
