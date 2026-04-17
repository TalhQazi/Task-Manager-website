import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { EmployeeSidebar } from "./EmployeeSidebar";
import { EmployeeHeader } from "./EmployeeHeader";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TaskBlaster } from "@/components/shared/TaskBlaster";

export function EmployeeLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(250);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setHeaderHeight(120);
      } else if (window.innerWidth < 1024) {
        setHeaderHeight(180);
      } else {
        setHeaderHeight(250);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#e6f0ff]" style={{ paddingTop: `${headerHeight + 10}px` }}>
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
