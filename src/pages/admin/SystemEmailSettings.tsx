import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Switch } from "@/components/admin/ui/switch";
import { Label } from "@/components/admin/ui/label";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Shield, Save, CheckCircle, AlertCircle, Eye, EyeOff, Send, FlaskConical } from "lucide-react";
import { toast } from "sonner";

type EmailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  fromAddress: string;
};

type Template = {
  enabled: boolean;
  subject: string;
  body: string;
};

type SystemSettings = {
  emailConfig: EmailConfig;
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

export default function SystemEmailSettings() {
  const queryClient = useQueryClient();
  const [showPass, setShowPass] = useState(false);

  // Test email state
  const [testTo, setTestTo] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    if (!testTo.trim()) { toast.error("Enter a recipient email address"); return; }
    try {
      setTestLoading(true);
      setTestResult(null);
      const res = await apiFetch<{ ok: boolean; message: string }>("/api/system-settings/test-email", {
        method: "POST",
        body: JSON.stringify({ to: testTo.trim() }),
      });
      setTestResult({ ok: true, message: res.message || "Test email sent successfully!" });
      toast.success("Test email sent!");
    } catch (err: any) {
      let msg = err?.message || "Failed to send test email.";
      if (msg.toLowerCase().includes("app password") || msg.includes("535")) {
        msg += "\n\n→ Your provider requires an App Password. Use the provider-specific link in the Password field above to create one.";
      } else if (msg.toLowerCase().includes("self signed") || msg.toLowerCase().includes("certificate")) {
        msg += "\n\n→ Certificate error — this is usually safe to ignore for internal SMTP servers. If it persists, check your host/port settings.";
      } else if (msg.toLowerCase().includes("econnrefused") || msg.toLowerCase().includes("timeout")) {
        msg += "\n\n→ Could not connect. Check that the SMTP Host and Port are correct, and that port " + (formData?.emailConfig?.port || 587) + " is not blocked by your firewall.";
      }
      setTestResult({ ok: false, message: msg });
      toast.error("Test failed — see details below");
    } finally {
      setTestLoading(false);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const res = await apiFetch<{ item: SystemSettings }>("/api/system-settings");
      return res.item;
    },
  });

  const [formData, setFormData] = useState<SystemSettings | null>(null);

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (updatedSettings: SystemSettings) => {
      return apiFetch("/api/system-settings", {
        method: "PUT",
        body: JSON.stringify(updatedSettings),
      });
    },
    onSuccess: () => {
      toast.success("System settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update settings");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Error loading settings</h2>
        <p className="text-muted-foreground">{(error as any)?.message || "Something went wrong"}</p>
      </div>
    );
  }

  const handleConfigChange = (field: keyof EmailConfig, value: any) => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        emailConfig: {
          ...prev.emailConfig,
          [field]: value,
        },
      };
    });
  };

  const handleTemplateChange = (key: keyof SystemSettings["templates"], field: keyof Template, value: any) => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        templates: {
          ...prev.templates,
          [key]: {
            ...prev.templates[key],
            [field]: value,
          },
        },
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      mutation.mutate(formData);
    }
  };

  return (
    <div className="pl-12 space-y-6 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">System Email Settings</h1>
        <p className="text-muted-foreground">
          Configure SMTP and automated email templates for the entire system.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
        {/* SMTP Configuration */}
        <Card className="shadow-md border-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>Configure your email server settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                id="host"
                placeholder="smtp.example.com"
                value={formData.emailConfig.host}
                onChange={(e) => handleConfigChange("host", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="587"
                value={formData.emailConfig.port}
                onChange={(e) => handleConfigChange("port", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user">Username / Email</Label>
              <Input
                id="user"
                placeholder="noreply@example.com"
                value={formData.emailConfig.user}
                onChange={(e) => handleConfigChange("user", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Password</Label>
              <div className="relative">
                <Input
                  id="pass"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.emailConfig.pass}
                  onChange={(e) => handleConfigChange("pass", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromAddress">From Address</Label>
              <Input
                id="fromAddress"
                placeholder="Task Manager By Reardon <noreply@reardon.com>"
                value={formData.emailConfig.fromAddress}
                onChange={(e) => handleConfigChange("fromAddress", e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="secure"
                checked={formData.emailConfig.secure}
                onCheckedChange={(val) => handleConfigChange("secure", val)}
              />
              <Label htmlFor="secure">Use SSL/TLS (Secure Connection)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Email Templates</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* User Registration */}
            <TemplateCard
              title="User Registration"
              description="Sent when a new employee or user is registered"
              template={formData.templates.userRegistration}
              onChange={(field, val) => handleTemplateChange("userRegistration", field, val)}
              placeholders={["{name}"]}
            />

            {/* Manager Registration */}
            <TemplateCard
              title="Manager Registration"
              description="Sent when a new manager account is created"
              template={formData.templates.managerRegistration}
              onChange={(field, val) => handleTemplateChange("managerRegistration", field, val)}
              placeholders={["{name}"]}
            />

            {/* Forgot Password */}
            <TemplateCard
              title="Forgot Password"
              description="Sent when a user requests a password reset"
              template={formData.templates.forgotPassword}
              onChange={(field, val) => handleTemplateChange("forgotPassword", field, val)}
              placeholders={["{name}", "{code}"]}
            />

            {/* Task Assignment */}
            <TemplateCard
              title="Task Assignment"
              description="Sent when a user is assigned a new task"
              template={formData.templates.taskAssignment}
              onChange={(field, val) => handleTemplateChange("taskAssignment", field, val)}
              placeholders={["{name}", "{taskTitle}", "{projectName}", "{priority}", "{dueDate}", "{description}"]}
            />

            {/* File Attachment */}
            <TemplateCard
              title="File Attachment"
              description="Sent when a file is attached to a task"
              template={formData.templates.fileAttachment}
              onChange={(field, val) => handleTemplateChange("fileAttachment", field, val)}
              placeholders={["{name}", "{taskTitle}", "{fileName}"]}
            />

            {/* Comment Added */}
            <TemplateCard
              title="Task Comment"
              description="Sent when a comment is added to a task"
              template={formData.templates.commentAdded}
              onChange={(field, val) => handleTemplateChange("commentAdded", field, val)}
              placeholders={["{name}", "{taskTitle}", "{authorName}", "{commentText}"]}
            />

            {/* Reply Added */}
            <TemplateCard
              title="Comment Reply / Mention"
              description="Sent when a user is mentioned or replied to in a comment"
              template={formData.templates.replyAdded}
              onChange={(field, val) => handleTemplateChange("replyAdded", field, val)}
              placeholders={["{name}", "{taskTitle}", "{authorName}", "{replyText}"]}
            />

            {/* Project Assignment */}
            <TemplateCard
              title="Project Assignment"
              description="Sent when a user is assigned to a new project"
              template={formData.templates.projectAssignment}
              onChange={(field, val) => handleTemplateChange("projectAssignment", field, val)}
              placeholders={["{name}", "{projectName}", "{description}"]}
            />

            {/* Project Reassignment */}
            <TemplateCard
              title="Project Reassignment"
              description="Sent when a project is reassigned to a user"
              template={formData.templates.projectReassignment}
              onChange={(field, val) => handleTemplateChange("projectReassignment", field, val)}
              placeholders={["{name}", "{projectName}"]}
            />
          </div>
        </div>

        {/* Reward System Configuration */}
        <Card className="shadow-md border-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Task Completion Reward System</CardTitle>
                <CardDescription>Configure the global productivity reinforcement system</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reward-system">Enable Reward System</Label>
                <p className="text-sm text-muted-foreground">
                  Globally enable or disable visual and audio feedback for task completion.
                </p>
              </div>
              <Switch
                id="reward-system"
                checked={formData.taskRewardSystemEnabled}
                onCheckedChange={(val) => setFormData(prev => prev ? { ...prev, taskRewardSystemEnabled: val } : null)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card className="shadow-md border-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Test Email Configuration</CardTitle>
                <CardDescription>
                  Send a test email to verify your SMTP settings are working correctly.
                  Make sure you <strong>Save All Settings</strong> first before testing.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="testTo">Recipient Email</Label>
                <Input
                  id="testTo"
                  type="email"
                  placeholder="you@example.com"
                  value={testTo}
                  onChange={(e) => { setTestTo(e.target.value); setTestResult(null); }}
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleTestEmail()}
                disabled={testLoading || !testTo.trim()}
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

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            className="px-8 gap-2 font-bold shadow-lg shadow-primary/20"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

function TemplateCard({
  title,
  description,
  template,
  onChange,
  placeholders,
}: {
  title: string;
  description: string;
  template: Template;
  onChange: (field: keyof Template, value: any) => void;
  placeholders: string[];
}) {
  return (
    <Card className={`transition-all duration-300 border ${template.enabled ? 'border-primary/20 bg-primary/[0.01]' : 'border-border opacity-70'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${template.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
              {template.enabled ? "ENABLED" : "DISABLED"}
            </span>
            <Switch
              checked={template.enabled}
              onCheckedChange={(val) => onChange("enabled", val)}
            />
          </div>
        </div>
      </CardHeader>
      {template.enabled && (
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={template.subject}
              onChange={(e) => onChange("subject", e.target.value)}
              placeholder="Email subject line"
            />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={template.body}
              onChange={(e) => onChange("body", e.target.value)}
              placeholder="Email message content"
              rows={5}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs text-muted-foreground self-center">Available placeholders:</span>
            {placeholders.map((p) => (
              <code key={p} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold text-primary">
                {p}
              </code>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
