import { useState } from "react";
import { Outlet } from "react-router-dom";
import { EmployeeSidebar } from "./EmployeeSidebar";
import { EmployeeHeader } from "./EmployeeHeader";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TaskBlaster } from "@/components/shared/TaskBlaster";

export function EmployeeLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const headerHeight = 300;

  return (
    <div
      className="min-h-screen"
      style={{ paddingTop: `${headerHeight}px`, background: "var(--tb-dashboard-bg)" }}
    >
      <div className="tb-employee-header-wrapper">
        <EmployeeHeader onMenuClick={() => setMobileSidebarOpen(true)} />
      </div>

      <div className="flex">
        <div className="hidden md:block tb-employee-sidebar-wrapper">
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
