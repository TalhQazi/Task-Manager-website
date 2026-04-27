import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Palette, RefreshCw } from "lucide-react";
import { employeeApiFetch } from "@/Employee/lib/api";
import { applyFullTheme, themeDefaults } from "@/Employee/lib/theme";

export function UICustomizationPanel() {
  const themes = [
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

  const [activeTheme, setActiveTheme] = useState("dark-minimal");
  const [activeCardStyle, setActiveCardStyle] = useState("glass");
  const [customTextColor, setCustomTextColor] = useState("#ffffff");
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Fetch initial preferences - same as admin
    employeeApiFetch<{item: { theme?: string; cardStyle?: string; customColors?: { textColor?: string } }}>("/api/ui-preferences").then(res => {
      const theme = res?.item?.theme || "dark-minimal";
      const cardStyle = res?.item?.cardStyle || "glass";
      const textColor = res?.item?.customColors?.textColor;

      setActiveTheme(theme);
      setActiveCardStyle(cardStyle);
      if (textColor) setCustomTextColor(textColor);

      applyFullTheme(theme, textColor || themeDefaults[theme], cardStyle);
    }).catch(console.error);
  }, []);

  const handlePreviewTheme = (themeId: string) => {
    const defaultColor = themeDefaults[themeId] || "#ffffff";
    setActiveTheme(themeId);
    setCustomTextColor(defaultColor);
    applyFullTheme(themeId, defaultColor, activeCardStyle);
    setSaveSuccess(false);
  };

  const handlePreviewCardStyle = (styleId: string) => {
    setActiveCardStyle(styleId);
    applyFullTheme(activeTheme, customTextColor, styleId);
    setSaveSuccess(false);
  };

  const handleTextColorChange = (color: string) => {
    setCustomTextColor(color);
    applyFullTheme(activeTheme, color, activeCardStyle);
    setSaveSuccess(false);
  };

  const saveSettings = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      await employeeApiFetch("/api/ui-preferences", {
        method: "PUT",
        body: JSON.stringify({
          theme: activeTheme,
          cardStyle: activeCardStyle,
          customColors: {
            textColor: customTextColor
          }
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await employeeApiFetch<{item: { theme?: string; cardStyle?: string; customColors?: { textColor?: string } }}>("/api/ui-preferences/reset", { method: "POST" });
      const theme = res.item.theme || "dark-minimal";
      const cardStyle = res.item.cardStyle || "glass";
      const textColor = res.item.customColors?.textColor || "#ffffff";

      setActiveTheme(theme);
      setActiveCardStyle(cardStyle);
      setCustomTextColor(textColor);
      applyFullTheme(theme, textColor, cardStyle);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Palette className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Engine</h1>
          <p className="text-muted-foreground mt-1">Customize the interface exactly the way you want it.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">Preset Themes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handlePreviewTheme(t.id)}
                className={`p-4 rounded-lg border text-sm transition-all flex flex-col items-start gap-1 ${
                  activeTheme === t.id
                    ? "bg-primary border-primary text-white font-bold shadow-md ring-2 ring-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                <span className="w-full text-left">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">Card Style Engine</h3>
          <div className="grid grid-cols-1 gap-3">
            {cardStyles.map((s) => (
              <button
                key={s.id}
                onClick={() => handlePreviewCardStyle(s.id)}
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

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 mt-6">Global Text Color</h3>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={customTextColor || "#ffffff"}
              onChange={(e) => handleTextColorChange(e.target.value)}
              className="w-12 h-12 rounded cursor-pointer border-0 bg-transparent"
              title="Global Text Color"
            />
            <span className="text-sm text-muted-foreground">Select the default text color for the employee panel</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm mt-8">
        <Button
          variant="outline"
          onClick={resetToDefault}
          disabled={loading}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Restore Defaults
        </Button>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <span className="text-green-500 text-sm font-medium animate-fade-in">Settings saved successfully!</span>
          )}
          <Button onClick={saveSettings} disabled={loading} className="px-8">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
