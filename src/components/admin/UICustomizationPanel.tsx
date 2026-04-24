import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Palette, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export function UICustomizationPanel({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const themes = [
    { id: "dark-minimal", name: "Dark Minimal" },
    { id: "neon-tech", name: "Neon Tech" },
    { id: "metallic-elite", name: "Metallic Elite" },
    { id: "executive-black", name: "Executive Black" },
    { id: "high-contrast", name: "High Contrast" },
    { id: "energy-mode", name: "Energy Mode" },
  ];

  const cardStyles = [
    { id: "glass", name: "Glassmorphism" },
    { id: "metallic", name: "Metallic" },
    { id: "flat", name: "Flat Default" },
  ];

  const [activeTheme, setActiveTheme] = useState("dark-minimal");
  const [activeCardStyle, setActiveCardStyle] = useState("glass");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch initial preferences
    apiFetch<{item: any}>("/api/ui-preferences").then(res => {
      if (res?.item?.theme) {
        setActiveTheme(res.item.theme);
        applyThemeClass(res.item.theme);
      }
      if (res?.item?.cardStyle) {
        setActiveCardStyle(res.item.cardStyle);
        document.body.setAttribute("data-tb-card-style", res.item.cardStyle);
      }
    }).catch(console.error);
  }, []);

  const applyThemeClass = (theme: string) => {
    document.body.className = document.body.className.replace(/\btb-theme-[a-z-]+\b/g, "");
    document.body.classList.add(`tb-theme-${theme}`);
  };

  const handlePreviewTheme = (themeId: string) => {
    applyThemeClass(themeId);
    setActiveTheme(themeId);
  };

  const handlePreviewCardStyle = (styleId: string) => {
    document.body.setAttribute("data-tb-card-style", styleId);
    setActiveCardStyle(styleId);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/ui-preferences", {
        method: "PUT",
        body: {
          theme: activeTheme,
          cardStyle: activeCardStyle,
        }
      });
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{item: any}>("/api/ui-preferences/reset", { method: "POST" });
      handlePreviewTheme(res.item.theme || "dark-minimal");
      handlePreviewCardStyle(res.item.cardStyle || "glass");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme Engine & Customization
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Preset Themes</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => handlePreviewTheme(t.id)}
                  className={`p-3 rounded-lg border text-sm transition-all flex flex-col items-start gap-1 ${
                    activeTheme === t.id 
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-md ring-1 ring-primary" 
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  <span className="w-full text-left">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Card Style Engine</h3>
            <div className="grid grid-cols-3 gap-3">
              {cardStyles.map(s => (
                <button
                  key={s.id}
                  onClick={() => handlePreviewCardStyle(s.id)}
                  className={`p-3 rounded-lg border text-sm text-center transition-all ${
                    activeCardStyle === s.id 
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-md ring-1 ring-primary" 
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={resetToDefault} disabled={loading} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
            <RefreshCw className="w-4 h-4 mr-2" /> Restore Defaults
          </Button>
          <div className="space-x-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={saveSettings} disabled={loading}>Save Settings</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
