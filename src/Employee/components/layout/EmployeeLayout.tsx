import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { EmployeeSidebar } from "./EmployeeSidebar";
import { EmployeeHeader } from "./EmployeeHeader";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TaskBlaster } from "@/components/shared/TaskBlaster";
import { deliverVideoMessage, acknowledgeVideoMessage, employeeApiFetch } from "@/Employee/lib/api";
import { applyFullTheme, themeDefaults } from "@/Employee/lib/theme";
import { VideoMessageModal, type VideoMessagePayload } from "@/Employee/components/VideoMessageModal";

export function EmployeeLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashboardBg, setDashboardBg] = useState("var(--tb-dashboard-bg, #e6f0ff)");
  const [pendingVideo, setPendingVideo] = useState<VideoMessagePayload | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoDeliveryId, setVideoDeliveryId] = useState<string | null>(null);

  // Apply user UI preferences on load - same as AdminLayout (full applyThemeToDOM)
  useEffect(() => {
    employeeApiFetch<{item: { theme?: string; cardStyle?: string; customColors?: { textColor?: string } }}>("/api/ui-preferences").then(res => {
      const theme = res?.item?.theme || "dark-minimal";
      const cardStyle = res?.item?.cardStyle || "glass";
      const textColor = res?.item?.customColors?.textColor;
      applyFullTheme(theme, textColor || themeDefaults[theme], cardStyle);
    }).catch(() => {
      // Fallback to dark-minimal
      applyFullTheme("dark-minimal");
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const deliverPendingVideo = async () => {
      try {
        const response = await deliverVideoMessage();
        if (!mounted || !response?.item?.videoUrl) return;
        setPendingVideo(response.item);
        setVideoDeliveryId(response.item.deliveryId || null);
        setVideoModalOpen(true);
      } catch {
        // Ignore missing or failed delivery
      }
    };
    void deliverPendingVideo();
    return () => {
      mounted = false;
    };
  }, []);

  const acknowledgeVideo = async (responseText: string, watchDuration: number, replayCount: number) => {
    if (!videoDeliveryId) return;
    try {
      await acknowledgeVideoMessage(videoDeliveryId, responseText, watchDuration, replayCount);
    } finally {
      setVideoModalOpen(false);
      setPendingVideo(null);
      setVideoDeliveryId(null);
    }
  };

  // Update dashboard background when CSS variable changes
  useEffect(() => {
    const updateDashboardBg = () => {
      // Get from body since theme CSS variables are scoped to body[class*="tb-theme-"]
      const bg = getComputedStyle(document.body).getPropertyValue("--tb-dashboard-bg").trim() || "#e6f0ff";
      setDashboardBg(bg);
      console.log("Dashboard background from CSS variable:", bg);
    };
    
    updateDashboardBg();
    
    // Listen for theme changes on body (theme class changes)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          updateDashboardBg();
        }
      });
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="min-h-screen tb-employee-panel pt-40 sm:pt-[220px] md:pt-[300px]"
      style={{ background: dashboardBg }}
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

      {/* Executive Video Message Modal */}
      <VideoMessageModal
        isOpen={videoModalOpen}
        videoMessage={pendingVideo}
        deliveryId={videoDeliveryId || undefined}
        onClose={() => {
          setVideoModalOpen(false);
          setPendingVideo(null);
          setVideoDeliveryId(null);
        }}
        onAcknowledge={acknowledgeVideo}
      />

      {/* Task Blaster Animation Overlay */}
      <TaskBlaster />
    </div>
  );
}
