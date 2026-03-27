import { ReactNode, useState, useEffect, createContext, useContext } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// Context to share header height across components
const HeaderHeightContext = createContext<number>(250);

export function useHeaderHeight() {
  return useContext(HeaderHeightContext);
}

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(250);

  // Listen for header height updates
  useEffect(() => {
    const handleHeightUpdate = (e: CustomEvent) => {
      setHeaderHeight(e.detail?.height || 250);
    };
    window.addEventListener("header-height-changed", handleHeightUpdate as EventListener);
    return () => window.removeEventListener("header-height-changed", handleHeightUpdate as EventListener);
  }, []);

  return (
    <HeaderHeightContext.Provider value={headerHeight}>
      <div className="min-h-screen bg-[#e6f0ff]" style={{ paddingTop: `${headerHeight}px` }}>
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        <div className="flex items-start">
          <div className="hidden md:block fixed left-0 z-40 w-56 border-r border-white/5 shadow-2xl transition-all duration-300" style={{ top: `${headerHeight}px`, height: `calc(100vh - ${headerHeight}px)`, '--header-height': `${headerHeight}px` } as React.CSSProperties}>
            <Sidebar />
          </div>

          <main className={cn("flex-1 px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300", "md:ml-56")}>
            <div className="w-full max-w-full animate-fade-in">
              {children}
            </div>
          </main>
        </div>

        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar mode="mobile" onNavigate={() => setMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </HeaderHeightContext.Provider>
  );
}