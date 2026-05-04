import { ReactNode, useState, useEffect, createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getAuthState } from "@/lib/auth";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const auth = getAuthState();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(300);
  const [pageKey, setPageKey] = useState(0);

  const [headerKey, setHeaderKey] = useState(0);

  // Apply user UI preferences on load
  useEffect(() => {
    import("@/lib/admin/apiClient").then(({ apiFetch }) => {
      apiFetch<{item: any}>("/api/ui-preferences").then(res => {
        if (res?.item?.theme) {
          const classes = Array.from(document.body.classList);
          classes.forEach(c => {
            if (c.startsWith('tb-theme-')) document.body.classList.remove(c);
          });
          document.body.classList.add(`tb-theme-${res.item.theme}`);
        }
        if (res?.item?.cardStyle) {
          document.body.setAttribute("data-tb-card-style", res.item.cardStyle);
        }
        
        document.body.style.backgroundColor = '';
        if (res?.item?.customColors?.textColor) {
          document.documentElement.style.setProperty("--tb-dashboard-text-color", res.item.customColors.textColor);
          document.body.style.color = res.item.customColors.textColor;
        } else {
          document.documentElement.style.removeProperty("--tb-dashboard-text-color");
          document.body.style.color = '';
        }
      }).catch(() => {
        // Fallback to dark-minimal
        document.body.classList.add('tb-theme-dark-minimal');
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
      });
    });
  }, []);

  // Trigger page transition animation on route change
  useEffect(() => {
    setPageKey(prev => prev + 1);
  }, [location.pathname]);

  // Listen for header settings updates to force re-render
  useEffect(() => {
    const handleUpdate = () => {
      setHeaderKey(prev => prev + 1);
    };
    window.addEventListener("header-settings-updated", handleUpdate);
    return () => window.removeEventListener("header-settings-updated", handleUpdate);
  }, []);

  // Socket notifications listener
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: any) => {
      // Check if this notification is for me
      const me = String(auth.username || auth.name || "").trim();
      const myRole = String(auth.role || "").trim();
      const recipients = String(data.recipient || "").split(",").map(s => s.trim());
      
      const isForMe = recipients.includes(me) || 
                      recipients.includes(myRole) || 
                      myRole === "super-admin" || 
                      myRole === "admin";

      if (isForMe) {
        // Refresh notifications count
        queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        
        // Show toast
        toast(data.title || "New Notification", {
          description: data.content || data.message,
          action: {
            label: "View",
            onClick: () => navigate("/admin/notifications")
          }
        });
      }
    };

    socket.on("new-notification", handleNotification);
    return () => {
      socket.off("new-notification", handleNotification);
    };
  }, [socket, auth, queryClient, navigate]);

  return (
    <HeaderHeightContext.Provider value={headerHeight}>
      <div 
        className="min-h-screen overflow-x-hidden flex flex-col bg-[var(--tb-dashboard-bg)]" 
        style={{ 
          paddingTop: `${headerHeight}px`, 
          '--header-height': `${headerHeight}px`,
          backgroundColor: 'var(--tb-dashboard-bg)'
        } as React.CSSProperties}
      >
        <Header key={headerKey} onMenuClick={() => setMobileSidebarOpen(true)} />
        

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