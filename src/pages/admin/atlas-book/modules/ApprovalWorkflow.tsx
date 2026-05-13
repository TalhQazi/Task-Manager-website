import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Timer, RefreshCw, CheckCircle2, XCircle, User, MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function ApprovalWorkflow() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/atlasbook/approvals");
      if (res?.success) setItems(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Timer className="h-8 w-8 text-primary" />
            Approval Workflow
          </h1>
          <p className="text-muted-foreground">Manage multi-level authorization for expenses, bills, and high-value journal entries.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-2xl text-white"><Timer size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-blue-600">Pending My Approval</p>
              <h3 className="text-2xl font-black">{items.filter(i => i.status === "Pending").length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-lg">Approval Requests</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Module</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested On</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">No pending approval requests. Great job!</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="pl-6"><Badge variant="outline">{item.module}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]"><User size={10} /></div>
                        <span className="text-sm">{item.requestedBy?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={item.priority === "Urgent" ? "bg-rose-500" : item.priority === "High" ? "bg-orange-500" : "bg-slate-500"}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600"><CheckCircle2 size={16} /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600"><XCircle size={16} /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500"><MessageSquare size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
