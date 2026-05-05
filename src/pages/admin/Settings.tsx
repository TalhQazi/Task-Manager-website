import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Camera, User, Loader2, CheckCircle, XCircle, AlertCircle, Upload, FileImage, Image as ImageIcon, Quote, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Label } from "@/components/admin/ui/label";
import { Switch } from "@/components/admin/ui/switch";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import AssetLibraryPicker from "@/components/admin/AssetLibraryPicker";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type AvatarUploadState = {
  status: UploadStatus;
  message: string | null;
};

type SettingsState = {
  companyName: string;
  supportEmail: string;
  timezone: string;
  notificationsEnabled: boolean;
  autoLogoutMinutes: number;
  fullName: string;
  email: string;
  avatarUrl: string;
  rewardSettings: {
    animationsEnabled: boolean;
    hapticsEnabled: boolean;
    soundEnabled: boolean;
  };
};


const SETTINGS_STORAGE_KEY = "app_settings";

const defaultSettings: SettingsState = {
  companyName: "TaskFlow",
  supportEmail: "support@taskflow.com",
  timezone: "UTC+05:00",
  notificationsEnabled: true,
  autoLogoutMinutes: 0,
  fullName: "",
  email: "",
  avatarUrl: "",
  rewardSettings: {
    animationsEnabled: true,
    hapticsEnabled: true,
    soundEnabled: false,
  },
};


