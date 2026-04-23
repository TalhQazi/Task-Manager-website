import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme, UITheme } from "@/contexts/ThemeContext";
import { Layout, Zap, RotateCcw, Save, Sparkles, Palette } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";

export function AdminUICustomizationPanel() {
  const { uiTheme, updateTheme, resetTheme, saveToBackend, loadFromBackend } = useTheme();
  const [localTheme, setLocalTheme] = useState<UITheme>(uiTheme);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getThemeStorageKey = () => {
    const auth = getAuthState();
    const username = auth.username || "admin";
    return `ui-theme:admin:${username}`;
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
