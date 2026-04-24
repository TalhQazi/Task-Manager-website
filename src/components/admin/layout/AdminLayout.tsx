import { ReactNode, useState, useEffect, createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TaskBlaster } from "@/components/shared/TaskBlaster";
import { ReleaseNotes } from "@/components/admin/ReleaseNotes";


// Context to share header height across components
const HeaderHeightContext = createContext<number>(300);

export function useHeaderHeight() {
  return useContext(HeaderHeightContext);
}

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(300);
  const [pageKey, setPageKey] = useState(0);


  // Clear any theme classes from body when in Admin panel to ensure standard text visibility
  useEffect(() => {
    const classes = Array.from(document.body.classList);
    classes.forEach(c => {
      if (c.startsWith('tb-theme-')) document.body.classList.remove(c);
    });
    // Ensure standard background for the body
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }, []);

  // Trigger page transition animation on route change
  useEffect(() => {
    setPageKey(prev => prev + 1);
  }, [location.pathname]);

  // Listen for header height updates
  useEffect(() => {
    const handleHeightUpdate = (e: CustomEvent) => {
      setHeaderHeight(e.detail?.height || 300);
    };
    window.addEventListener("header-height-changed", handleHeightUpdate as EventListener);
    return () => window.removeEventListener("header-height-changed", handleHeightUpdate as EventListener);
  }, []);

  return (
    <HeaderHeightContext.Provider value={headerHeight}>
      <div 
        className="min-h-screen overflow-x-hidden flex flex-col bg-slate-50" 
        style={{ 
          paddingTop: `${headerHeight}px`, 
          '--header-height': `${headerHeight}px`
        } as React.CSSProperties}
      >
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        

        <div className="flex flex-1 items-start relative w-full overflow-y-auto overflow-x-hidden">
          <div className="hidden md:block fixed left-0 z-40 w-56 border-r border-white/5 shadow-2xl transition-all duration-300" style={{ top: `${headerHeight}px`, height: `calc(100vh - ${headerHeight}px)` } as React.CSSProperties}>
            <Sidebar />
          </div>

          <main className={cn("flex-1 px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 min-w-0 w-full min-h-[calc(100vh-var(--header-height,300px))] flex flex-col", "md:ml-56")}>
            <div key={pageKey} className="w-full max-w-[1600px] mx-auto animate-page-enter flex-1 flex flex-col">
              {children}
            </div>
          </main>
        </div>

        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar mode="mobile" onNavigate={() => setMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* TaskBlaster overlay for celebrations */}
        <TaskBlaster />

        {/* Release Notes for new versions */}
        <ReleaseNotes />
      </div>
    </HeaderHeightContext.Provider>
  );
}