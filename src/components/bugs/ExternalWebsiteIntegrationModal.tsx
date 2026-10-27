import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";
import { Badge } from "@/components/admin/ui/badge";
import {
  Globe,
  Code2,
  Copy,
  Check,
  Terminal,
  Send,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/manger/api";

type ExternalWebsiteIntegrationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBugSubmitted?: () => void;
};

export default function ExternalWebsiteIntegrationModal({
  open,
  onOpenChange,
  onBugSubmitted,
}: ExternalWebsiteIntegrationModalProps) {
  const [websites, setWebsites] = useState<{ siteName: string; url?: string }[]>([]);
  const [selectedSiteName, setSelectedSiteName] = useState("My Website");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test form state
  const [testTitle, setTestTitle] = useState("Cart checkout total discrepancy");
  const [testDesc, setTestDesc] = useState("Clicking Apply Coupon does not update tax subtotal.");
  const [testSeverity, setTestSeverity] = useState("high");
  const [testModule, setTestModule] = useState("Checkout");
  const [testReporterName, setTestReporterName] = useState("Alex Johnson");
  const [testReporterEmail, setTestReporterEmail] = useState("alex@example.com");
  const [testLoading, setTestLoading] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Resolve backend origin
  const apiBase = typeof window !== "undefined" ? window.location.origin : "https://task.se7eninc.com";

  useEffect(() => {
    if (!open) return;
    const fetchSites = async () => {
      try {
        const res = await apiFetch<{ items?: { siteName: string; url?: string }[] }>("/api/bugs/websites/list");
        const list = Array.isArray(res?.items) ? res.items : [];
        if (list.length > 0) {
          setWebsites(list);
          const firstNonTask = list.find((s) => s.siteName !== "Task Manager");
          if (firstNonTask) setSelectedSiteName(firstNonTask.siteName);
          else if (list[0]?.siteName) setSelectedSiteName(list[0].siteName);
        }
      } catch {
        // Fallback gracefully
      }
    };
    void fetchSites();
  }, [open]);

  const copyToClipboard = (text: string, key: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const widgetScriptCode = `<script 
  src="${apiBase}/api/bugs/external/widget.js" 
  data-website="${selectedSiteName || "My Website"}"
  data-api="${apiBase}"
  data-color="#0284c7"
  data-position="bottom-right">
</script>`;

  const restApiCode = `// Post a bug report from any external website or web application
async function reportBugToTaskManager(bugData) {
  const response = await fetch("${apiBase}/api/bugs/external", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: bugData.title,
      description: bugData.description,
      websiteName: "${selectedSiteName || "My Website"}",
      websiteUrl: window.location.origin,
      pageUrl: window.location.href,
      severity: bugData.severity || "medium", // "low" | "medium" | "high" | "critical"
      priority: bugData.priority || "medium", // "low" | "medium" | "high" | "urgent"
      module: bugData.module || "General",
      reporterName: bugData.reporterName || "Client User",
      reporterEmail: bugData.reporterEmail || "",
      browserInfo: {
        userAgent: navigator.userAgent,
        screenResolution: window.screen.width + "x" + window.screen.height,
        language: navigator.language,
        platform: navigator.platform,
      },
      attachments: bugData.attachments || [], // array of uploaded files
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to submit bug: " + response.statusText);
  }
  return await response.json();
}`;

  const curlCode = `curl -X POST "${apiBase}/api/bugs/external" \\
  -H "Content-Type: application/json" \\
  -d '{
    "websiteName": "${selectedSiteName || "My Website"}",
    "websiteUrl": "https://example.com",
    "pageUrl": "https://example.com/pricing",
    "title": "Pricing table toggle switch misaligned",
    "description": "Annual vs Monthly toggle does not reflect discounted pricing.",
    "severity": "medium",
    "priority": "medium",
    "module": "Pricing",
    "reporterName": "Sarah Connor",
    "reporterEmail": "sarah@example.com"
  }'`;

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testDesc.trim()) {
      setTestError("Title and description are required.");
      return;
    }

    try {
      setTestLoading(true);
      setTestError(null);
      setTestSuccess(null);

      const res = await fetch(`${apiBase}/api/bugs/external`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: testTitle.trim(),
          description: testDesc.trim(),
          websiteName: selectedSiteName.trim() || "External Website",
          websiteUrl: apiBase,
          pageUrl: `${apiBase}/demo-page`,
          severity: testSeverity,
          priority: "medium",
          module: testModule.trim() || "General",
          reporterName: testReporterName.trim() || "Test Submitter",
          reporterEmail: testReporterEmail.trim(),
          browserInfo: {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            platform: navigator.platform,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to submit test bug report");
      }

      setTestSuccess(`Bug #${data?.item?.id || "OK"} was received! It is now visible in your Task Manager Bug Panel with the website badge "${selectedSiteName}".`);
      if (onBugSubmitted) onBugSubmitted();
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Error submitting test bug report");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl mx-auto p-4 sm:p-6 max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                External Website Integration
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                  CORS Enabled
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Receive and triage bug reports from all your other websites directly inside this Bug Panel.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Website Selector & Origin Header */}
        <div className="p-3.5 rounded-xl bg-muted/40 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" /> Target Website Name:
            </label>
            <p className="text-[11px] text-muted-foreground">
              Select or type the name of the website you are connecting.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {websites.length > 0 ? (
              <Select value={selectedSiteName} onValueChange={setSelectedSiteName}>
                <SelectTrigger className="h-8 text-xs w-48 bg-background">
                  <SelectValue placeholder="Choose website" />
                </SelectTrigger>
                <SelectContent>
                  {websites.map((w, idx) => (
                    <SelectItem key={idx} value={w.siteName} className="text-xs">
                      {w.siteName}
                    </SelectItem>
                  ))}
                  <SelectItem value="Custom Website" className="text-xs font-medium text-primary">
                    + Custom Website Name
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            <Input
              value={selectedSiteName}
              onChange={(e) => setSelectedSiteName(e.target.value)}
              placeholder="e.g. E-Commerce Store"
              className="h-8 text-xs w-44 bg-background"
            />
          </div>
        </div>

        {/* Integration Options Tabs */}
        <Tabs defaultValue="widget" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="widget" className="text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> 1-Line Embed
            </TabsTrigger>
            <TabsTrigger value="rest" className="text-xs gap-1.5">
              <Code2 className="h-3.5 w-3.5" /> REST API (Fetch)
            </TabsTrigger>
            <TabsTrigger value="curl" className="text-xs gap-1.5">
              <Terminal className="h-3.5 w-3.5" /> cURL / Webhook
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs gap-1.5">
              <Send className="h-3.5 w-3.5 text-emerald-500" /> Test Ingestion
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: 1-LINE EMBED WIDGET */}
          <TabsContent value="widget" className="space-y-3 mt-3">
            <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>Zero-Code Floating Bug Reporter:</strong> Paste this single `<script>` snippet into the `<head>` or `<body>` of your other website. A stylish floating "Report Bug" button will automatically appear with an interactive modal, file upload, and instant transmission to this Task Manager panel!
              </div>
            </div>

            <div className="relative rounded-xl bg-slate-950 p-3.5 text-slate-100 font-mono text-xs border border-slate-800 overflow-x-auto shadow-inner">
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2.5 right-2.5 h-7 px-2 text-[11px] gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                onClick={() => copyToClipboard(widgetScriptCode, "widget")}
              >
                {copiedKey === "widget" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Code
                  </>
                )}
              </Button>
              <pre className="pr-20 whitespace-pre-wrap">{widgetScriptCode}</pre>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
              <p className="font-semibold text-foreground">Widget Features:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Captures exact current page URL & browser screen resolution automatically</li>
                <li>Allows users/clients to attach screenshots, screen recordings & documents</li>
                <li>Isolated CSS styles — will never conflict with your other website's styles</li>
                <li>Fully responsive on mobile phones, tablets, and desktop displays</li>
              </ul>
            </div>
          </TabsContent>

          {/* TAB 2: REST API / FETCH */}
          <TabsContent value="rest" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              If your other website already has custom feedback forms, a React/Vue/Angular frontend, or support ticketing, use this JavaScript function to send bugs:
            </p>

            <div className="relative rounded-xl bg-slate-950 p-3.5 text-slate-100 font-mono text-xs border border-slate-800 overflow-x-auto shadow-inner">
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2.5 right-2.5 h-7 px-2 text-[11px] gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                onClick={() => copyToClipboard(restApiCode, "rest")}
              >
                {copiedKey === "rest" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy JS Function
                  </>
                )}
              </Button>
              <pre className="pr-20 whitespace-pre-wrap">{restApiCode}</pre>
            </div>

            <div className="text-[11px] text-muted-foreground p-2 rounded-lg bg-muted/40 border">
              <strong>Endpoint:</strong> <code className="text-primary font-semibold">POST {apiBase}/api/bugs/external</code> (Public, Open CORS)
            </div>
          </TabsContent>

          {/* TAB 3: CURL / WEBHOOK */}
          <TabsContent value="curl" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Test or integrate with backend microservices, Zapier, Webhooks, or command line using cURL:
            </p>

            <div className="relative rounded-xl bg-slate-950 p-3.5 text-slate-100 font-mono text-xs border border-slate-800 overflow-x-auto shadow-inner">
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2.5 right-2.5 h-7 px-2 text-[11px] gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                onClick={() => copyToClipboard(curlCode, "curl")}
              >
                {copiedKey === "curl" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy cURL
                  </>
                )}
              </Button>
              <pre className="pr-20 whitespace-pre-wrap">{curlCode}</pre>
            </div>
          </TabsContent>

          {/* TAB 4: TEST LIVE INGESTION */}
          <TabsContent value="test" className="space-y-3 mt-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
              <strong>Simulate External Bug Submission:</strong> Submit a sample bug below to watch it arrive in real-time in your Bug Panel labeled with website origin <strong>{selectedSiteName}</strong>.
            </div>

            {testSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{testSuccess}</span>
              </div>
            )}

            {testError && (
              <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            <form onSubmit={handleTestSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Issue Title *</label>
                  <Input
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Module / Feature Area</label>
                  <Input
                    value={testModule}
                    onChange={(e) => setTestModule(e.target.value)}
                    placeholder="e.g. Cart, Auth, Header"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Description *</label>
                <Textarea
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                  placeholder="Steps to reproduce, expected vs actual behavior..."
                  rows={2}
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Severity</label>
                  <Select value={testSeverity} onValueChange={setTestSeverity}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-xs">Low</SelectItem>
                      <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                      <SelectItem value="high" className="text-xs">High</SelectItem>
                      <SelectItem value="critical" className="text-xs">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Reporter Name</label>
                  <Input
                    value={testReporterName}
                    onChange={(e) => setTestReporterName(e.target.value)}
                    placeholder="John Doe"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Reporter Email</label>
                  <Input
                    type="email"
                    value={testReporterEmail}
                    onChange={(e) => setTestReporterEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={testLoading}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4"
                >
                  {testLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Send Test Bug Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
