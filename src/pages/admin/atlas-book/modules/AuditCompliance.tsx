import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { ShieldCheck, History, FileCheck, Search, Download, CheckSquare, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

interface ActivityLog {
  id: string;
  actorUsername: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  description: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  AUTH_LOGIN_SUCCESS: "Login Success",
  AUTH_LOGIN_FAILURE: "Login Failed",
  AUTH_LOGOUT: "Logout",
  USER_CREATE: "User Added",
  USER_UPDATE: "User Updated",
  USER_DELETE: "User Deleted",
  USER_ROLE_CHANGE: "Role Changed",
  TASK_CREATE: "Task Added",
  TASK_UPDATE: "Task Updated",
  TASK_DELETE: "Task Deleted",
  EMPLOYEE_CREATE: "Employee Added",
  EMPLOYEE_UPDATE: "Employee Updated",
  EMPLOYEE_DELETE: "Employee Deleted",
  TIME_ENTRY_CREATE: "Time Entry Added",
  TIME_ENTRY_UPDATE: "Time Entry Updated",
  TIME_ENTRY_DELETE: "Time Entry Deleted",
  NOTIFICATION_CREATE: "Notification Sent",
  MESSAGE_SEND: "Message Sent",
  SETTINGS_UPDATE: "Settings Updated",
  DATA_EXPORT: "Data Exported",
  APPLIANCE_CREATE: "Appliance Added",
  APPLIANCE_UPDATE: "Appliance Updated",
  APPLIANCE_DELETE: "Appliance Deleted",
  VEHICLE_CREATE: "Vehicle Added",
  VEHICLE_UPDATE: "Vehicle Updated",
  VEHICLE_DELETE: "Vehicle Deleted",
  LOCATION_CREATE: "Location Added",
  LOCATION_UPDATE: "Location Updated",
  LOCATION_DELETE: "Location Deleted",
  VENDOR_CREATE: "Vendor Added",
  VENDOR_UPDATE: "Vendor Updated",
  VENDOR_DELETE: "Vendor Deleted",
  EVENT_CREATE: "Event Added",
  EVENT_UPDATE: "Event Updated",
  EVENT_DELETE: "Event Deleted",
  ONBOARDING_CREATE: "Onboarding Added",
  ONBOARDING_UPDATE: "Onboarding Updated",
};

export default function AuditCompliance() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [checklist, setChecklist] = useState([
    { label: "Bank Reconciliation (No Pending Approvals)", status: true },
    { label: "Payroll Tax Filings Submitted", status: true },
    { label: "Labor Compliance (No Open Flags)", status: true },
    { label: "System Audits Passed", status: true }
  ]);

  useEffect(() => {
    let active = true;
    
    const fetchAll = async () => {
      try {
        const [logsRes, flagsRes, approvalsRes, billsRes] = await Promise.all([
          apiFetch<{ items: ActivityLog[] }>("/api/activity-logs?limit=20"),
          apiFetch<any>("/api/compliance/flags"),
          apiFetch<any>("/api/atlasbook/approvals"),
          apiFetch<any>("/api/atlasbook/bills")
        ]);

        if (active) {
          setLogs(logsRes?.items || []);
          
          const openFlags = (flagsRes?.items || []).filter((f: any) => f.status === "open").length;
          const pendingApprovals = (approvalsRes?.items || []).filter((a: any) => a.status === "Pending").length;
          const unpaidTax = (billsRes?.items || []).filter((b: any) => 
            b.status === "Unpaid" && (b.description || "").toLowerCase().includes("tax")
          ).length;

          setChecklist([
            { label: "Bank Reconciliation (No Pending Approvals)", status: pendingApprovals === 0 },
            { label: "Tax Filings & Payments (No Unpaid Tax Bills)", status: unpaidTax === 0 },
            { label: "Labor Compliance (No Open Flags)", status: openFlags === 0 },
            { label: "System Audits Passed", status: true }
          ]);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to fetch audit data", err);
          setError(err instanceof Error ? err.message : "Failed to load audit logs");
          setLoading(false);
        }
      }
    };
    fetchAll();
    return () => {
      active = false;
    };
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Audit & Compliance
          </h1>
          <p className="text-muted-foreground">Immutable audit trails and regulatory compliance monitoring.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download size={16} /> Audit Pack</Button>
          <Button className="gap-2"><FileCheck size={16} /> Run Compliance Check</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg"><ShieldCheck size={20} /></div>
              <Badge className="bg-emerald-500">Passed</Badge>
            </div>
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Last Compliance Run</p>
            <h4 className="text-lg font-black">Today, 08:30 AM</h4>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="text-primary" size={20} />
            System-Wide Audit Trail
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground h-3 w-3" />
              <input className="pl-7 h-8 text-xs border rounded-md" placeholder="Search logs..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Action Taken</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right pr-6">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No audit logs recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                          {(log.actorUsername || "U")[0]}
                        </div>
                        <span className="font-medium text-sm">{log.actorUsername}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold">
                      {ACTION_LABELS[log.action] || log.action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {log.resourceType.replace(/-/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{log.resourceName || log.resourceId || "—"}</TableCell>
                    <TableCell className="text-right pr-6 text-xs text-muted-foreground">
                      {formatTimeAgo(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-sm uppercase tracking-wider">Compliance Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((check, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-muted hover:bg-muted/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded ${check.status ? "text-emerald-500 bg-emerald-50" : "text-amber-500 bg-amber-50"}`}>
                    <CheckSquare size={16} />
                  </div>
                  <span className="text-sm font-medium">{check.label}</span>
                </div>
                <Badge variant={check.status ? "outline" : "secondary"} className={check.status ? "text-emerald-600 border-emerald-200" : ""}>
                  {check.status ? "Verified" : "Pending"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
