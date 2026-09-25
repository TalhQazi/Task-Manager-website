import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/admin/ui/button";
import {
  Palette,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  Monitor,
  Tablet,
  Smartphone,
  Shield,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  Gauge,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useTheme } from "@/contexts/ThemeContext";
import { useActiveTheme } from "@/theme-engine/ThemeEngineContext";
import { HALLOWEEN_2026_MANIFEST } from "@/theme-engine/manifests/halloween2026";
import { PATRIOTIC_JULY4_MANIFEST } from "@/theme-engine/manifests/patrioticJuly4";
import { WINTER_2026_MANIFEST } from "@/theme-engine/manifests/winter2026";
import { SPRING_2026_MANIFEST } from "@/theme-engine/manifests/spring2026";
import { DEFAULT_NEUTRAL_MANIFEST } from "@/theme-engine/manifests/defaultNeutral";

export interface ThemeAssetItem {
  _id: string;
  themeKey: string;
  role: string;
  viewport: string;
  cdnUrl: string;
  format: string;
  fileSizeBytes: number;
  createdAt: string;
}

interface ThemeScheduleItem {
  _id?: string;
  themeKey: string;
  scheduleType: "fixedAnnual" | "range" | "calculated";
  startDate?: string;
  endDate?: string;
  annualMonthDay?: {
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
  };
  timezone: string;
  priority: number;
  isActive: boolean;
}

interface OrgSettingsData {
  orgId: string;
  enforceOrgTheme: boolean;
  forcedThemeKey: string | null;
  allowedThemeKeys: string[];
  allowUserOverride: boolean;
  disableAnimations: boolean;
}

interface AuditLogItem {
  _id: string;
  action: string;
  targetType: string;
  targetKey: string;
  performedBy: string;
  timestamp: string;
}

