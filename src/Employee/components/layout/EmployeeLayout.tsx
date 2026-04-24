import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { EmployeeSidebar } from "./EmployeeSidebar";
import { EmployeeHeader } from "./EmployeeHeader";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TaskBlaster } from "@/components/shared/TaskBlaster";

export function EmployeeLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const headerHeight = 300;
  const [dashboardBg, setDashboardBg] = useState("var(--tb-dashboard-bg, #e6f0ff)");

  // Update dashboard background when CSS variable changes
  useEffect(() => {
    const updateDashboardBg = () => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--tb-dashboard-bg").trim() || "#e6f0ff";
      setDashboardBg(bg);
      console.log("Dashboard background from CSS variable:", bg);
    };
    
    updateDashboardBg();
    
    // Listen for theme changes
    const observer = new MutationObserver(updateDashboardBg);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ paddingTop: `${headerHeight}px`, background: dashboardBg }}
    >
      <EmployeeHeader onMenuClick={() => setMobileSidebarOpen(true)} />

      <div className="flex">
        <div className="hidden md:block">
          <EmployeeSidebar />
        </div>

        <main className={cn("flex-1 min-h-[calc(100vh-9rem)]", "md:ml-56")}>
          <div className="w-full px-4 py-4 sm:py-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation for employees</SheetDescription>
          </SheetHeader>
          <EmployeeSidebar mode="mobile" onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Task Blaster Animation Overlay */}
      <TaskBlaster />
    </div>
  );
}
