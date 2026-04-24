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
import { useTheme, UITheme, themePresets } from "@/contexts/ThemeContext";
import { Layout, Zap, RotateCcw, Save, Sparkles, Palette, Check } from "lucide-react";
import { toast } from "sonner";
import { resetUIPreferences } from "../lib/api";

export function UICustomizationPanel() {
  const { uiTheme, updateTheme, resetTheme, saveToBackend, loadFromBackend, applyPreset } = useTheme();
  const [localTheme, setLocalTheme] = useState<UITheme>(uiTheme);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (hasChanges) return;
    setLocalTheme(uiTheme);
  }, [uiTheme, hasChanges]);

  useEffect(() => {
    if (!hasChanges) return;
    updateTheme(localTheme);
  }, [localTheme, hasChanges, updateTheme]);

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

  const animationSpeeds = [
    { id: "slow", name: "Slow", description: "Relaxed animations" },
    { id: "normal", name: "Normal", description: "Standard speed" },
    { id: "fast", name: "Fast", description: "Quick transitions" },
  ] as const;

  const handleCardStyleChange = (cardStyle: UITheme["cardStyle"]) => {
    setLocalTheme({ ...localTheme, cardStyle });
    setHasChanges(true);
  };

  const handleLayoutDensityChange = (layoutDensity: UITheme["layoutDensity"]) => {
    setLocalTheme({ ...localTheme, layoutDensity });
    setHasChanges(true);
  };

  const handleAnimationSpeedChange = (animationSpeed: UITheme["animationSpeed"]) => {
    setLocalTheme({ ...localTheme, animationSpeed });
    setHasChanges(true);
  };

  const handleGlowIntensityChange = (value: number[]) => {
    setLocalTheme({ ...localTheme, glowIntensity: value[0] });
    setHasChanges(true);
  };

  const handlePanelColorChange = (key: keyof UITheme["panelColors"], value: string | number) => {
    setLocalTheme({
      ...localTheme,
      panelColors: { ...localTheme.panelColors, [key]: value },
    });
    setHasChanges(true);
  };

  const handleAnimationToggle = (key: keyof UITheme["animationSettings"], value: boolean) => {
    setLocalTheme({
      ...localTheme,
      animationSettings: { ...localTheme.animationSettings, [key]: value }
    });
    setHasChanges(true);
  };

  const handleApplyChanges = async () => {
    setIsSaving(true);
    try {
      updateTheme(localTheme);
      await saveToBackend(localTheme);
      setHasChanges(false);
      toast.success("UI preferences saved successfully");
    } catch (error) {
      toast.error("Failed to save preferences to server");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      resetTheme();
      setLocalTheme(uiTheme);
      await resetUIPreferences();
      setHasChanges(false);
      toast.success("Reset to default theme");
    } catch (error) {
      toast.error("Failed to reset preferences");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLivePreview = () => {
    updateTheme(localTheme);
    toast.success("Live preview applied");
  };

  const handlePresetApply = async (presetName: string) => {
    applyPreset(presetName);
    setLocalTheme(themePresets[presetName]);
    try {
      await saveToBackend(themePresets[presetName]);
    } catch (error) {
      console.error("Failed to save theme to backend:", error);
    }
    toast.success("Theme applied successfully");
  };

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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            UI Customization
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">Personalize your dashboard experience</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isSaving} size="sm" className="sm:size-default">
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Reset</span>
            <span className="sm:hidden">Reset</span>
          </Button>
          <Button variant="outline" onClick={handleLivePreview} disabled={!hasChanges || isSaving} size="sm" className="sm:size-default">
            <Layout className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Live Preview</span>
            <span className="sm:hidden">Preview</span>
          </Button>
          <Button onClick={handleApplyChanges} disabled={!hasChanges || isSaving} size="sm" className="sm:size-default">
            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {isSaving ? "Saving..." : <><span className="hidden sm:inline">Save Changes</span><span className="sm:hidden">Save</span></>}
          </Button>
        </div>
      </div>

      {/* Theme Presets */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
            Theme Presets
          </CardTitle>
          <CardDescription className="text-sm">Choose a professionally designed theme</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {presetOptions.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetApply(preset.id)}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  isPresetActive(preset.id)
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : "border-border/60 hover:border-primary/50"
                }`}
              >
                <div className="h-20 flex">
                  <div className="flex-1" style={{ backgroundColor: preset.colors[0] }}></div>
                  <div className="w-8" style={{ backgroundColor: preset.colors[1] }}></div>
                  <div className="flex-1" style={{ backgroundColor: preset.colors[2] }}></div>
                </div>
                <div className="p-3 bg-background">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{preset.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                    </div>
                    {isPresetActive(preset.id) && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Panel Colors - Responsive Grid */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Panel Colors</CardTitle>
          <CardDescription className="text-sm">Customize header, sidebar, dashboard and icons</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Header Background</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.headerBackground}
                  onChange={(e) => handlePanelColorChange("headerBackground", e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer border-0"
                  title="Header Background"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Header Overlay Color</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.headerOverlayColor}
                  onChange={(e) => handlePanelColorChange("headerOverlayColor", e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer border-0"
                  title="Header Overlay Color"
                />
              </div>
              <div className="mt-3">
                <Label className="text-sm">Overlay Opacity</Label>
                <div className="mt-2">
                  <Slider
                    value={[localTheme.panelColors.headerOverlayOpacity]}
                    onValueChange={(v) => handlePanelColorChange("headerOverlayOpacity", v[0])}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm">Sidebar Background</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.sidebarBackground}
                  onChange={(e) => handlePanelColorChange("sidebarBackground", e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer border-0"
                  title="Sidebar Background"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Screen Background</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.dashboardBackground}
                  onChange={(e) => handlePanelColorChange("dashboardBackground", e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer border-0"
                  title="Screen Background"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Dashboard Cards Background</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.dashboardCardBackground}
                  onChange={(e) => handlePanelColorChange("dashboardCardBackground", e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer border-0"
                  title="Dashboard Cards Background"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Sidebar Icon Color</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.sidebarIconColor}
                  onChange={(e) => handlePanelColorChange("sidebarIconColor", e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer border-0"
                  title="Sidebar Icon Color"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Sidebar Text Color</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.sidebarTextColor}
                  onChange={(e) => handlePanelColorChange("sidebarTextColor", e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer border-0"
                  title="Sidebar Text Color"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Dashboard Icon Color</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={localTheme.panelColors.dashboardIconColor}
                  onChange={(e) => handlePanelColorChange("dashboardIconColor", e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer border-0"
                  title="Dashboard Icon Color"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Style & Layout - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Card Style</CardTitle>
            <CardDescription className="text-sm">Choose card appearance</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Select value={localTheme.cardStyle} onValueChange={handleCardStyleChange}>
              <SelectTrigger className="w-full">
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
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Layout Density</CardTitle>
            <CardDescription className="text-sm">Adjust spacing</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Select value={localTheme.layoutDensity} onValueChange={handleLayoutDensityChange}>
              <SelectTrigger className="w-full">
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
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            Glow Intensity
          </CardTitle>
          <CardDescription className="text-sm">Adjust the glow effect strength</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-4">
            <Slider
              value={[localTheme.glowIntensity]}
              onValueChange={handleGlowIntensityChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              <span>None</span>
              <span>{localTheme.glowIntensity}%</span>
              <span>Maximum</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animation Settings */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Animation Settings</CardTitle>
          <CardDescription className="text-sm">Control animation behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-sm">Animation Speed</Label>
              <Select
                value={localTheme.animationSpeed}
                onValueChange={handleAnimationSpeedChange}
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {animationSpeeds.map((speed) => (
                    <SelectItem key={speed.id} value={speed.id}>
                      {speed.name} - {speed.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label htmlFor="animations-enabled" className="text-sm">Enable Animations</Label>
              <input
                id="animations-enabled"
                type="checkbox"
                checked={localTheme.animationSettings.enabled}
                onChange={(e) => handleAnimationToggle("enabled", e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded"
                title="Enable Animations"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label htmlFor="reduce-motion" className="text-sm">Reduce Motion</Label>
              <input
                id="reduce-motion"
                type="checkbox"
                checked={localTheme.animationSettings.reduceMotion}
                onChange={(e) => handleAnimationToggle("reduceMotion", e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded"
                title="Reduce Motion"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label htmlFor="hover-effects" className="text-sm">Hover Effects</Label>
              <input
                id="hover-effects"
                type="checkbox"
                checked={localTheme.animationSettings.hoverEffects}
                onChange={(e) => handleAnimationToggle("hoverEffects", e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded"
                title="Hover Effects"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label htmlFor="click-effects" className="text-sm">Click Effects</Label>
              <input
                id="click-effects"
                type="checkbox"
                checked={localTheme.animationSettings.clickEffects}
                onChange={(e) => handleAnimationToggle("clickEffects", e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded"
                title="Click Effects"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}