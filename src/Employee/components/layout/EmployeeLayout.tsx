import { useState } from "react";
import { Outlet } from "react-router-dom";
import { EmployeeSidebar } from "./EmployeeSidebar";
import { EmployeeHeader } from "./EmployeeHeader";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function EmployeeLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#e6f0ff] pt-20 sm:pt-24 md:pt-36">
      <EmployeeHeader onMenuClick={() => setMobileSidebarOpen(true)} />

      <div className="flex">
        <div className="hidden md:block">
          <EmployeeSidebar />
        </div>

        <main className={cn("flex-1 min-h-[calc(100vh-9rem)]", "md:ml-20")}>
          <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <EmployeeSidebar mode="mobile" onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