function loadSettings(): SettingsState {
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!saved) return defaultSettings;
  try {
    const parsed = JSON.parse(saved) as Partial<SettingsState>;
    return {
      companyName: parsed.companyName ?? defaultSettings.companyName,
      supportEmail: parsed.supportEmail ?? defaultSettings.supportEmail,
      timezone: parsed.timezone ?? defaultSettings.timezone,
      notificationsEnabled: parsed.notificationsEnabled ?? defaultSettings.notificationsEnabled,
      autoLogoutMinutes: parsed.autoLogoutMinutes ?? defaultSettings.autoLogoutMinutes,
      fullName: parsed.fullName ?? defaultSettings.fullName,
      email: parsed.email ?? defaultSettings.email,
      avatarUrl: parsed.avatarUrl ?? defaultSettings.avatarUrl,
      rewardSettings: parsed.rewardSettings ?? defaultSettings.rewardSettings,
    };

  } catch {
    return defaultSettings;
  }
}

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());

  const [isSaving, setIsSaving] = useState(false);
  const [founderMsgEnabled, setFounderMsgEnabled] = useState(true);
  const [isLoadingFounderPref, setIsLoadingFounderPref] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [avatarUpload, setAvatarUpload] = useState<AvatarUploadState>({
    status: "idle",
    message: null,
  });
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string>("");
  const [pendingFileName, setPendingFileName] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const onCropComplete = (_croppedArea: any, croppedAreaPixelsValue: any) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  };

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedBlob = async (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to create canvas context");

    // Limit max dimensions to 512x512 for avatars to keep file size small
    const maxSize = 512;
    let targetWidth = Math.floor(pixelCrop.width);
    let targetHeight = Math.floor(pixelCrop.height);
    
    if (targetWidth > maxSize || targetHeight > maxSize) {
      const ratio = Math.min(maxSize / targetWidth, maxSize / targetHeight);
      targetWidth = Math.floor(targetWidth * ratio);
      targetHeight = Math.floor(targetHeight * ratio);
    }

    canvas.width = Math.max(1, targetWidth);
    canvas.height = Math.max(1, targetHeight);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    // Use JPEG with 0.8 quality for smaller file size (PNG is lossless and too large)
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new Error("Failed to export cropped image"));
          else resolve(b);
        },
        "image/jpeg",
        0.8,
      );
    });

    return blob;
  };

  const uploadCroppedAvatar = async () => {
    if (!pendingImageSrc || !croppedAreaPixels) {
      setAvatarUpload({ status: "error", message: "Please adjust the crop before saving." });
      setTimeout(() => setAvatarUpload({ status: "idle", message: null }), 4000);
      return;
    }

    setAvatarUpload({ status: "uploading", message: "Profile picture uploading..." });

    try {
      const blob = await getCroppedBlob(pendingImageSrc, croppedAreaPixels);
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("avatar", file);

      const data = await apiFetch<{ avatarDataUrl?: string; avatarUrl?: string }>(
        "/api/settings/avatar",
        {
          method: "POST",
          body: formData,
        }
      );

      if (data.avatarDataUrl || data.avatarUrl) {
        const newAvatarUrl = data.avatarDataUrl || (data.avatarUrl ? toProxiedUrl(data.avatarUrl) : "");
        setSettings((prev) => ({ ...prev, avatarUrl: newAvatarUrl || "" }));
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify({ ...loadSettings(), avatarUrl: newAvatarUrl })
        );
        setAvatarUpload({ status: "success", message: "Profile picture uploaded successfully!" });
      } else {
        setAvatarUpload({ status: "error", message: "Failed to upload profile picture. Please try again." });
      }

      setIsCropOpen(false);
      setPendingImageSrc("");
      setPendingFileName("");
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);

      await backendSettingsQuery.refetch();
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      let errorMessage = "Failed to upload profile picture. Please try again.";

      if (err?.message?.includes("size") || err?.message?.includes("large")) {
        errorMessage = "Image size is too large. Maximum allowed size is 10MB";
      } else if (err?.message?.includes("format") || err?.message?.includes("type")) {
        errorMessage = "Invalid image format. Please upload JPEG, PNG, or GIF file.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setAvatarUpload({ status: "error", message: errorMessage });

      setIsCropOpen(false);
      setPendingImageSrc("");
      setPendingFileName("");
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    } finally {
      setTimeout(() => {
        setAvatarUpload({ status: "idle", message: null });
      }, 4000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setAvatarUpload({
        status: "error",
        message: "Please upload a valid image file (JPEG, PNG, GIF)",
      });
      setTimeout(() => setAvatarUpload({ status: "idle", message: null }), 4000);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarUpload({
        status: "error",
        message: "Image size is too large. Maximum allowed size is 10MB",
      });
      setTimeout(() => setAvatarUpload({ status: "idle", message: null }), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      setPendingImageSrc(result);
      setPendingFileName(file.name);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  };

  const initials =
    settings.fullName
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A";

  const backendSettingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      return apiFetch<{
        item: {
          companyName?: string;
          supportEmail?: string;
          timezone?: string;
          notificationsEnabled?: boolean;
          autoLogoutMinutes?: number;
          notifications?: Record<string, boolean>;
          fullName?: string;
          email?: string;
          avatarUrl?: string;
          avatarDataUrl?: string;
        };
      }>("/api/settings");
    },
  });

  useEffect(() => {
    const item = backendSettingsQuery.data?.item;
    if (!item) return;
    setSettings((prev) => ({
      ...prev,
      companyName: typeof item.companyName === "string" ? item.companyName : prev.companyName,
      supportEmail: typeof item.supportEmail === "string" ? item.supportEmail : prev.supportEmail,
      timezone: typeof item.timezone === "string" ? item.timezone : prev.timezone,
      notificationsEnabled:
        typeof item.notificationsEnabled === "boolean" ? item.notificationsEnabled : prev.notificationsEnabled,
      autoLogoutMinutes:
        typeof item.autoLogoutMinutes === "number" ? item.autoLogoutMinutes : prev.autoLogoutMinutes,
      fullName: typeof item.fullName === "string" ? item.fullName : prev.fullName,
      email: typeof item.email === "string" ? item.email : prev.email,
      avatarUrl: typeof item.avatarDataUrl === "string" && item.avatarDataUrl
        ? item.avatarDataUrl
        : typeof item.avatarUrl === "string"
          ? toProxiedUrl(item.avatarUrl) || item.avatarUrl
          : prev.avatarUrl,
      rewardSettings: item.rewardSettings || prev.rewardSettings,
    }));
  }, [backendSettingsQuery.data]);


  const notifications = backendSettingsQuery.data?.item?.notifications || {};
  const saveChanges = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await apiFetch<{ item: any }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          companyName: settings.companyName,
          supportEmail: settings.supportEmail,
          timezone: settings.timezone,
          notificationsEnabled: settings.notificationsEnabled,
          autoLogoutMinutes: settings.autoLogoutMinutes,
          fullName: settings.fullName,
          email: settings.email,
          avatarUrl: settings.avatarUrl,
        }),
      });
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      await backendSettingsQuery.refetch();
      setSaveMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveMessage("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const setBackendNotification = async (key: string, value: boolean) => {
    await apiFetch<{ item: any }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        notifications: {
          ...notifications,
          [key]: value,
        },
      }),
    });
    await backendSettingsQuery.refetch();
  };

  const handleRewardSettingChange = async (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      rewardSettings: {
        ...prev.rewardSettings,
        [key]: value,
      },
    }));
    await apiFetch<{ item: any }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        rewardSettings: {
          ...settings.rewardSettings,
          [key]: value,
        },
      }),
    });
    await backendSettingsQuery.refetch();
  };


  const onChangePassword = async () => {
    const currentPassword = passwordDraft.currentPassword;
    const newPassword = passwordDraft.newPassword;
    const confirmNewPassword = passwordDraft.confirmNewPassword;

    if (!currentPassword || !newPassword || !confirmNewPassword) return;
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    try {
      setPasswordError(null);
      setPasswordSaving(true);
      await apiFetch<{ ok: true }>("/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordDraft({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Load founder message preference
  useEffect(() => {
    const loadFounderPref = async () => {
      try {
        const res = await apiFetch<{ showFounderMessages: boolean }>("/api/founder-messages/preference");
        setFounderMsgEnabled(res.showFounderMessages !== false);
      } catch (e) {
        console.error("Failed to load founder message preference:", e);
      }
    };
    loadFounderPref();
  }, []);

  const handleToggleFounderMessages = async () => {
    setIsLoadingFounderPref(true);
    try {
      await apiFetch<{ showFounderMessages: boolean }>("/api/founder-messages/preference", {
        method: "PUT",
        body: JSON.stringify({ showFounderMessages: !founderMsgEnabled }),
      });
      setFounderMsgEnabled(!founderMsgEnabled);
    } catch (e) {
      console.error("Failed to toggle founder messages:", e);
    } finally {
      setIsLoadingFounderPref(false);
    }
  };

  // Header Customization Card Component
  function HeaderCustomizationCard() {
    const [headerSettings, setHeaderSettings] = useState({
      backgroundType: "color" as "color" | "image",
      colorConfig: { from: "#133767", via: "#133767", to: "#133767" },
      imageConfig: { url: "", dataUrl: "", repeat: "no-repeat", size: "cover", position: "center" },
      height: 144,
      overlay: { enabled: true, color: "rgba(0,0,0,0.3)" },
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingHeader, setIsSavingHeader] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isLibraryPickerOpen, setIsLibraryPickerOpen] = useState(false);
    const headerFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const fetchSettings = async () => {
        setIsLoading(true);
        try {
          const res = await apiFetch<{ item: typeof headerSettings }>("/api/header-settings");
          if (res.item) {
            setHeaderSettings(res.item);
          }
        } catch (e) {
          console.error("Failed to load header settings", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSettings();
    }, []);

    const handleSaveHeader = async () => {
      setIsSavingHeader(true);
      setMessage(null);
      try {
        await apiFetch("/api/header-settings", {
          method: "PUT",
          body: JSON.stringify(headerSettings),
        });
        setMessage("Header settings saved successfully!");
        window.dispatchEvent(new CustomEvent("header-settings-updated"));
      } catch (e) {
        setMessage("Failed to save header settings");
      } finally {
        setIsSavingHeader(false);
        setTimeout(() => setMessage(null), 3000);
      }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        setMessage("Image must be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setHeaderSettings(prev => ({
          ...prev,
          backgroundType: "image",
          imageConfig: { ...prev.imageConfig, dataUrl }
        }));
      };
      reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
      setHeaderSettings(prev => ({
        ...prev,
        backgroundType: "color",
        imageConfig: { ...prev.imageConfig, dataUrl: "" }
      }));
    };

    const handleReset = async () => {
      setIsSavingHeader(true);
      try {
        await apiFetch("/api/header-settings/reset", { method: "POST" });
        setHeaderSettings({
          backgroundType: "color",
          colorConfig: { from: "#133767", via: "#133767", to: "#133767" },
          imageConfig: { url: "", dataUrl: "", repeat: "no-repeat", size: "cover", position: "center" },
          height: 144,
          overlay: { enabled: true, color: "rgba(0,0,0,0.3)" },
        });
        setMessage("Reset to defaults - color gradient restored");
        window.dispatchEvent(new CustomEvent("header-settings-updated"));
      } catch (e) {
        setMessage("Failed to reset");
      } finally {
        setIsSavingHeader(false);
        setTimeout(() => setMessage(null), 3000);
      }
    };

    return (
      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Customize Header
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Header Background Image</label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => headerFileInputRef.current?.click()}
                      className="h-9 text-sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {headerSettings.imageConfig.dataUrl ? "Change Image" : "Upload Image"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsLibraryPickerOpen(true)}
                      className="h-9 text-sm bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20 gap-2 font-bold"
                    >
                      <FileImage className="h-4 w-4" /> Pick from Library
                    </Button>
                    <input
                      ref={headerFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    {headerSettings.imageConfig.dataUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="text-destructive h-9"
                      >
                        Remove Image
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Max size: 2MB. Recommended: 1920x400px. Image will cover the entire header.</p>
                </div>

                {headerSettings.imageConfig.dataUrl && (
                  <div className="relative h-32 rounded-lg overflow-hidden border">
                    <img
                      src={headerSettings.imageConfig.dataUrl}
                      alt="Header preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {!headerSettings.imageConfig.dataUrl && (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No image uploaded</p>
                    <p className="text-xs text-muted-foreground mt-1">Default color gradient will be used</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Size</label>
                    <select
                      value={headerSettings.imageConfig.size}
                      onChange={(e) => setHeaderSettings(prev => ({
                        ...prev,
                        imageConfig: { ...prev.imageConfig, size: e.target.value }
                      }))}
                      className="w-full h-9 rounded-md border px-2 text-sm"
                      disabled={!headerSettings.imageConfig.dataUrl}
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Position</label>
                    <select
                      value={headerSettings.imageConfig.position}
                      onChange={(e) => setHeaderSettings(prev => ({
                        ...prev,
                        imageConfig: { ...prev.imageConfig, position: e.target.value }
                      }))}
                      className="w-full h-9 rounded-md border px-2 text-sm"
                      disabled={!headerSettings.imageConfig.dataUrl}
                    >
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerSettings.overlay.enabled}
                      onChange={(e) => setHeaderSettings(prev => ({
                        ...prev,
                        overlay: { ...prev.overlay, enabled: e.target.checked }
                      }))}
                      className="h-4 w-4"
                      disabled={!headerSettings.imageConfig.dataUrl}
                    />
                    <span className="text-sm">Enable dark overlay for better text visibility</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Preview</label>
                <div
                  className="w-full rounded-lg overflow-hidden border relative"
                  style={{
                    height: `120px`,
                    background: headerSettings.imageConfig.dataUrl
                      ? 'transparent'
                      : `linear-gradient(to right, ${headerSettings.colorConfig.from}, ${headerSettings.colorConfig.via}, ${headerSettings.colorConfig.to})`,
                  }}
                >
                  {headerSettings.imageConfig.dataUrl && (
                    <img
                      src={headerSettings.imageConfig.dataUrl}
                      alt="Header preview"
                      className="absolute inset-0 w-full h-full"
                      style={{
                        objectFit: 'fill',
                        objectPosition: headerSettings.imageConfig.position || 'center',
                      }}
                    />
                  )}
                  {headerSettings.imageConfig.dataUrl && headerSettings.overlay.enabled && (
                    <div className="absolute inset-0" style={{ backgroundColor: headerSettings.overlay.color }} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center text-white font-medium drop-shadow-lg">
                    Header Preview
                  </div>
                </div>
              </div>

              {message && (
                <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${
                  message.includes("success") || message.includes("saved") || message.includes("Reset")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {message.includes("success") || message.includes("saved") || message.includes("Reset") ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSavingHeader}
                  className="h-9 text-sm"
                >
                  Reset to Default
                </Button>
                <Button
                  onClick={handleSaveHeader}
                  disabled={isSavingHeader}
                  className="h-9 text-sm min-w-[100px]"
                >
                  {isSavingHeader ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
        <AssetLibraryPicker
          open={isLibraryPickerOpen}
          onOpenChange={setIsLibraryPickerOpen}
          onSelect={(url) => {
            setHeaderSettings(prev => ({
              ...prev,
              backgroundType: "image",
              imageConfig: { ...prev.imageConfig, dataUrl: url }
            }));
            setIsLibraryPickerOpen(false);
          }}
        />
      </Card>
    );
  }

  // Asset Library Header Customization Card
  function AssetLibraryHeaderCustomizationCard() {
    const [settings, setSettings] = useState({
      images: [] as string[],
      displayMode: "single" as "single" | "carousel",
      overlayEnabled: true,
      overlayColor: "rgba(0,0,0,0.3)",
      height: 160,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isLibraryPickerOpen, setIsLibraryPickerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const compressImage = async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1080;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    useEffect(() => {
      const fetchSettings = async () => {
        setIsLoading(true);
        try {
          const res = await apiFetch<{ item: typeof settings }>("/api/asset-library-header-settings");
          if (res.item) {
            setSettings({
              images: res.item.images || [],
              displayMode: res.item.displayMode || "single",
              overlayEnabled: res.item.overlayEnabled ?? true,
              overlayColor: res.item.overlayColor || "rgba(0,0,0,0.3)",
              height: res.item.height || 160,
            });
          }
        } catch (e) {
          console.error("Failed to load asset library header settings", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSettings();
    }, []);

    const handleSave = async () => {
      setIsSaving(true);
      setMessage(null);
      try {
        await apiFetch("/api/asset-library-header-settings", {
          method: "PUT",
          body: JSON.stringify(settings),
        });
        setMessage("Asset library header settings saved!");
        window.dispatchEvent(new CustomEvent("asset-library-header-updated"));
      } catch (e) {
        setMessage("Failed to save settings");
      } finally {
        setIsSaving(false);
        setTimeout(() => setMessage(null), 3000);
      }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newImages: string[] = [];
      
      for (const file of files) {
        try {
          const compressed = await compressImage(file);
          newImages.push(compressed);
        } catch (err) {
          console.error("Failed to compress image", err);
          // Fallback to original if compression fails and it's not too large
          if (file.size <= 5 * 1024 * 1024) {
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            newImages.push(dataUrl);
          }
        }
      }

      if (newImages.length > 0) {
        setSettings(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (index: number) => {
      setSettings(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    };

    return (
      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Asset Library Header
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Display Mode</Label>
                    <p className="text-xs text-muted-foreground">Single image or carousel</p>
                  </div>
                  <div className="flex bg-muted rounded-md p-1">
                    <button
                      className={cn("px-3 py-1 text-xs rounded-md", settings.displayMode === "single" ? "bg-background shadow-sm" : "hover:text-foreground/70")}
                      onClick={() => setSettings(p => ({ ...p, displayMode: "single" }))}
                    >
                      Single
                    </button>
                    <button
                      className={cn("px-3 py-1 text-xs rounded-md", settings.displayMode === "carousel" ? "bg-background shadow-sm" : "hover:text-foreground/70")}
                      onClick={() => setSettings(p => ({ ...p, displayMode: "carousel" }))}
                    >
                      Carousel
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Header Images ({settings.images.length})</Label>
                  <div className="flex flex-wrap gap-3">
                    {settings.images.map((img, i) => (
                      <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border bg-muted">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all"
                      onClick={() => setIsLibraryPickerOpen(true)}
                    >
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Pick</span>
                    </button>
                    <button
                      className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Upload</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Header Height</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="range"
                        min="80"
                        max="300"
                        value={settings.height}
                        onChange={(e) => setSettings(p => ({ ...p, height: parseInt(e.target.value) }))}
                        className="h-9 px-0"
                      />
                      <span className="text-xs font-mono w-10 text-right">{settings.height}px</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Dark Overlay</Label>
                      <p className="text-[10px] text-muted-foreground">Enhance text legibility</p>
                    </div>
                    <Switch
                      checked={settings.overlayEnabled}
                      onCheckedChange={(val) => setSettings(p => ({ ...p, overlayEnabled: val }))}
                    />
                  </div>
                </div>

                {message && (
                  <div className={cn("p-3 rounded-md text-sm", message.includes("saved") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                    {message}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={isSaving} className="h-9">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Header Configuration"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <AssetLibraryPicker
          open={isLibraryPickerOpen}
          onOpenChange={setIsLibraryPickerOpen}
          onSelect={(url) => {
            setSettings(prev => ({
              ...prev,
              images: [...prev.images, url]
            }));
            setIsLibraryPickerOpen(false);
          }}
        />
      </Card>
    );
  }

  return (
    <>
      {/* Mobile-first container */}
      <div className="pl-12 space-y-4 sm:space-y-5 md:space-y-6 pr-2 sm:pr-0">

        {/* Page Header - Responsive */}
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Configure system-wide settings and preferences.
          </p>
        </div>

        {/* Settings Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">

          {/* Profile Card */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              {/* Profile Picture */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      {settings.avatarUrl && avatarUpload.status !== "uploading" ? (
                        <AvatarImage src={settings.avatarUrl} alt={settings.fullName || "Admin"} className="object-cover" crossOrigin="anonymous" />
                      ) : (
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {avatarUpload.status === "uploading" ? (
                            <Loader2 className="h-8 w-8 animate-spin" />
                          ) : (
                            initials
                          )}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUpload.status === "uploading"}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Change profile picture"
                    >
                      {avatarUpload.status === "uploading" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={avatarUpload.status === "uploading"}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Profile Picture</p>
                    <p className="text-sm text-muted-foreground">
                      {avatarUpload.status === "uploading"
                        ? "Uploading..."
                        : "Click the camera icon to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max size: 10MB (JPEG, PNG, GIF)
                    </p>
                  </div>
                </div>

                {/* Upload Status Message */}
                {avatarUpload.message && (
                  <div
                    className={`rounded-lg p-3 flex items-center gap-3 text-sm ${
                      avatarUpload.status === "success"
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border border-green-200 dark:border-green-800"
                        : avatarUpload.status === "error"
                        ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {avatarUpload.status === "success" && (
                      <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    )}
                    {avatarUpload.status === "error" && (
                      <XCircle className="h-5 w-5 flex-shrink-0" />
                    )}
                    {avatarUpload.status === "uploading" && (
                      <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
                    )}
                    <span>{avatarUpload.message}</span>
                  </div>
                )}
              </div>

              <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Crop profile picture</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="relative w-full h-72 bg-muted rounded-lg overflow-hidden">
                      {pendingImageSrc && (
                        <Cropper
                          image={pendingImageSrc}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Zoom</span>
                        <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setIsCropOpen(false);
                        setPendingImageSrc("");
                        setPendingFileName("");
                        setZoom(1);
                        setCrop({ x: 0, y: 0 });
                        setCroppedAreaPixels(null);
                      }}
                      disabled={avatarUpload.status === "uploading"}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="w-full sm:w-auto"
                      onClick={uploadCroppedAvatar}
                      disabled={avatarUpload.status === "uploading"}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium">Full Name</label>
                <Input
                  value={settings.fullName}
                  onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Founder Messages</p>
                  <p className="text-xs text-muted-foreground">
                    Show motivational messages on the dashboard
                  </p>
                </div>
                <button
                  onClick={handleToggleFounderMessages}
                  disabled={isLoadingFounderPref}
                  className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {isLoadingFounderPref ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : founderMsgEnabled ? (
                    <ToggleRight className="h-6 w-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Header Customization Card */}
          <HeaderCustomizationCard />

          {/* Asset Library Header Customization Card */}
          <AssetLibraryHeaderCustomizationCard />

          {/* Security Card */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              <div className="rounded-md border p-3 sm:p-4 space-y-3">
                <p className="text-sm sm:text-base font-medium">Change Password</p>
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium">Current Password</label>
                  <Input
                    type="password"
                    value={passwordDraft.currentPassword}
                    onChange={(e) => setPasswordDraft((p) => ({ ...p, currentPassword: e.target.value }))}
                    className="h-9 sm:h-10 text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-medium">New Password</label>
                    <Input
                      type="password"
                      value={passwordDraft.newPassword}
                      onChange={(e) => setPasswordDraft((p) => ({ ...p, newPassword: e.target.value }))}
                      className="h-9 sm:h-10 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-medium">Confirm New Password</label>
                    <Input
                      type="password"
                      value={passwordDraft.confirmNewPassword}
                      onChange={(e) => setPasswordDraft((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                      className="h-9 sm:h-10 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="rounded-md bg-destructive/10 p-2">
                    <p className="text-xs sm:text-sm text-destructive break-words">{passwordError}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={onChangePassword}
                    disabled={passwordSaving || !passwordDraft.currentPassword || !passwordDraft.newPassword}
                    className="h-9 sm:h-10 text-sm sm:text-base"
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Data Migration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Import company data from external systems.
              </p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/asana-import")}
                  className="h-9 sm:h-10 text-sm sm:text-base"
                >
                  Import from Asana
                </Button>
                </div>
              </CardContent>
            </Card>

            {/* Productivity Feedback (Reward System) */}
            <Card className="shadow-soft border-0 sm:border">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
                <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Productivity Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Task Completion Animations</Label>
                    <p className="text-xs text-muted-foreground">Subtle visual feedback when finishing a task</p>
                  </div>
                  <Switch
                    checked={settings.rewardSettings.animationsEnabled}
                    onCheckedChange={(val) => handleRewardSettingChange("animationsEnabled", val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Haptic Feedback</Label>
                    <p className="text-xs text-muted-foreground">Vibration on supported devices</p>
                  </div>
                  <Switch
                    checked={settings.rewardSettings.hapticsEnabled}
                    onCheckedChange={(val) => handleRewardSettingChange("hapticsEnabled", val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Audio Confirmation</Label>
                    <p className="text-xs text-muted-foreground">Subtle ascending tone upon completion</p>
                  </div>
                  <Switch
                    checked={settings.rewardSettings.soundEnabled}
                    onCheckedChange={(val) => handleRewardSettingChange("soundEnabled", val)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>


        {/* Save Changes Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          {saveMessage && (
            <p className={`text-sm ${saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {saveMessage}
            </p>
          )}
          <div className="flex gap-3 ml-auto">
            <Button
              variant="outline"
              onClick={() => {
                const saved = loadSettings();
                setSettings(saved);
                setSaveMessage("Changes discarded");
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button
              onClick={saveChanges}
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Footer Note - Only visible on mobile */}
        <div className="block sm:hidden text-center">
          <p className="text-xs text-muted-foreground">
            Settings are saved automatically in your browser
          </p>
        </div>
      </div>
    </>
  );
}