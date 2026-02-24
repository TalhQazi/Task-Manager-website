import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";

type SettingsState = {
  companyName: string;
  supportEmail: string;
  timezone: string;
  notificationsEnabled: boolean;
  autoLogoutMinutes: number;
};

const SETTINGS_STORAGE_KEY = "app_settings";

const defaultSettings: SettingsState = {
  companyName: "TaskFlow",
  supportEmail: "support@taskflow.com",
  timezone: "UTC+05:00",
  notificationsEnabled: true,
  autoLogoutMinutes: 0,
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
    };
  } catch {
    return defaultSettings;
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

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
        };
      }>("/api/settings");
    },
  });

  useEffect(() => {
    const item = backendSettingsQuery.data?.item;
    if (!item) return;
    setSettings((prev) => ({
      companyName: typeof item.companyName === "string" ? item.companyName : prev.companyName,
      supportEmail: typeof item.supportEmail === "string" ? item.supportEmail : prev.supportEmail,
      timezone: typeof item.timezone === "string" ? item.timezone : prev.timezone,
      notificationsEnabled:
        typeof item.notificationsEnabled === "boolean" ? item.notificationsEnabled : prev.notificationsEnabled,
      autoLogoutMinutes:
        typeof item.autoLogoutMinutes === "number" ? item.autoLogoutMinutes : prev.autoLogoutMinutes,
    }));
  }, [backendSettingsQuery.data]);

  const notifications = backendSettingsQuery.data?.item?.notifications || {};
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

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (backendSettingsQuery.isLoading) return;
    const t = setTimeout(() => {
      void apiFetch<{ item: any }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          companyName: settings.companyName,
          supportEmail: settings.supportEmail,
          timezone: settings.timezone,
          notificationsEnabled: settings.notificationsEnabled,
          autoLogoutMinutes: settings.autoLogoutMinutes,
        }),
      }).then(() => backendSettingsQuery.refetch());
    }, 300);
    return () => clearTimeout(t);
  }, [
    settings.companyName,
    settings.supportEmail,
    settings.timezone,
    settings.notificationsEnabled,
    settings.autoLogoutMinutes,
  ]);

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

  return (
    <AdminLayout>
      {/* Mobile-first container */}
      <div className="space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
        
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
          
          {/* Organization Card */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium">
                  Company Name
                </label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium">
                  Support Email
                </label>
                <Input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium">
                  Timezone
                </label>
                <Input
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium">
                  Auto Logout (minutes)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={settings.autoLogoutMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoLogoutMinutes: Number(e.target.value),
                    })
                  }
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Set 0 to disable. (UI-only setting for now)
                </p>
              </div>
              
              {/* Session Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border p-3 sm:p-4">
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-medium">Session</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Login required for admin routes
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit sm:w-auto text-xs sm:text-sm">
                  Enabled
                </Badge>
              </div>

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

          {/* Notifications Card - Full width on mobile, spans 2 columns on desktop */}
          <Card className="shadow-soft border-0 sm:border lg:col-span-2">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              
              {/* Notification Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border p-3 sm:p-4">
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-medium">Enable Notifications</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Allow in-app notifications
                  </p>
                </div>
                
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="text-xs sm:hidden">
                    {settings.notificationsEnabled ? 'On' : 'Off'}
                  </span>
                  <button
                    onClick={() =>
                      setSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })
                    }
                    className={`
                      relative h-7 w-12 sm:h-8 sm:w-14 rounded-full transition-colors flex items-center px-1
                      ${settings.notificationsEnabled ? "bg-accent" : "bg-muted"}
                      focus:outline-none focus:ring-2 focus:ring-accent/50
                    `}
                    aria-label="Toggle notifications"
                  >
                    <span
                      className={`
                        h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-background shadow-md transition-transform duration-200
                        ${settings.notificationsEnabled ? "translate-x-5 sm:translate-x-6" : "translate-x-0"}
                      `}
                    />
                  </button>
                </div>
              </div>

              <div className="rounded-md border p-3 sm:p-4 space-y-3">
                <p className="text-sm sm:text-base font-medium">Notification Preferences</p>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Email Notifications</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void setBackendNotification("emailNotifications", !Boolean(notifications.emailNotifications))}
                    className={
                      `relative h-7 w-12 sm:h-8 sm:w-14 rounded-full transition-colors flex items-center px-1 ` +
                      `${Boolean(notifications.emailNotifications) ? "bg-accent" : "bg-muted"}`
                    }
                    aria-label="Toggle email notifications"
                  >
                    <span
                      className={
                        `h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-background shadow-md transition-transform duration-200 ` +
                        `${Boolean(notifications.emailNotifications) ? "translate-x-5 sm:translate-x-6" : "translate-x-0"}`
                      }
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Task Alerts</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Get notified about task updates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void setBackendNotification("taskAlerts", !Boolean(notifications.taskAlerts))}
                    className={
                      `relative h-7 w-12 sm:h-8 sm:w-14 rounded-full transition-colors flex items-center px-1 ` +
                      `${Boolean(notifications.taskAlerts) ? "bg-accent" : "bg-muted"}`
                    }
                    aria-label="Toggle task alerts"
                  >
                    <span
                      className={
                        `h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-background shadow-md transition-transform duration-200 ` +
                        `${Boolean(notifications.taskAlerts) ? "translate-x-5 sm:translate-x-6" : "translate-x-0"}`
                      }
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Employee Updates</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Clock in/out notifications</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void setBackendNotification("employeeUpdates", !Boolean(notifications.employeeUpdates))}
                    className={
                      `relative h-7 w-12 sm:h-8 sm:w-14 rounded-full transition-colors flex items-center px-1 ` +
                      `${Boolean(notifications.employeeUpdates) ? "bg-accent" : "bg-muted"}`
                    }
                    aria-label="Toggle employee updates"
                  >
                    <span
                      className={
                        `h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-background shadow-md transition-transform duration-200 ` +
                        `${Boolean(notifications.employeeUpdates) ? "translate-x-5 sm:translate-x-6" : "translate-x-0"}`
                      }
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Weekly Reports</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Summary emails every Monday</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void setBackendNotification("weeklyReports", !Boolean(notifications.weeklyReports))}
                    className={
                      `relative h-7 w-12 sm:h-8 sm:w-14 rounded-full transition-colors flex items-center px-1 ` +
                      `${Boolean(notifications.weeklyReports) ? "bg-accent" : "bg-muted"}`
                    }
                    aria-label="Toggle weekly reports"
                  >
                    <span
                      className={
                        `h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-background shadow-md transition-transform duration-200 ` +
                        `${Boolean(notifications.weeklyReports) ? "translate-x-5 sm:translate-x-6" : "translate-x-0"}`
                      }
                    />
                  </button>
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSettings(defaultSettings);
                  }}
                  className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
                >
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note - Only visible on mobile */}
        <div className="block sm:hidden text-center">
          <p className="text-xs text-muted-foreground">
            Settings are saved automatically in your browser
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}