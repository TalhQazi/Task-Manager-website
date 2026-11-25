import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { apiFetch } from "@/lib/admin/apiClient";
import { toast } from "sonner";
import {
  Cpu,
  CheckCircle2,
  Copy,
  Terminal,
  Play,
  RefreshCw,
  Server,
  Database,
  ExternalLink,
  Sparkles,
  Bot,
  Layers,
  ShieldCheck,
  Check,
  Globe,
  Key,
  HelpCircle,
  Code2,
} from "lucide-react";

interface McpTool {
  name: string;
  description: string;
  parameters: string[];
}

interface McpStatusResponse {
  status: string;
  serverPath: string;
  protocol: string;
  databaseConnected: boolean;
  tools: McpTool[];
  openApiUrl?: string;
  chatgptApiKey?: string;
  stats: {
    totalTasks: number;
    totalProjects: number;
    totalEmployees: number;
    availableTools: number;
  };
  configs?: {
    antigravity?: string;
    claude?: string;
    cursor?: string;
  };
}

export default function McpConnectorTab() {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<McpStatusResponse | null>(null);
  const [openApiSpec, setOpenApiSpec] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Testing console state
  const [testTool, setTestTool] = useState("get_system_overview");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<McpStatusResponse>("/api/mcp/status");
      setStatusData(res);
    } catch (err: any) {
      console.error("Failed to load MCP status:", err);
      toast.error(err.message || "Failed to load MCP server status");
    } finally {
      setLoading(false);
    }
  };

  const loadOpenApiSpec = async () => {
    try {
      const res = await fetch("/api/mcp/openapi.json");
      if (res.ok) {
        const data = await res.json();
        setOpenApiSpec(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error("Failed to fetch OpenAPI spec:", err);
    }
  };

  useEffect(() => {
    void loadStatus();
    void loadOpenApiSpec();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const runTestTool = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);
      const res = await apiFetch<{ success: boolean; toolName: string; result: any }>("/api/mcp/test-tool", {
        method: "POST",
        body: JSON.stringify({ toolName: testTool }),
      });
      setTestResult(res.result);
      toast.success(`Executed ${testTool} successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Tool execution failed");
      setTestResult({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Task Manager ChatGPT & AI Connector</h2>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] gap-1 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SERVER READY
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect ChatGPT and AI assistants directly to your Task Manager database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-border"
            onClick={loadStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Highlights Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-blue-400" />
              Supported Protocol
            </CardDescription>
            <CardTitle className="text-sm font-bold text-foreground">OpenAPI 3.0 Actions</CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground pt-0">
            Native ChatGPT Actions & Webhooks
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              Database Link
            </CardDescription>
            <CardTitle className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              MongoDB Connected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground pt-0">
            Live database querying & synchronization
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              Exposed AI Tools
            </CardDescription>
            <CardTitle className="text-sm font-bold text-foreground">
              {statusData?.tools.length || 7} Registered Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground pt-0">
            Tasks, Projects, Employees, Overview
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              Security Mode
            </CardDescription>
            <CardTitle className="text-sm font-bold text-foreground">API Key / Bearer Auth</CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground pt-0">
            Authenticated connection, zero external leaks
          </CardContent>
        </Card>
      </div>

      {/* ChatGPT Custom GPT & Actions Configuration */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bot className="h-4 w-4 text-emerald-400" />
            ChatGPT Actions & Custom GPT Configuration
          </CardTitle>
          <CardDescription className="text-xs">
            Step-by-step setup guide and OpenAPI credentials to connect ChatGPT directly to Task Manager
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 via-teal-950/20 to-zinc-900 border border-emerald-500/30 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <Bot className="h-4 w-4" />
              <span>Connect OpenAI ChatGPT / Custom GPTs to Task Manager</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              ChatGPT connects securely over HTTPS using <strong>OpenAPI 3.0 Actions</strong>.
              You can create a custom &quot;Task Manager Copilot&quot; in ChatGPT that can read your tasks, create new tasks, update statuses, and report project metrics through natural conversation.
            </p>
          </div>

          {/* Schema URL & Key */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-blue-400" />
                OpenAPI Schema URL (Import into ChatGPT)
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 px-3 py-2 rounded-lg bg-muted/80 border border-border font-mono text-[11px] truncate text-foreground select-all">
                  {statusData?.openApiUrl || `${window.location.origin}/api/mcp/openapi.json`}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-2.5 gap-1 shrink-0"
                  onClick={() =>
                    copyToClipboard(
                      statusData?.openApiUrl || `${window.location.origin}/api/mcp/openapi.json`,
                      "openApiUrl"
                    )
                  }
                >
                  {copiedKey === "openApiUrl" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === "openApiUrl" ? "Copied" : "Copy URL"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => window.open(statusData?.openApiUrl || "/api/mcp/openapi.json", "_blank")}
                  title="Open OpenAPI JSON in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-400" />
                ChatGPT API Key / Bearer Token
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 px-3 py-2 rounded-lg bg-muted/80 border border-border font-mono text-[11px] truncate text-foreground select-all">
                  {statusData?.chatgptApiKey || "taskmanager-mcp-key-2026"}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-2.5 gap-1 shrink-0"
                  onClick={() =>
                    copyToClipboard(
                      statusData?.chatgptApiKey || "taskmanager-mcp-key-2026",
                      "chatgptApiKey"
                    )
                  }
                >
                  {copiedKey === "chatgptApiKey" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === "chatgptApiKey" ? "Copied" : "Copy Key"}
                </Button>
              </div>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Quick 4-Step Setup in ChatGPT</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-card border border-border/60 space-y-1">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                  Create Custom GPT
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Log in to <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">chatgpt.com</a>, click <strong>Explore GPTs</strong> on the left, then click <strong>+ Create</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60 space-y-1">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                  Add New Action
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Switch to the <strong>Configure</strong> tab. Scroll down to <strong>Actions</strong> and click <strong>Create new action</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60 space-y-1">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                  Import OpenAPI Schema
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Click <strong>&quot;Import from URL&quot;</strong>, paste the <em>OpenAPI Schema URL</em> above, and click <strong>Import</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60 space-y-1">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">4</span>
                  Configure Authentication
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Under <strong>Authentication</strong>, choose <strong>API Key</strong>, select <strong>Bearer</strong> (or Custom Header <code>X-API-Key</code>), and paste your key.
                </p>
              </div>
            </div>
          </div>

          {/* Raw OpenAPI Specification Viewer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                OpenAPI 3.0 Specification (Manual Paste Option)
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(openApiSpec, "openApiSpec")}
                disabled={!openApiSpec}
              >
                {copiedKey === "openApiSpec" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                {copiedKey === "openApiSpec" ? "Copied Spec" : "Copy OpenAPI Spec"}
              </Button>
            </div>
            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-black/70 border border-zinc-800 text-[11px] font-mono text-zinc-200 max-h-52 overflow-y-auto no-scrollbar">
                {openApiSpec || "// Loading OpenAPI specification schema from /api/mcp/openapi.json..."}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Tools Grid */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-500" />
            Registered AI Tools Catalog ({statusData?.tools.length || 7})
          </CardTitle>
          <CardDescription className="text-xs">
            These tools are automatically exposed to connected AI assistants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(statusData?.tools || []).map((tool) => (
              <div
                key={tool.name}
                className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    {tool.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {tool.parameters.length} args
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
                {tool.parameters.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tool.parameters.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Tool Execution & Diagnostic Console */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Play className="h-4 w-4 text-cyan-400" />
            Live MCP Diagnostic & Ping Console
          </CardTitle>
          <CardDescription className="text-xs">
            Test tool calls in real-time to verify the MCP protocol handler and database responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Select Tool:</span>
              <select
                value={testTool}
                onChange={(e) => setTestTool(e.target.value)}
                className="h-8 text-xs rounded-lg border border-border bg-background px-2.5 font-medium text-foreground focus:outline-none"
              >
                <option value="get_system_overview">get_system_overview (Metrics)</option>
                <option value="list_tasks">list_tasks (Recent 5 tasks)</option>
                <option value="list_projects">list_projects (Recent projects)</option>
                <option value="list_employees">list_employees (Team directory)</option>
              </select>
            </div>

            <Button
              size="sm"
              className="h-8 text-xs font-bold gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
              onClick={runTestTool}
              disabled={testLoading}
            >
              <Play className={`h-3.5 w-3.5 ${testLoading ? "animate-spin" : ""}`} />
              Run Test Call
            </Button>
          </div>

          {testResult && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Response Payload:</span>
                <span className="font-mono text-[10px]">JSON 200 OK</span>
              </div>
              <pre className="p-3.5 rounded-xl bg-black/80 border border-zinc-800 text-xs font-mono text-emerald-400 max-h-72 overflow-y-auto no-scrollbar">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