export default function ThemeEngine() {
  const [activeTab, setActiveTab] = useState<"holiday" | "presets">("holiday");

  // --- Context from Holiday Theme Engine ---
  const {
    activeTheme,
    currentFps,
    isPerformanceDegraded,
    userOverrideKey,
    setThemeOverride,
    refetchActiveTheme,
  } = useActiveTheme();

  // --- Context from legacy ThemeContext ---
  const { uiTheme, updateTheme } = useTheme();

  // --- Holiday Studio State ---
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [schedules, setSchedules] = useState<ThemeScheduleItem[]>([]);
  const [orgSettings, setOrgSettings] = useState<OrgSettingsData>({
    orgId: "default",
    enforceOrgTheme: false,
    forcedThemeKey: null,
    allowedThemeKeys: [],
    allowUserOverride: true,
    disableAnimations: false,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [assetsList, setAssetsList] = useState<ThemeAssetItem[]>([]);
  const [assetFilterTheme, setAssetFilterTheme] = useState<string>("all");
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [assetUploadForm, setAssetUploadForm] = useState<{
    themeKey: string;
    role: string;
    viewport: string;
    file: File | null;
  }>({
    themeKey: "spring-bloom-2026",
    role: "background",
    viewport: "desktop",
    file: null,
  });

  const [isSeeding, setIsSeeding] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [studioMessage, setStudioMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal for new schedule
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<Partial<ThemeScheduleItem>>({
    themeKey: "halloween-2026",
    scheduleType: "fixedAnnual",
    annualMonthDay: { startMonth: 10, startDay: 15, endMonth: 11, endDay: 2 },
    priority: 80,
    isActive: true,
  });

  // --- Legacy UI Theme Presets State ---
  const themeDefaults: Record<string, string> = {
    "dark-minimal": "#f8fafc",
    "neon-tech": "#e0f7fa",
    "metallic-elite": "#d4af37",
    "executive-black": "#f3f4f6",
    "high-contrast": "#ffffff",
    "energy-mode": "#ffedd5",
    "crystal-white": "#000000",
  };
  const legacyThemes = [
    { id: "dark-minimal", name: "Dark Minimal" },
    { id: "neon-tech", name: "Neon Tech" },
    { id: "metallic-elite", name: "Metallic Elite" },
    { id: "executive-black", name: "Executive Black" },
    { id: "high-contrast", name: "High Contrast" },
    { id: "energy-mode", name: "Energy Mode" },
    { id: "crystal-white", name: "Crystal White" },
  ];
  const cardStyles = [
    { id: "glass", name: "Glassmorphism" },
    { id: "metallic", name: "Metallic" },
    { id: "neon", name: "Neon Glow" },
    { id: "flat", name: "Flat Default" },
  ];
  const [activeThemeId, setActiveThemeId] = useState(uiTheme.theme);
  const [activeCardStyle, setActiveCardStyle] = useState(uiTheme.cardStyle);
  const [customTextColor, setCustomTextColor] = useState(
    uiTheme.customColors?.textColor || themeDefaults[uiTheme.theme] || "#ffffff"
  );
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [legacySaveSuccess, setLegacySaveSuccess] = useState(false);

  // Fetch schedules, org settings, audit logs, and uploaded theme assets
  const loadHolidayData = useCallback(async () => {
    try {
      const [schedRes, orgRes, logRes, assetRes] = await Promise.all([
        fetch("/api/themes/schedules").then((r) => (r.ok ? r.json() : { ok: false })),
        fetch("/api/themes/org-settings").then((r) => (r.ok ? r.json() : { ok: false })),
        fetch("/api/themes/audit-logs").then((r) => (r.ok ? r.json() : { ok: false })),
        fetch("/api/themes/assets").then((r) => (r.ok ? r.json() : { ok: false })),
      ]);

      if (schedRes.ok && Array.isArray(schedRes.schedules)) {
        setSchedules(schedRes.schedules);
      }
      if (orgRes.ok && orgRes.settings) {
        setOrgSettings(orgRes.settings);
      }
      if (logRes.ok && Array.isArray(logRes.logs)) {
        setAuditLogs(logRes.logs);
      }
      if (assetRes.ok && Array.isArray(assetRes.assets)) {
        setAssetsList(assetRes.assets);
      }
    } catch (err) {
      console.error("[ThemeStudio] Error loading theme data:", err);
    }
  }, []);

  useEffect(() => {
    void loadHolidayData();
  }, [loadHolidayData]);

  // Handle re-seeding default manifests
  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    setStudioMessage(null);
    try {
      const res = await fetch("/api/themes/seed", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setStudioMessage({ type: "success", text: `Seeded ${json.count} holiday themes successfully!` });
        await loadHolidayData();
        await refetchActiveTheme();
      } else {
        throw new Error(json.error?.message || "Failed to seed themes");
      }
    } catch (err: any) {
      setStudioMessage({ type: "error", text: err.message || "Seed failed" });
    } finally {
      setIsSeeding(false);
      setTimeout(() => setStudioMessage(null), 4000);
    }
  };

  // Handle saving Org Settings
  const handleSaveOrgSettings = async () => {
    setIsSavingOrg(true);
    setStudioMessage(null);
    try {
      const res = await fetch("/api/themes/org-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgSettings),
      });
      const json = await res.json();
      if (json.ok) {
        setStudioMessage({ type: "success", text: "Organization theme policy updated!" });
        await loadHolidayData();
        await refetchActiveTheme();
      } else {
        throw new Error(json.error?.message || "Failed to update org policy");
      }
    } catch (err: any) {
      setStudioMessage({ type: "error", text: err.message || "Save failed" });
    } finally {
      setIsSavingOrg(false);
      setTimeout(() => setStudioMessage(null), 4000);
    }
  };

  // Handle creating a new schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/themes/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });
      const json = await res.json();
      if (json.ok) {
        setIsScheduleModalOpen(false);
        setStudioMessage({ type: "success", text: "Schedule window created successfully!" });
        await loadHolidayData();
        await refetchActiveTheme();
      } else {
        throw new Error(json.error?.message || "Failed to create schedule");
      }
    } catch (err: any) {
      alert(err.message || "Schedule error");
    }
  };

  // Handle deleting a schedule
  const handleDeleteSchedule = async (id?: string) => {
    if (!id || !confirm("Are you sure you want to delete this schedule window?")) return;
    try {
      const res = await fetch(`/api/themes/schedules/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setStudioMessage({ type: "success", text: "Schedule removed." });
        await loadHolidayData();
        await refetchActiveTheme();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle uploading theme asset
  const handleUploadAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetUploadForm.file) {
      alert("Please choose an image file to upload.");
      return;
    }
    setIsUploadingAsset(true);
    try {
      const formData = new FormData();
      formData.append("file", assetUploadForm.file);
      formData.append("themeKey", assetUploadForm.themeKey);
      formData.append("role", assetUploadForm.role);
      formData.append("viewport", assetUploadForm.viewport);

      const res = await apiFetch<{ ok: boolean; asset?: ThemeAssetItem }>("/api/themes/assets/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setIsAssetModalOpen(false);
        setAssetUploadForm({
          themeKey: "spring-bloom-2026",
          role: "background",
          viewport: "desktop",
          file: null,
        });
        setStudioMessage({ type: "success", text: "Theme asset uploaded and registered successfully!" });
        await loadHolidayData();
        await refetchActiveTheme();
      } else {
        throw new Error("Failed to upload theme asset");
      }
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setIsUploadingAsset(false);
    }
  };

  // Handle deleting an asset
  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this theme asset?")) return;
    try {
      const res = await apiFetch<{ ok: boolean }>(`/api/themes/assets/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStudioMessage({ type: "success", text: "Asset removed successfully." });
        await loadHolidayData();
        await refetchActiveTheme();
      }
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  // Legacy Theme Handler
  const handlePreviewLegacyTheme = (themeId: string) => {
    const defaultColor = themeDefaults[themeId] || "#ffffff";
    setActiveThemeId(themeId as typeof uiTheme.theme);
    setCustomTextColor(defaultColor);
    setLegacySaveSuccess(false);
    updateTheme({
      theme: themeId as typeof uiTheme.theme,
      customColors: { ...uiTheme.customColors, textColor: defaultColor },
    });
  };

  const handlePreviewLegacyCardStyle = (styleId: string) => {
    setActiveCardStyle(styleId as typeof uiTheme.cardStyle);
    setLegacySaveSuccess(false);
    updateTheme({ cardStyle: styleId as typeof uiTheme.cardStyle });
  };

  const saveLegacySettings = async () => {
    setLegacyLoading(true);
    setLegacySaveSuccess(false);
    try {
      await apiFetch("/api/ui-preferences", {
        method: "PUT",
        body: JSON.stringify({
          theme: activeThemeId,
          cardStyle: activeCardStyle,
          customColors: { textColor: customTextColor },
        }),
      });
      setLegacySaveSuccess(true);
      setTimeout(() => setLegacySaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLegacyLoading(false);
    }
  };

  const holidayManifests = [
    HALLOWEEN_2026_MANIFEST,
    PATRIOTIC_JULY4_MANIFEST,
    WINTER_2026_MANIFEST,
    SPRING_2026_MANIFEST,
    DEFAULT_NEUTRAL_MANIFEST,
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Theme Studio & Skinning Engine</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Design, schedule, and orchestrate layered seasonal holiday experiences across Task Manager®.
            </p>
          </div>
        </div>

        {/* Tab Switcher & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border">
            <button
              onClick={() => setActiveTab("holiday")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "holiday"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              Holiday Engine
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "presets"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette className="w-4 h-4 text-blue-400" />
              Base UI Presets
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {studioMessage && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm animate-in fade-in slide-in-from-top-2 ${
            studioMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border-rose-500/30 text-rose-400"
          }`}
        >
          {studioMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{studioMessage.text}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: HOLIDAY THEME STUDIO
          ========================================================================= */}
      {activeTab === "holiday" && (
        <div className="space-y-8">
          {/* Active Status & Telemetry Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Active Resolved Theme</span>
                <p className="font-bold text-base mt-0.5">{activeTheme.displayName}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize">
                {activeTheme.category}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Display Mode</span>
                <p className="font-bold text-base mt-0.5">
                  {userOverrideKey === "auto" ? "Automatic Date Window" : `Override (${userOverrideKey})`}
                </p>
              </div>
              <Clock className="w-5 h-5 text-blue-400 opacity-80" />
            </div>

            <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Frame Rate Telemetry</span>
                <p className="font-bold text-base mt-0.5 flex items-center gap-1.5 font-mono">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  {currentFps} FPS
                </p>
              </div>
              {isPerformanceDegraded ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Throttled
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  60 FPS Solid
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Org Policy Status</span>
                <p className="font-bold text-base mt-0.5">
                  {orgSettings.enforceOrgTheme ? "Enforced Org Theme" : "User Choice Allowed"}
                </p>
              </div>
              <Shield className="w-5 h-5 text-purple-400 opacity-80" />
            </div>
          </div>

          {/* Live Device Preview Sandbox */}
          <div className="p-6 rounded-2xl bg-card border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-amber-400" />
                  Live Layered Rendering Sandbox
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inspect the 10-layer z-index frame, atmosphere wash, and card borders across devices.
                </p>
              </div>

              {/* Viewport device buttons */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    previewDevice === "desktop" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice("tablet")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    previewDevice === "tablet" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" /> Tablet
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    previewDevice === "mobile" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </div>

            {/* Sandbox Viewport Stage */}
            <div className="flex justify-center p-4 rounded-xl bg-black/40 overflow-x-auto min-h-[360px] items-center">
              <div
                className="relative overflow-hidden rounded-xl border shadow-2xl transition-all duration-300 flex flex-col"
                style={{
                  width: previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? "768px" : "380px",
                  height: previewDevice === "desktop" ? "380px" : previewDevice === "tablet" ? "420px" : "480px",
                  maxWidth: "100%",
                  backgroundColor: activeTheme.palette.backgroundBase,
                  borderColor: activeTheme.palette.cardBorder,
                }}
              >
                {/* Simulated Header Banner */}
                {activeTheme.layout.enableHeaderBanner && (
                  <div
                    className="w-full relative overflow-hidden flex items-center justify-between px-6 shrink-0"
                    style={{
                      height: previewDevice === "mobile" ? 48 : 64,
                      backgroundColor: "rgba(0,0,0,0.45)",
                      borderBottom: `1px solid ${activeTheme.palette.cardBorder}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm tracking-wider" style={{ color: activeTheme.palette.accent }}>
                        TASK MANAGER®
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-white/10 text-white">
                        {activeTheme.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-white/80 font-mono">60 FPS</span>
                    </div>
                  </div>
                )}

                {/* Simulated Sandbox Content & Cards */}
                <div className="flex-1 p-6 relative z-10 flex flex-col justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div
                      className="p-4 rounded-xl border backdrop-blur-md"
                      style={{
                        backgroundColor: activeTheme.palette.surfaceTint || "rgba(255,255,255,0.05)",
                        borderColor: activeTheme.palette.cardBorder,
                        boxShadow: activeTheme.palette.cardGlow,
                      }}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Sprint Velocity
                      </span>
                      <h4 className="text-2xl font-extrabold mt-1" style={{ color: activeTheme.palette.textColor }}>
                        98.4%
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1">On schedule for Q3 milestone.</p>
                    </div>

                    <div
                      className="p-4 rounded-xl border backdrop-blur-md"
                      style={{
                        backgroundColor: activeTheme.palette.surfaceTint || "rgba(255,255,255,0.05)",
                        borderColor: activeTheme.palette.cardBorder,
                        boxShadow: activeTheme.palette.cardGlow,
                      }}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Tasks Completed
                      </span>
                      <h4 className="text-2xl font-extrabold mt-1" style={{ color: activeTheme.palette.accent }}>
                        142 / 160
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1">Seasonal theme active.</p>
                    </div>

                    {previewDevice !== "mobile" && (
                      <div
                        className="p-4 rounded-xl border backdrop-blur-md"
                        style={{
                          backgroundColor: activeTheme.palette.surfaceTint || "rgba(255,255,255,0.05)",
                          borderColor: activeTheme.palette.cardBorder,
                          boxShadow: activeTheme.palette.cardGlow,
                        }}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Theme Engine Token
                        </span>
                        <h4 className="text-xl font-mono mt-1" style={{ color: activeTheme.palette.accent2 }}>
                          {activeTheme.palette.accent}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1">WCAG 4.5:1 compliant</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4">
                    <span>Preview Stage: {previewDevice.toUpperCase()} Viewport</span>
                    <span className="font-mono">z-index: 0 to 1000+ active</span>
                  </div>
                </div>

                {/* Bottom foreground aesthetic bar */}
                {activeTheme.layout.enableBottomForeground && (
                  <div
                    className="h-4 w-full"
                    style={{
                      backgroundColor: activeTheme.palette.accent,
                      opacity: 0.25,
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Holiday Theme Catalog */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Theme Manifest Catalog</h3>
                <p className="text-xs text-muted-foreground">
                  Simulate any seasonal manifest on the fly or view token metrics.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
                {isSeeding ? "Seeding..." : "Re-Seed Default Manifests"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {holidayManifests.map((m) => {
                const isSelected = activeTheme.themeKey === m.themeKey;
                return (
                  <div
                    key={m.themeKey}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-card border-amber-500/50 shadow-md ring-1 ring-amber-500/30"
                        : "bg-card/60 hover:bg-card border-border"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {m.category}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-foreground">{m.displayName}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>

                      {/* Swatch Previews */}
                      <div className="flex items-center gap-1.5 mt-4">
                        <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: m.palette.primary }} title={`Primary: ${m.palette.primary}`} />
                        <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: m.palette.secondary }} title={`Secondary: ${m.palette.secondary}`} />
                        <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: m.palette.accent }} title={`Accent: ${m.palette.accent}`} />
                        <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: m.palette.accent2 }} title={`Accent2: ${m.palette.accent2}`} />
                        <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: m.palette.backgroundBase }} title={`BgBase: ${m.palette.backgroundBase}`} />
                      </div>

                      {/* Metrics */}
                      <div className="mt-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Particles:</span>
                          <span className="capitalize font-mono">{m.animations.particleType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Side Frames:</span>
                          <span>{m.layout.enableSideFrames ? `${m.layout.sideFrameWidth}px` : "Disabled"}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setThemeOverride(m.themeKey)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="mt-4 w-full text-xs font-semibold"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {isSelected ? "Live Active" : "Simulate Skin"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Manager & Org Policy (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule Manager (2 Cols) */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-card border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base">Annual & Calendar Schedules</h3>
                </div>
                <Button size="sm" onClick={() => setIsScheduleModalOpen(true)} className="text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Schedule Window
                </Button>
              </div>

              {schedules.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No active schedules found. Click "Re-Seed Default Manifests" to initialize defaults.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground uppercase text-[10px] tracking-wider">
                        <th className="py-2.5">Theme Key</th>
                        <th className="py-2.5">Type</th>
                        <th className="py-2.5">Window / Month-Day</th>
                        <th className="py-2.5">Priority</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {schedules.map((s) => (
                        <tr key={s._id || s.themeKey} className="hover:bg-muted/40">
                          <td className="py-3 font-semibold text-foreground">{s.themeKey}</td>
                          <td className="py-3 capitalize text-muted-foreground">{s.scheduleType}</td>
                          <td className="py-3 font-mono">
                            {s.scheduleType === "fixedAnnual" && s.annualMonthDay
                              ? `${s.annualMonthDay.startMonth}/${s.annualMonthDay.startDay} → ${s.annualMonthDay.endMonth}/${s.annualMonthDay.endDay}`
                              : s.startDate && s.endDate
                              ? `${new Date(s.startDate).toLocaleDateString()} → ${new Date(s.endDate).toLocaleDateString()}`
                              : "Always Active"}
                          </td>
                          <td className="py-3 font-mono font-bold text-amber-400">{s.priority}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {s.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteSchedule(s._id)}
                              className="text-muted-foreground hover:text-rose-400 p-1"
                              title="Delete Schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Org-Wide Policy Card (1 Col) */}
            <div className="p-6 rounded-2xl bg-card border shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base">Org Policy Controls</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={orgSettings.enforceOrgTheme}
                      onChange={(e) => setOrgSettings({ ...orgSettings, enforceOrgTheme: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    Enforce Specific Theme Org-Wide
                  </label>
                  <p className="text-muted-foreground text-[11px] pl-5">
                    Locks the skin for all workspace members regardless of schedule.
                  </p>
                </div>

                {orgSettings.enforceOrgTheme && (
                  <div className="pl-5 space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Forced Theme Key</label>
                    <select
                      value={orgSettings.forcedThemeKey || "halloween-2026"}
                      onChange={(e) => setOrgSettings({ ...orgSettings, forcedThemeKey: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border bg-background text-xs"
                    >
                      <option value="halloween-2026">halloween-2026 (Halloween)</option>
                      <option value="patriotic-july4">patriotic-july4 (July 4th)</option>
                      <option value="winter-wonderland-2026">winter-wonderland-2026 (Winter)</option>
                      <option value="spring-bloom-2026">spring-bloom-2026 (Spring Bloom)</option>
                      <option value="default-neutral">default-neutral (Clean)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t">
                  <label className="font-semibold text-foreground flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={orgSettings.allowUserOverride}
                      onChange={(e) => setOrgSettings({ ...orgSettings, allowUserOverride: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    Allow User Personal Overrides
                  </label>
                  <p className="text-muted-foreground text-[11px] pl-5">
                    Permits individual members to toggle skins or switch to Neutral.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t">
                  <label className="font-semibold text-foreground flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={orgSettings.disableAnimations}
                      onChange={(e) => setOrgSettings({ ...orgSettings, disableAnimations: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    Disable All Seasonal Animations
                  </label>
                  <p className="text-muted-foreground text-[11px] pl-5">
                    Keeps colors & framing but turns off particles org-wide.
                  </p>
                </div>

                <Button
                  onClick={handleSaveOrgSettings}
                  disabled={isSavingOrg}
                  size="sm"
                  className="w-full mt-4 text-xs font-semibold"
                >
                  {isSavingOrg ? "Saving Policy..." : "Update Org Policy"}
                </Button>
              </div>
            </div>
          </div>

          {/* Theme Asset Repository */}
          <div className="p-6 rounded-2xl bg-card border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">Theme Asset Repository</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload, organize, and view custom high-res assets (backgrounds, banners, frames, transient sprites).
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAssetModalOpen(true)}
                className="text-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload New Asset
              </Button>
            </div>

            {/* Filter Tabs by Theme */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              {[
                { key: "all", label: "All Themes" },
                { key: "halloween-2026", label: "Spooky Twilight" },
                { key: "patriotic-july4", label: "Liberty Gala" },
                { key: "winter-wonderland-2026", label: "Winter Wonderland" },
                { key: "spring-bloom-2026", label: "Spring Bloom" },
                { key: "default-neutral", label: "Neutral" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setAssetFilterTheme(filter.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    assetFilterTheme === filter.key
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground border border-transparent"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Assets Grid */}
            {(() => {
              const displayedAssets =
                assetFilterTheme === "all"
                  ? assetsList
                  : assetsList.filter((a) => a.themeKey === assetFilterTheme);

              if (displayedAssets.length === 0) {
                return (
                  <div className="p-8 text-center text-muted-foreground text-xs rounded-xl border border-dashed">
                    No uploaded assets found for this filter. Click "Upload New Asset" to upload custom graphics.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayedAssets.map((asset) => (
                    <div
                      key={asset._id}
                      className="group rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all flex flex-col overflow-hidden"
                    >
                      {/* Image Preview */}
                      <div className="relative h-32 w-full bg-black/40 flex items-center justify-center overflow-hidden">
                        <img
                          src={asset.cdnUrl}
                          alt={`${asset.themeKey} ${asset.role}`}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-black/70 text-white border border-white/10">
                          {asset.viewport}
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {asset.role}
                        </span>
                      </div>

                      {/* Details & Delete */}
                      <div className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-foreground text-[11px] truncate max-w-[140px]" title={asset.themeKey}>
                            {asset.themeKey}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {asset.format?.toUpperCase() || "IMAGE"} • {(asset.fileSizeBytes / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAsset(asset._id)}
                          className="p-1.5 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Audit Logs */}
          <div className="p-6 rounded-2xl bg-card border shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Theme Engine Audit Trail (Recent Activity)
            </h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No audit entries yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {auditLogs.slice(0, 10).map((log) => (
                  <div
                    key={log._id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono px-2 py-0.5 rounded bg-muted text-[10px] uppercase font-bold text-foreground">
                        {log.action}
                      </span>
                      <span className="text-muted-foreground">
                        Target: <strong className="text-foreground">{log.targetKey || log.targetType}</strong> by {log.performedBy}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BASE UI PRESETS (PRESERVED TASKBLASTER ENGINE)
          ========================================================================= */}
      {activeTab === "presets" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Preset Themes */}
            <div className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                Preset Base Color Themes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {legacyThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handlePreviewLegacyTheme(t.id)}
                    className={`p-4 rounded-lg border text-sm transition-all flex flex-col items-start gap-1 ${
                      activeThemeId === t.id
                        ? "bg-primary border-primary text-white font-bold shadow-md ring-2 ring-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <span className="w-full text-left">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Style Engine */}
            <div className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                Card Style Architecture
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {cardStyles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handlePreviewLegacyCardStyle(s.id)}
                    className={`p-4 rounded-lg border text-sm text-left transition-all ${
                      activeCardStyle === s.id
                        ? "bg-primary border-primary text-white font-bold shadow-md ring-2 ring-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 mt-6">
                Global Text Color
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={customTextColor || "#ffffff"}
                  onChange={(e) => {
                    setCustomTextColor(e.target.value);
                    setLegacySaveSuccess(false);
                    updateTheme({ customColors: { ...uiTheme.customColors, textColor: e.target.value } });
                  }}
                  className="w-12 h-12 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-sm text-muted-foreground">Select base text color for fallback panels</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm">
            <Button
              variant="outline"
              onClick={async () => {
                setLegacyLoading(true);
                try {
                  const res = await apiFetch<{ item: any }>("/api/ui-preferences/reset", { method: "POST" });
                  const t = (res.item.theme || "dark-minimal") as typeof uiTheme.theme;
                  const c = (res.item.cardStyle || "glass") as typeof uiTheme.cardStyle;
                  const tc = res.item.customColors?.textColor || "#ffffff";
                  setActiveThemeId(t);
                  setActiveCardStyle(c);
                  setCustomTextColor(tc);
                  updateTheme({ theme: t, cardStyle: c, customColors: { ...uiTheme.customColors, textColor: tc } });
                } finally {
                  setLegacyLoading(false);
                }
              }}
              disabled={legacyLoading}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Restore Defaults
            </Button>
            <div className="flex items-center gap-4">
              {legacySaveSuccess && (
                <span className="text-green-500 text-sm font-medium animate-fade-in">Preferences saved!</span>
              )}
              <Button onClick={saveLegacySettings} disabled={legacyLoading} className="px-8">
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Schedule Modal Dialog */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Configure Holiday Schedule Window</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Theme</label>
                <select
                  value={scheduleForm.themeKey}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, themeKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-xs"
                >
                  <option value="halloween-2026">halloween-2026 (Spooky Twilight)</option>
                  <option value="patriotic-july4">patriotic-july4 (Liberty Gala)</option>
                  <option value="winter-wonderland-2026">winter-wonderland-2026 (Winter Wonderland)</option>
                  <option value="spring-bloom-2026">spring-bloom-2026 (Spring Bloom)</option>
                  <option value="default-neutral">default-neutral (Neutral Fallback)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Schedule Type</label>
                <select
                  value={scheduleForm.scheduleType}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-xs"
                >
                  <option value="fixedAnnual">Fixed Annual (Recurs every year on Month/Day)</option>
                  <option value="range">Specific Date Range (One-off window)</option>
                </select>
              </div>

              {scheduleForm.scheduleType === "fixedAnnual" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Start (Month / Day)</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={scheduleForm.annualMonthDay?.startMonth || 10}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            annualMonthDay: {
                              ...scheduleForm.annualMonthDay!,
                              startMonth: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-1/2 px-2 py-1.5 rounded border bg-background"
                        placeholder="MM"
                      />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={scheduleForm.annualMonthDay?.startDay || 15}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            annualMonthDay: {
                              ...scheduleForm.annualMonthDay!,
                              startDay: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-1/2 px-2 py-1.5 rounded border bg-background"
                        placeholder="DD"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">End (Month / Day)</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={scheduleForm.annualMonthDay?.endMonth || 11}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            annualMonthDay: {
                              ...scheduleForm.annualMonthDay!,
                              endMonth: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-1/2 px-2 py-1.5 rounded border bg-background"
                        placeholder="MM"
                      />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={scheduleForm.annualMonthDay?.endDay || 2}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            annualMonthDay: {
                              ...scheduleForm.annualMonthDay!,
                              endDay: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-1/2 px-2 py-1.5 rounded border bg-background"
                        placeholder="DD"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={scheduleForm.startDate || ""}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border bg-background"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">End Date</label>
                    <input
                      type="date"
                      value={scheduleForm.endDate || ""}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border bg-background"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1">Priority Weight</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={scheduleForm.priority || 80}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, priority: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-1.5 rounded-lg border bg-background text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Theme Asset Modal Dialog */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-foreground">Upload Theme Asset</h3>
              </div>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Target Theme</label>
                <select
                  value={assetUploadForm.themeKey}
                  onChange={(e) => setAssetUploadForm({ ...assetUploadForm, themeKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-xs"
                >
                  <option value="spring-bloom-2026">spring-bloom-2026 (Spring Bloom)</option>
                  <option value="winter-wonderland-2026">winter-wonderland-2026 (Winter Wonderland)</option>
                  <option value="halloween-2026">halloween-2026 (Spooky Twilight)</option>
                  <option value="patriotic-july4">patriotic-july4 (Liberty Gala)</option>
                  <option value="default-neutral">default-neutral (Default Neutral)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Layer / Asset Role</label>
                  <select
                    value={assetUploadForm.role}
                    onChange={(e) => setAssetUploadForm({ ...assetUploadForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-xs"
                  >
                    <option value="background">Environment Background</option>
                    <option value="headerBanner">Header Banner</option>
                    <option value="sideFrameLeft">Side Frame Left</option>
                    <option value="sideFrameRight">Side Frame Right</option>
                    <option value="bottomForeground">Bottom Foreground Art</option>
                    <option value="transientOverlay">Transient Overlay</option>
                    <option value="particleSprite">Particle Sprite</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Target Viewport</label>
                  <select
                    value={assetUploadForm.viewport}
                    onChange={(e) => setAssetUploadForm({ ...assetUploadForm, viewport: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-xs"
                  >
                    <option value="desktop">Desktop (&ge; 1024px)</option>
                    <option value="tablet">Tablet (768px - 1023px)</option>
                    <option value="mobile">Mobile (&lt; 768px)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Graphic File</label>
                <div className="border border-dashed rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAssetUploadForm({ ...assetUploadForm, file });
                    }}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    {assetUploadForm.file ? (
                      <span className="font-medium text-amber-400 truncate max-w-[280px]">
                        {assetUploadForm.file.name} ({(assetUploadForm.file.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      <>
                        <span className="text-muted-foreground font-medium">Click or drag image file here</span>
                        <span className="text-[10px] text-muted-foreground/70">PNG, WEBP, AVIF, SVG or JPEG (Max 15MB)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssetModalOpen(false)}
                  disabled={isUploadingAsset}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isUploadingAsset}>
                  {isUploadingAsset ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload Graphic
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
