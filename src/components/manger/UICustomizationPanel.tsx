import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/manger/ui/card";
import { Button } from "@/components/manger/ui/button";
import { Label } from "@/components/manger/ui/label";
import { Slider } from "@/components/manger/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/manger/ui/select";
import { useTheme, UITheme, themePresets } from "@/contexts/ThemeContext";
import { Layout, Zap, RotateCcw, Save, Sparkles, Palette } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/manger/api";
import { getAuthState } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function ManagerUICustomizationPanel() {
  const { uiTheme, updateTheme, resetTheme, saveToBackend, loadFromBackend, applyPreset } = useTheme();
  const [localTheme, setLocalTheme] = useState<UITheme>(uiTheme);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getThemeStorageKey = () => {
    const auth = getAuthState();
    const username = auth.username || "manager";
    return `ui-theme:manager:${username}`;
  };

  useEffect(() => {
    if (hasChanges) return;
    setLocalTheme(uiTheme);
  }, [uiTheme, hasChanges]);

  useEffect(() => {
    if (!hasChanges) return;
    updateTheme(localTheme);
    localStorage.setItem(getThemeStorageKey(), JSON.stringify(localTheme));
  }, [localTheme, hasChanges, updateTheme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(getThemeStorageKey());
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setLocalTheme(parsed);
        updateTheme(parsed);
      } catch (e) {
        console.error("Failed to parse saved theme:", e);
      }
    }
  }, []);

  const cardStyles = [
    { id: "glass", name: "Glass", description: "Translucent with blur effect" },
    { id: "neon", name: "Neon", description: "Glowing borders" },
    { id: "metallic", name: "Metallic", description: "Premium metal finish" },
  ] as const;

  const layoutDensities = [
    { id: "compact", name: "Compact", description: "More content, less space" },
    { id: "comfortable", name: "Comfortable", description: "Balanced spacing" },
    { id: "spacious", name: "Spacious", description: "More breathing room" },
  ] as const;

  const presetOptions = [
    { id: "ocean-professional", name: "Ocean Professional", description: "Professional blue tones", colors: ["#0c4a6e", "#e0f2fe", "#f0f9ff"] },
    { id: "midnight-elegance", name: "Midnight Elegance", description: "Dark theme with purple accents", colors: ["#1e1b4b", "#0f0f23", "#1a1a2e"] },
    { id: "emerald-fresh", name: "Emerald Fresh", description: "Fresh green tones", colors: ["#064e3b", "#065f46", "#ecfdf5"] },
    { id: "sunset-blaze", name: "Sunset Blaze", description: "Warm orange tones", colors: ["#7c2d12", "#431407", "#fff7ed"] },
    { id: "royal-gold", name: "Royal Gold", description: "Brand gold & blue", colors: ["#1e1b4b", "#312e81", "#fef3c7"] },
    { id: "frost-mint", name: "Frost Mint", description: "Cool cyan tones", colors: ["#164e63", "#155e75", "#ecfeff"] },
    { id: "lavender-dream", name: "Lavender Dream", description: "Soft purple tones", colors: ["#6b21a8", "#581c87", "#faf5ff"] },
    { id: "rose-blush", name: "Rose Blush", description: "Elegant pink tones", colors: ["#9d174d", "#831843", "#fdf2f8"] },
    { id: "slate-professional", name: "Slate Professional", description: "Modern gray tones", colors: ["#334155", "#1e293b", "#f8fafc"] },
  ];

  const handlePanelColorChange = (key: keyof UITheme["panelColors"], value: string | number) => {
    setLocalTheme((prev) => ({
      ...prev,
      panelColors: { ...prev.panelColors, [key]: value },
    }));
    setHasChanges(true);
  };

  const handleAnimationToggleChange = (key: keyof UITheme["animationSettings"], value: boolean) => {
    setLocalTheme((prev) => ({
      ...prev,
      animationSettings: { ...prev.animationSettings, [key]: value },
    }));
    setHasChanges(true);
  };

  const handleGlowIntensityChange = (value: number) => {
    setLocalTheme((prev) => ({ ...prev, glowIntensity: value }));
    setHasChanges(true);
  };

  const handleAnimationSpeedChange = (value: string) => {
    setLocalTheme((prev) => ({ ...prev, animationSpeed: value as any }));
    setHasChanges(true);
  };

  const handleCardStyleChange = (value: string) => {
    setLocalTheme((prev) => ({ ...prev, cardStyle: value as any }));
    setHasChanges(true);
  };

  const handleLayoutDensityChange = (value: string) => {
    setLocalTheme((prev) => ({ ...prev, layoutDensity: value as any }));
    setHasChanges(true);
  };

  const handleApplyChanges = async () => {
    setIsSaving(true);
    try {
      updateTheme(localTheme);
      await apiFetch("/api/ui-preferences", {
        method: "PUT",
        body: JSON.stringify(localTheme),
      });
      setHasChanges(false);
      toast.success("UI preferences saved successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save preferences to server";
      toast.error(errorMessage);
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      resetTheme();
      setLocalTheme(uiTheme);
      localStorage.setItem(getThemeStorageKey(), JSON.stringify(uiTheme));
      try {
        await apiFetch("/api/ui-preferences/reset", { method: "POST" });
      } catch (backendError) {
        console.warn("Backend reset failed, but localStorage was updated:", backendError);
      }
      setHasChanges(false);
      toast.success("UI preferences reset to default");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reset preferences";
      toast.error(errorMessage);
      console.error("Reset error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresetApply = async (presetName: string) => {
    const preset = themePresets[presetName];
    if (!preset) return;
    
    // Apply the preset using ThemeContext's applyPreset function
    applyPreset(presetName);
    
    setLocalTheme(preset);
    localStorage.setItem(getThemeStorageKey(), JSON.stringify(preset));
    try {
      await apiFetch("/api/ui-preferences", {
        method: "PUT",
        body: JSON.stringify(preset),
      });
    } catch (error) {
      console.error("Failed to save theme to backend:", error);
    }
    toast.success("Theme applied successfully");
  };

  const isPresetActive = (presetId: string) => {
    const preset = themePresets[presetId];
    if (!preset) return false;
    return (
      uiTheme.panelColors.sidebarBackground === preset.panelColors.sidebarBackground &&
      uiTheme.panelColors.dashboardBackground === preset.panelColors.dashboardBackground &&
      uiTheme.panelColors.headerBackground === preset.panelColors.headerBackground
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">UI Customization</h2>
          <p className="text-muted-foreground">Customize your panel appearance and behavior</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleApplyChanges} disabled={!hasChanges || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Presets
          </CardTitle>
          <CardDescription>Choose a professionally designed theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {presetOptions.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetApply(preset.id)}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all hover:scale-105",
                  isPresetActive(preset.id)
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                {isPresetActive(preset.id) && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                )}
                <div className="flex gap-1 mb-3">
                  {preset.colors.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 h-8 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <h3 className="font-semibold text-sm mb-1">{preset.name}</h3>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Panel Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Panel Colors
          </CardTitle>
          <CardDescription>Customize colors for different panel sections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Header Background</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.headerBackground}
                  onChange={(e) => handlePanelColorChange("headerBackground", e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
              </div>
            </div>

            <div>
              <Label>Header Overlay Color</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.headerOverlayColor}
                  onChange={(e) => handlePanelColorChange("headerOverlayColor", e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
              </div>
            </div>

            <div>
              <Label>Overlay Opacity</Label>
              <div className="mt-2">
                <Slider
                  value={[localTheme.panelColors.headerOverlayOpacity]}
                  onValueChange={(v) => handlePanelColorChange("headerOverlayOpacity", v[0])}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            <div>
              <Label>Sidebar Background</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.sidebarBackground}
                  onChange={(e) => handlePanelColorChange("sidebarBackground", e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
              </div>
            </div>

            <div>
              <Label>Screen Background</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.dashboardBackground}
                  onChange={(e) => handlePanelColorChange("dashboardBackground", e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
              </div>
            </div>

            <div>
              <Label>Dashboard Cards Background</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.dashboardCardBackground}
                  onChange={(e) => handlePanelColorChange("dashboardCardBackground", e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
              </div>
            </div>

            <div>
              <Label>Sidebar Icon Color</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.sidebarIconColor}
                  onChange={(e) => handlePanelColorChange("sidebarIconColor", e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
              </div>
            </div>

            <div>
              <Label>Sidebar Text Color</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.sidebarTextColor}
                  onChange={(e) => handlePanelColorChange("sidebarTextColor", e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
              </div>
            </div>

            <div>
              <Label>Dashboard Icon Color</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.dashboardIconColor}
                  onChange={(e) => handlePanelColorChange("dashboardIconColor", e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Style & Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Card Style</CardTitle>
            <CardDescription>Choose card appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={localTheme.cardStyle} onValueChange={handleCardStyleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cardStyles.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name} - {style.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layout Density</CardTitle>
            <CardDescription>Adjust spacing</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={localTheme.layoutDensity} onValueChange={handleLayoutDensityChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {layoutDensities.map((density) => (
                  <SelectItem key={density.id} value={density.id}>
                    {density.name} - {density.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Glow Intensity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Glow Intensity
          </CardTitle>
          <CardDescription>Adjust the glow effect intensity</CardDescription>
        </CardHeader>
        <CardContent>
          <Slider
            value={[localTheme.glowIntensity]}
            onValueChange={([v]) => handleGlowIntensityChange(v)}
            max={100}
            step={1}
          />
        </CardContent>
      </Card>

      {/* Animations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Animations
          </CardTitle>
          <CardDescription>Control animation behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="animations-enabled">Enable Animations</Label>
            <input
              id="animations-enabled"
              type="checkbox"
              checked={localTheme.animationSettings.enabled}
              onChange={(e) => handleAnimationToggleChange("enabled", e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="reduce-motion">Reduce Motion</Label>
            <input
              id="reduce-motion"
              type="checkbox"
              checked={localTheme.animationSettings.reduceMotion}
              onChange={(e) => handleAnimationToggleChange("reduceMotion", e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="hover-effects">Hover Effects</Label>
            <input
              id="hover-effects"
              type="checkbox"
              checked={localTheme.animationSettings.hoverEffects}
              onChange={(e) => handleAnimationToggleChange("hoverEffects", e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="click-effects">Click Effects</Label>
            <input
              id="click-effects"
              type="checkbox"
              checked={localTheme.animationSettings.clickEffects}
              onChange={(e) => handleAnimationToggleChange("clickEffects", e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div>
            <Label>Animation Speed</Label>
            <Select value={localTheme.animationSpeed} onValueChange={handleAnimationSpeedChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
