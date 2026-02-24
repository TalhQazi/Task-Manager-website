import { useEffect, useState } from "react";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Switch } from "@/components/manger/ui/switch";
import { Separator } from "@/components/manger/ui/separator";
import { User, Bell, Shield, Globe, Save } from "lucide-react";
import { apiFetch } from "@/lib/manger/api";
import { toast } from "@/components/manger/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type SettingsItem = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  notifications?: {
    emailNotifications?: boolean;
    taskAlerts?: boolean;
    employeeUpdates?: boolean;
    weeklyReports?: boolean;
  };
  language?: string;
  timezone?: string;
};

export default function Settings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      return apiFetch<{ item: SettingsItem }>("/api/settings");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch<{ item: any }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      return apiFetch<{ ok: true }>("/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
  });

  const [draft, setDraft] = useState<any>(null);
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    if (settingsQuery.data?.item) {
      setDraft(settingsQuery.data.item);
    }
  }, [settingsQuery.data]);

  const onSave = () => {
    if (!draft) return;

    saveMutation.mutate(draft, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["settings"] });
        toast({ title: "Saved", description: "Settings updated." });
      },
      onError: (err) => {
        toast({
          title: "Failed to save",
          description: err instanceof Error ? err.message : "Something went wrong",
        });
      },
    });
  };

  const setNotification = (key: string, value: boolean) => {
    setDraft((p: any) => {
      const next = {
        ...(p || {}),
        notifications: {
          ...((p && p.notifications) || {}),
          [key]: value,
        },
      };

      saveMutation.mutate(next, {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
      });

      return next;
    });
  };

  const onChangePassword = () => {
    const currentPassword = passwordDraft.currentPassword;
    const newPassword = passwordDraft.newPassword;
    const confirmNewPassword = passwordDraft.confirmNewPassword;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({ title: "Missing fields", description: "Please fill all password fields." });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Password mismatch", description: "New password and confirm password do not match." });
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setPasswordDraft({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
          toast({ title: "Password updated", description: "Please use the new password next time you log in." });
        },
        onError: (err) => {
          toast({
            title: "Failed to change password",
            description: err instanceof Error ? err.message : "Something went wrong",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Profile Settings</h3>
            <p className="text-sm text-muted-foreground">
              Update your personal information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Full Name
            </label>
            <Input
              value={draft?.fullName ?? ""}
              onChange={(e) => setDraft((p: any) => ({ ...p, fullName: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Email Address
            </label>
            <Input
              value={draft?.email ?? ""}
              onChange={(e) => setDraft((p: any) => ({ ...p, email: e.target.value }))}
              type="email"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Phone Number
            </label>
            <Input
              value={draft?.phone ?? ""}
              onChange={(e) => setDraft((p: any) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Role
            </label>
            <Input value={draft?.role ?? ""} disabled />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Configure how you receive notifications
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <Switch
              checked={Boolean(draft?.notifications?.emailNotifications)}
              onCheckedChange={(checked) => setNotification("emailNotifications", checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Task Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified about task updates
              </p>
            </div>
            <Switch
              checked={Boolean(draft?.notifications?.taskAlerts)}
              onCheckedChange={(checked) => setNotification("taskAlerts", checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Employee Updates</p>
              <p className="text-sm text-muted-foreground">
                Clock in/out notifications
              </p>
            </div>
            <Switch
              checked={Boolean(draft?.notifications?.employeeUpdates)}
              onCheckedChange={(checked) => setNotification("employeeUpdates", checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Weekly Reports</p>
              <p className="text-sm text-muted-foreground">
                Summary emails every Monday
              </p>
            </div>
            <Switch
              checked={Boolean(draft?.notifications?.weeklyReports)}
              onCheckedChange={(checked) => setNotification("weeklyReports", checked)}
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Security</h3>
            <p className="text-sm text-muted-foreground">
              Manage your security preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Current Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordDraft.currentPassword}
              onChange={(e) => setPasswordDraft((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                New Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordDraft.newPassword}
                onChange={(e) => setPasswordDraft((p) => ({ ...p, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Confirm New Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordDraft.confirmNewPassword}
                onChange={(e) => setPasswordDraft((p) => ({ ...p, confirmNewPassword: e.target.value }))}
              />
            </div>
          </div>
          <Button variant="outline" onClick={onChangePassword} disabled={changePasswordMutation.isPending}>
            Change Password
          </Button>
        </div>
      </div>

      {/* Language & Region */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Language & Region</h3>
            <p className="text-sm text-muted-foreground">
              Set your preferred language and timezone
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Language
            </label>
            <Input
              value={draft?.language ?? ""}
              onChange={(e) => setDraft((p: any) => ({ ...p, language: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Timezone
            </label>
            <Input
              value={draft?.timezone ?? ""}
              onChange={(e) => setDraft((p: any) => ({ ...p, timezone: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="gap-2" onClick={onSave} disabled={saveMutation.isPending || settingsQuery.isLoading}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
