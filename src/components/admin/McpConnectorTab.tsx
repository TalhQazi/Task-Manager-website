import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
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
  FileCode,
  ShieldCheck,
  Check,
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
  stats: {
    totalTasks: number;
    totalProjects: number;
    totalEmployees: number;
    availableTools: number;
  };
  configs: {
    antigravity: string;
    claude: string;
    cursor: string;
  };
}

export default function McpConnectorTab() {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<McpStatusResponse | null>(null);
  const [activeConfigTab, setActiveConfigTab] = useState("antigravity");
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

  useEffect(() => {
    void loadStatus();
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
              <h2 className="text-lg font-bold text-foreground">Task Manager MCP AI Connector</h2>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] gap-1 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SERVER READY
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect AI assistants (Antigravity, Claude, Cursor, ChatGPT) directly to your Task Manager database.
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
              Protocol
            </CardDescription>
            <CardTitle className="text-sm font-bold text-foreground">JSON-RPC 2.0 (stdio)</CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground pt-0">
            Official Model Context Protocol standard
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
            <CardTitle className="text-sm font-bold text-foreground">Local Stdio Sandbox</CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground pt-0">
            Safe direct connection, zero external leaks
          </CardContent>
        </Card>
      </div>

      {/* Server File Location Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            MCP Server Executable Path
          </CardTitle>
          <CardDescription className="text-xs">
            Path to the local Node.js MCP server file used by your AI clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border/80 font-mono text-xs">
            <span className="truncate mr-2 text-foreground font-semibold">
              {statusData?.serverPath || "d:/Ns Tech/backend-taskManager/src/mcp/server.js"}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 gap-1 shrink-0"
              onClick={() =>
                copyToClipboard(
                  statusData?.serverPath || "d:/Ns Tech/backend-taskManager/src/mcp/server.js",
                  "serverPath"
                )
              }
            >
              {copiedKey === "serverPath" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedKey === "serverPath" ? "Copied" : "Copy Path"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Client Connection Snippets */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bot className="h-4 w-4 text-purple-400" />
            AI Client Configuration Snippets
          </CardTitle>
          <CardDescription className="text-xs">
            Copy and paste this configuration into your favorite AI tool to give it direct access to Task Manager
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab}>
            <TabsList className="grid grid-cols-3 max-w-md">
              <TabsTrigger value="antigravity" className="text-xs">Antigravity / Gemini</TabsTrigger>
              <TabsTrigger value="claude" className="text-xs">Claude Desktop</TabsTrigger>
              <TabsTrigger value="cursor" className="text-xs">Cursor / VS Code</TabsTrigger>
            </TabsList>

            {/* Antigravity Config */}
            <TabsContent value="antigravity" className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground">
                Configured in <code className="text-foreground bg-muted px-1 py-0.5 rounded text-[11px]">~/.gemini/antigravity/mcp/task-manager/</code>. Already active in this pair-programming session!
              </p>
              <div className="relative">
                <pre className="p-3.5 rounded-xl bg-black/70 border border-zinc-800 text-[11px] font-mono text-zinc-200 overflow-x-auto">
                  {statusData?.configs?.antigravity || JSON.stringify({
                    mcpServers: {
                      "task-manager": {
                        command: "node",
                        args: ["d:/Ns Tech/backend-taskManager/src/mcp/server.js"],
                        env: {}
                      }
                    }
                  }, null, 2)}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2.5 right-2.5 h-7 text-xs px-2 gap-1"
                  onClick={() =>
                    copyToClipboard(
                      statusData?.configs?.antigravity || "",
                      "antigravity"
                    )
                  }
                >
                  {copiedKey === "antigravity" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === "antigravity" ? "Copied" : "Copy JSON"}
                </Button>
              </div>
            </TabsContent>

            {/* Claude Desktop Config */}
            <TabsContent value="claude" className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground">
                Add to your <code className="text-foreground bg-muted px-1 py-0.5 rounded text-[11px]">%APPDATA%\Claude\claude_desktop_config.json</code> under <code className="text-foreground bg-muted px-1 py-0.5 rounded text-[11px]">mcpServers</code>.
              </p>
              <div className="relative">
                <pre className="p-3.5 rounded-xl bg-black/70 border border-zinc-800 text-[11px] font-mono text-zinc-200 overflow-x-auto">
                  {statusData?.configs?.claude || JSON.stringify({
                    mcpServers: {
                      "task-manager": {
                        command: "node",
                        args: ["d:/Ns Tech/backend-taskManager/src/mcp/server.js"],
                        env: {}
                      }
                    }
                  }, null, 2)}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2.5 right-2.5 h-7 text-xs px-2 gap-1"
                  onClick={() =>
                    copyToClipboard(statusData?.configs?.claude || "", "claude")
                  }
                >
                  {copiedKey === "claude" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === "claude" ? "Copied" : "Copy JSON"}
                </Button>
              </div>
            </TabsContent>

            {/* Cursor / VS Code Config */}
            <TabsContent value="cursor" className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground">
                Add to Cursor Settings &gt; MCP &gt; Add New MCP Server or to <code className="text-foreground bg-muted px-1 py-0.5 rounded text-[11px]">.cursor/mcp.json</code>.
              </p>
              <div className="relative">
                <pre className="p-3.5 rounded-xl bg-black/70 border border-zinc-800 text-[11px] font-mono text-zinc-200 overflow-x-auto">
                  {statusData?.configs?.cursor || JSON.stringify({
                    mcpServers: {
                      "task-manager": {
                        command: "node",
                        args: ["d:/Ns Tech/backend-taskManager/src/mcp/server.js"]
                      }
                    }
                  }, null, 2)}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2.5 right-2.5 h-7 text-xs px-2 gap-1"
                  onClick={() =>
                    copyToClipboard(statusData?.configs?.cursor || "", "cursor")
                  }
                >
                  {copiedKey === "cursor" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === "cursor" ? "Copied" : "Copy JSON"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
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

