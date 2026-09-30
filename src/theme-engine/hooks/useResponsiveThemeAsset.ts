import { useState, useEffect, useCallback } from "react";
import { AssetType, DeviceVariant, ThemeAssetMap } from "../types";

/**
 * Hook to dynamically determine device viewport variant (desktop | tablet | mobile)
 * and resolve the highest-quality available asset URL with seamless fallbacks.
 */
export function useResponsiveThemeAsset(assets: ThemeAssetMap) {
  const [deviceVariant, setDeviceVariant] = useState<DeviceVariant>(() => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1200) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateVariant = () => {
      const width = window.innerWidth;
      let nextVariant: DeviceVariant = "desktop";
      if (width < 768) nextVariant = "mobile";
      else if (width < 1200) nextVariant = "tablet";

      setDeviceVariant((prev) => (prev !== nextVariant ? nextVariant : prev));
    };

    window.addEventListener("resize", updateVariant, { passive: true });
    return () => window.removeEventListener("resize", updateVariant);
  }, []);

  const getAssetUrl = useCallback(
    (assetType: AssetType): string | null => {
      const typeGroup = assets[assetType];
      if (!typeGroup) return null;

      // Check current device variant
      const exactMatch = typeGroup[deviceVariant];
      if (exactMatch && (exactMatch.cdnUrl || exactMatch.fallbackUrl)) {
        return exactMatch.cdnUrl || exactMatch.fallbackUrl || null;
      }

      // Fallback chain: tablet -> desktop -> mobile
      if (deviceVariant === "mobile") {
        if (typeGroup.tablet?.cdnUrl) return typeGroup.tablet.cdnUrl;
        if (typeGroup.desktop?.cdnUrl) return typeGroup.desktop.cdnUrl;
      } else if (deviceVariant === "tablet") {
        if (typeGroup.desktop?.cdnUrl) return typeGroup.desktop.cdnUrl;
        if (typeGroup.mobile?.cdnUrl) return typeGroup.mobile.cdnUrl;
      } else {
        if (typeGroup.tablet?.cdnUrl) return typeGroup.tablet.cdnUrl;
        if (typeGroup.mobile?.cdnUrl) return typeGroup.mobile.cdnUrl;
      }

      return null;
    },
    [assets, deviceVariant]
  );

  return {
    deviceVariant,
    getAssetUrl,
  };
}
