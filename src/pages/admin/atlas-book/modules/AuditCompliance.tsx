import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { ShieldCheck, History, FileCheck, Search, Download, CheckSquare } from "lucide-react";

export default function AuditCompliance() {
  const auditLogs = [
    { id: 1, user: "Admin", action: "Posted Journal Entry", module: "General Ledger", time: "2 mins ago", ref: "JE-00481" },
    { id: 2, user: "System", action: "Calculated Depreciation", module: "Fixed Assets", time: "1 hour ago", ref: "AST-829" },
    { id: 3, user: "Manager", action: "Approved Bill", module: "Accounts Payable", time: "3 hours ago", ref: "BILL-104" },
    { id: 4, user: "Admin", action: "Modified Account Code", module: "Chart of Accounts", time: "5 hours ago", ref: "COA-1002" },
  ];

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
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {log.user[0]}
                      </div>
                      <span className="font-medium text-sm">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-bold">{log.action}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{log.module}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{log.ref}</TableCell>
                  <TableCell className="text-right pr-6 text-xs text-muted-foreground">{log.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-sm uppercase tracking-wider">Compliance Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Bank Reconciliation Completed", status: true },
              { label: "Payroll Tax Filings Submitted", status: true },
              { label: "Quarterly VAT/GST Estimated", status: true },
              { label: "Fixed Asset Depreciation Calculated", status: false },
            ].map((check, i) => (
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
