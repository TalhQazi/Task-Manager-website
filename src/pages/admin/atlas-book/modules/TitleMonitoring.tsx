import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { ShieldCheck, RefreshCw, Landmark, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function TitleMonitoring() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/atlasbook/titles");
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
            <ShieldCheck className="h-8 w-8 text-primary" />
            Title & Lien Monitoring
          </h1>
          <p className="text-muted-foreground">Monitor property titles, recorded liens, and municipal tax assessments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button className="gap-2"><FileText size={16} /> Order Title Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-2xl text-white"><CheckCircle2 size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-emerald-600">Clear Titles</p>
              <h3 className="text-2xl font-black">{items.filter(i => i.status === "Clear").length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500 rounded-2xl text-white"><AlertCircle size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-amber-600">Encumbered</p>
              <h3 className="text-2xl font-black">{items.filter(i => i.status !== "Clear").length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-lg">Title Registry</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Property</TableHead>
                <TableHead>Parcel #</TableHead>
                <TableHead>Owner of Record</TableHead>
                <TableHead>Active Liens</TableHead>
                <TableHead>Tax Status</TableHead>
                <TableHead className="text-right pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">No property title records found. Start by ordering a title report.</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="pl-6 font-bold">{item.property?.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.parcelNumber}</TableCell>
                    <TableCell className="text-sm">{item.ownerName}</TableCell>
                    <TableCell>
                      {item.liens?.length > 0 ? (
                        <Badge variant="destructive">{item.liens.length} Liens</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-100">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.lastTaxAssessment?.status === "Paid" ? "secondary" : "destructive"}>
                        {item.lastTaxAssessment?.status || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge className={item.status === "Clear" ? "bg-emerald-500" : "bg-amber-500"}>{item.status}</Badge>
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
