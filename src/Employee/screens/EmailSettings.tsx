import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Switch } from "@/components/admin/ui/switch";
import { Label } from "@/components/admin/ui/label";
import { employeeApiFetch } from "@/Employee/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Bell, Save, CheckCircle, AlertCircle, Send, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import NotificationSettingsTable from "@/components/shared/NotificationSettingsTable";

type EmailPreferences = {
  userRegistration: boolean;
  managerRegistration: boolean;
  forgotPassword: boolean;
  taskAssignment: boolean;
  fileAttachment: boolean;
  commentAdded: boolean;
  replyAdded: boolean;
  projectAssignment: boolean;
  projectReassignment: boolean;
};

type Template = {
  enabled: boolean;
  subject: string;
  body: string;
};

type SystemEmailSettings = {
  templates: {
    userRegistration: Template;
    managerRegistration: Template;
    forgotPassword: Template;
    taskAssignment: Template;
    fileAttachment: Template;
    commentAdded: Template;
    replyAdded: Template;
    projectAssignment: Template;
    projectReassignment: Template;
  };
};

type EmployeeEmailSettings = {
  preferences: EmailPreferences;
};

export default function EmployeeEmailSettings() {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Test email state
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);
      const res = await employeeApiFetch<{ ok: boolean; message: string }>("/api/email/test", {
        method: "POST",
      });
      setTestResult({ ok: true, message: res.message || "Test email sent successfully!" });
      toast.success("Test email sent!");
    } catch (err: any) {
      let msg = err?.message || "Failed to send test email.";
      setTestResult({ ok: false, message: msg });
      toast.error("Test failed — see details below");
    } finally {
      setTestLoading(false);
    }
  };

  // Fetch employee email preferences
  const { data: employeeData, isLoading: employeeLoading, error: employeeError } = useQuery({
    queryKey: ["employee-email-settings"],
    queryFn: async () => {
      const res = await employeeApiFetch<{ item: EmployeeEmailSettings }>("/api/email/settings");
      return res.item;
    },
  });

  // Fetch system email templates
  const { data: systemData, isLoading: systemLoading, error: systemError } = useQuery({
    queryKey: ["system-email-templates"],
    queryFn: async () => {
      const res = await employeeApiFetch<{ item: SystemEmailSettings }>("/api/email/system-templates");
      return res.item;
    },
  });

  const [formData, setFormData] = useState<EmployeeEmailSettings | null>(null);

  useEffect(() => {
    if (employeeData) {
      setFormData(employeeData);
    }
  }, [employeeData]);

  const mutation = useMutation({
    mutationFn: async (updatedSettings: EmployeeEmailSettings) => {
      return employeeApiFetch("/api/email/settings", {
        method: "PUT",
        body: JSON.stringify(updatedSettings),
      });
    },
    onSuccess: () => {
      setIsSaving(false);
      toast.success("Email preferences updated");
      queryClient.invalidateQueries({ queryKey: ["employee-email-settings"] });
    },
    onError: (err: any) => {
      setIsSaving(false);
      toast.error(err.message || "Failed to update preferences");
    },
  });

  // Auto-save debounced function
  const autoSave = (data: EmployeeEmailSettings) => {
    setIsSaving(true);
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      mutation.mutate(data);
    }, 1000);
  };

  if (employeeLoading || systemLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (employeeError || systemError || !formData || !systemData) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Error loading settings</h2>
        <p className="text-muted-foreground">{(employeeError as any)?.message || (systemError as any)?.message || "Something went wrong"}</p>
      </div>
    );
  }

  const onPreferenceChange = (type: "email" | "web", key: string, value: boolean) => {
    setFormData((prev: any) => {
      if (!prev) return null;
      const prefKey = type === "email" ? "preferences" : "webPreferences";
      const updated = {
        ...prev,
        [prefKey]: {
          ...(prev[prefKey] || {}),
          [key]: value,
        },
      };
      // Auto-save immediately
      autoSave(updated);
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      setIsSaving(true);
      mutation.mutate(formData);
    }
  };

  const templateDescriptions: Record<keyof EmailPreferences, { title: string; description: string }> = {
    userRegistration: { title: "User Registration", description: "Sent when a new employee or user is registered" },
    managerRegistration: { title: "Manager Registration", description: "Sent when a new manager account is created" },
    forgotPassword: { title: "Forgot Password", description: "Sent when a user requests a password reset" },
    taskAssignment: { title: "Task Assignment", description: "Sent when you are assigned a new task" },
    fileAttachment: { title: "File Attachment", description: "Sent when a file is attached to a task" },
    commentAdded: { title: "Task Comment", description: "Sent when a comment is added to a task" },
    replyAdded: { title: "Comment Reply / Mention", description: "Sent when you are mentioned or replied to in a comment" },
    projectAssignment: { title: "Project Assignment", description: "Sent when you are assigned to a new project" },
    projectReassignment: { title: "Project Reassignment", description: "Sent when a project is reassigned to you" },
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl px-4 md:px-8 space-y-6 pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">Email Notification Settings</h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Personal Preferences
            </span>
          </div>
          <p className="text-muted-foreground">
            Manage which email notifications you want to receive from the system. Email templates and SMTP configuration are managed by your administrator.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
        {/* Email Notification Preferences */}
        <Card className="shadow-md border-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose which email and in-app alerts you want to receive</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <NotificationSettingsTable
              emailPreferences={formData.preferences || {}}
              webPreferences={formData.webPreferences || {}}
              userRole="employee"
              onChange={onPreferenceChange}
            />
          </CardContent>
        </Card>

        {/* Email Templates Preview */}
        <Card className="shadow-md border-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setShowDetails(!showDetails)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Email Templates Preview
                    <span className="text-xs font-bold px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      READ-ONLY
                    </span>
                  </CardTitle>
                  <CardDescription>View the email templates configured in the system (managed by administrator)</CardDescription>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{showDetails ? "Hide" : "Show"}</span>
            </div>
          </CardHeader>
          {showDetails && (
            <CardContent className="pt-6 space-y-6">
              {Object.entries(systemData.templates).map(([key, template]) => (
                <div key={key} className="border border-border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">{templateDescriptions[key as keyof EmailPreferences].title}</div>
                      <p className="text-xs text-muted-foreground mt-1">{templateDescriptions[key as keyof EmailPreferences].description}</p>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                      template.enabled 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {template.enabled ? "ENABLED" : "DISABLED"}
                    </div>
                  </div>
                  {template.enabled && (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-xs text-muted-foreground">Subject:</span>
                        <p className="mt-1 font-mono text-xs bg-background p-2 rounded border border-border">{template.subject}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-muted-foreground">Body Preview:</span>
                        <p className="mt-1 font-mono text-xs bg-background p-2 rounded border border-border line-clamp-3">{template.body}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Test Email */}
        <Card className="shadow-md border-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Test Email</CardTitle>
                <CardDescription>
                  Send a test notification email to verify your email is configured correctly. Test will be sent to your registered email address.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => void handleTestEmail()}
                disabled={testLoading}
                className="gap-2 shrink-0"
              >
                {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {testLoading ? "Sending..." : "Send Test Email"}
              </Button>
            </div>

            {testResult && (
              <div className={`flex items-start gap-3 rounded-lg p-4 border text-sm ${
                testResult.ok
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}>
                {testResult.ok
                  ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-semibold">{testResult.ok ? "Success" : "Failed"}</p>
                  <p className="mt-0.5 font-mono text-xs break-all whitespace-pre-wrap">{testResult.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Auto-saving...
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            className="px-8 gap-2 font-bold shadow-lg shadow-primary/20"
            disabled={mutation.isPending || isSaving}
          >
            {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {mutation.isPending ? "Saving..." : "Save All"}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
