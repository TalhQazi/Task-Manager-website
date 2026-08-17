import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { FiledPatents } from "@/components/admin/FiledPatents";
import { PendingPatents } from "@/components/admin/PendingPatents";
import { ExpirationWatch } from "@/components/admin/ExpirationWatch";
import { FiledTrademarks } from "@/components/admin/FiledTrademarks";
import { GrantedTrademarks } from "@/components/admin/GrantedTrademarks";
import { ExpiredPatents } from "@/components/admin/ExpiredPatents";
import {
  AlertCircle, FileText, Globe, ShieldCheck, Mail, Clock,
  Settings, Plus, X, Send, RefreshCw, CheckCircle, Loader2, Save,
  ChevronDown, ChevronUp, Bell,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type NotificationSettings = {
  notificationDays: number[];
  smtpConfigured: boolean;
  templateEnabled: boolean;
};

export function IntellectualProperty() {
  const [activeTab, setActiveTab] = useState("filed-patents");
  const queryClient = useQueryClient();
  const auth = getAuthState();
  const isAdmin = auth.role === "super-admin" || auth.role === "admin";

  // Notification settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newDay, setNewDay] = useState("");
  const [localDays, setLocalDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [forceChecking, setForceChecking] = useState(false);
  const [settingsInitialized, setSettingsInitialized] = useState(false);

  // Queries
  const filedQuery = useQuery<any[]>({
    queryKey: ["filed-patents"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/patents/filed");
      return res.items || [];
    },
  });

  const pendingQuery = useQuery<any[]>({
    queryKey: ["pending-patents"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/patents/pending");
      return res.items || [];
    },
  });

  const watchQuery = useQuery<any[]>({
    queryKey: ["expiration-watch-count"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/patents/expiration-watch");
      return res.items || [];
    },
  });

  const notifSettingsQuery = useQuery<NotificationSettings>({
    queryKey: ["patent-notification-settings"],
    queryFn: async () => {
      const res = await apiFetch<{ item: NotificationSettings }>("/api/patents/notification-settings");
      return res.item;
    },
    enabled: isAdmin,
  });

  // Sync local days from server when settings are first loaded
  if (notifSettingsQuery.data && !settingsInitialized) {
    setLocalDays([...notifSettingsQuery.data.notificationDays]);
    setSettingsInitialized(true);
  }

  const filedCount = filedQuery.data?.length || 0;
  const pendingCount = pendingQuery.data?.length || 0;
  const expiringCount = watchQuery.data?.length || 0;

  const handleAddDay = useCallback(() => {
    const val = Math.round(Number(newDay));
    if (!Number.isFinite(val) || val <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }
    if (localDays.includes(val)) {
      toast.error(`${val} days is already in the list`);
      return;
    }
    setLocalDays((prev) => [...prev, val].sort((a, b) => a - b));
    setNewDay("");
  }, [newDay, localDays]);

  const handleRemoveDay = useCallback((day: number) => {
    setLocalDays((prev) => prev.filter((d) => d !== day));
  }, []);

  const handleSaveSettings = useCallback(async () => {
    if (localDays.length === 0) {
      toast.error("At least one notification day is required");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/patents/notification-settings", {
        method: "PUT",
        body: JSON.stringify({ notificationDays: localDays }),
        headers: { "Content-Type": "application/json" },
      });
      queryClient.invalidateQueries({ queryKey: ["patent-notification-settings"] });
      toast.success("Notification settings saved successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  }, [localDays, queryClient]);

  const handleTestEmail = useCallback(async () => {
    setTestingEmail(true);
    try {
      const res = await apiFetch<{ message: string }>("/api/patents/test-expiration-email", {
        method: "POST",
      });
      toast.success(res.message || "Test email sent!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send test email. Check SMTP settings.");
    } finally {
      setTestingEmail(false);
    }
  }, []);

  const handleForceCheck = useCallback(async () => {
    setForceChecking(true);
    try {
      const res = await apiFetch<{ message: string; checked: number; expiring: number; notified: number }>("/api/patents/check-expirations", {
        method: "POST",
      });
      toast.success(`Check complete — ${res.checked} patents checked, ${res.expiring} expiring, ${res.notified} emails sent`);
      queryClient.invalidateQueries({ queryKey: ["expiration-watch-count"] });
      queryClient.invalidateQueries({ queryKey: ["filed-patents"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to run expiration check");
    } finally {
      setForceChecking(false);
    }
  }, [queryClient]);

  const smtpConfigured = notifSettingsQuery.data?.smtpConfigured ?? false;
  const templateEnabled = notifSettingsQuery.data?.templateEnabled ?? true;

  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Intellectual Property Management
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Manage and track patents and trademarks with automated Expiration Date monitoring, real-time search, and instant Admin email alerts.
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-800 dark:text-blue-300">
            <FileText size={16} />
            <span>{filedCount} Filed</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold text-purple-800 dark:text-purple-300">
            <Clock size={16} />
            <span>{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-300">
            <AlertCircle size={16} />
            <span>{expiringCount} Expiring Soon</span>
          </div>
        </div>
      </div>

      {/* Notification Settings Panel — Admin / Super-Admin Only */}
      {isAdmin && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/80 to-blue-50/40 dark:from-indigo-950/30 dark:to-blue-950/20 overflow-hidden">
          <CardContent className="p-0">
            {/* Collapsible header */}
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-100/40 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <Settings className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    Patent Expiration Notification Settings
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 rounded-full">ADMIN</span>
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400">
                    Configure notification days, test emails, and force expiration checks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* SMTP status indicator */}
                <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  smtpConfigured
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${smtpConfigured ? "bg-emerald-500" : "bg-red-500"}`} />
                  SMTP {smtpConfigured ? "OK" : "NOT SET"}
                </div>
                {/* Template status indicator */}
                <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  templateEnabled
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                }`}>
                  <Mail className="h-2.5 w-2.5" />
                  Template {templateEnabled ? "ON" : "OFF"}
                </div>
                {settingsOpen ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-indigo-500" />}
              </div>
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4 border-t border-indigo-200/60 dark:border-indigo-800/60 pt-4">
                    {/* SMTP warning */}
                    {!smtpConfigured && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-700 dark:text-red-300">
                          <strong>SMTP not configured.</strong> Go to <strong>System Email Settings</strong> to set up SMTP host, user, and password before expiration emails can be sent.
                        </p>
                      </div>
                    )}

                    {!templateEnabled && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          <strong>Patent Expiration template is disabled.</strong> Enable it in <strong>System Email Settings</strong> to receive email alerts.
                        </p>
                      </div>
                    )}

                    {/* Notification Days Section */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5" />
                        Notification Alert Days (before expiration)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {localDays.map((day) => (
                          <Badge
                            key={day}
                            variant="outline"
                            className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-800 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 flex items-center gap-1.5 group hover:border-red-400 transition-colors"
                          >
                            {day} {day === 1 ? "day" : "days"}
                            <button
                              onClick={() => handleRemoveDay(day)}
                              className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        {localDays.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">No notification days set</span>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          min={1}
                          placeholder="Add days (e.g. 45)"
                          value={newDay}
                          onChange={(e) => setNewDay(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddDay();
                            }
                          }}
                          className="w-40 h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddDay}
                          className="h-8 text-xs gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        {saving ? "Saving..." : "Save Settings"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTestEmail}
                        disabled={testingEmail || !smtpConfigured}
                        className="h-8 text-xs gap-1.5 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        {testingEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        {testingEmail ? "Sending..." : "Send Test Email"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleForceCheck}
                        disabled={forceChecking}
                        className="h-8 text-xs gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        {forceChecking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        {forceChecking ? "Checking..." : "Force Check Now"}
                      </Button>
                    </div>

                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Emails are automatically sent to all active <strong>Admins</strong>, <strong>Super-Admins</strong>, and <strong>Managers</strong> when a patent enters any of the configured notification windows. The <strong>Test Email</strong> button sends a sample alert to your own inbox.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Legacy banner for non-admin users */}
      {!isAdmin && (
        <Card className="border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4 flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span>Admin Email Notification System Active</span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-full">AUTO-ALERT</span>
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Automated emails are sent to all active <strong>Admins</strong> and <strong>Super-Admins</strong> whenever a patent is filed, or when a patent expiration date is approaching.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2 p-1 bg-muted/50 w-fit">
          <TabsTrigger value="filed-patents" className="px-4 py-2">Filed Patents ({filedCount})</TabsTrigger>
          <TabsTrigger value="pending-patents" className="px-4 py-2">Pending Patents ({pendingCount})</TabsTrigger>
          <TabsTrigger value="expired-patents" className="px-4 py-2">Expired Patents</TabsTrigger>
          <TabsTrigger value="filed-trademarks" className="px-4 py-2">Filed Trademarks</TabsTrigger>
          <TabsTrigger value="granted-trademarks" className="px-4 py-2">Granted Trademarks</TabsTrigger>
          <TabsTrigger value="expiration-watch" className="px-4 py-2 flex items-center gap-1.5">
            <span>Expiration Watch</span>
            {expiringCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">{expiringCount}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="filed-patents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Filed Patents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FiledPatents />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-patents">
          <PendingPatents />
        </TabsContent>

        <TabsContent value="expired-patents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Expired Patents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpiredPatents />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filed-trademarks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Globe className="h-5 w-5" />
                Filed Trademarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FiledTrademarks />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="granted-trademarks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <ShieldCheck className="h-5 w-5" />
                Granted Trademarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GrantedTrademarks />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiration-watch">
          <ExpirationWatch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
