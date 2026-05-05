import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { apiFetch } from "@/lib/admin/apiClient";
import { Plus, RefreshCw, Save } from "lucide-react";

type Tenant = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  amount?: number;
  status?: "active" | "inactive";
  createdAt?: string;
};

export default function Tenants() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await apiFetch<{ items: Tenant[] }>("/api/tenants");
      setItems(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    return [...items].sort((a, b) => {
      const an = String(a.name || "").toLowerCase();
      const bn = String(b.name || "").toLowerCase();
      return an.localeCompare(bn);
    });
  }, [items]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setAmount("");
    setFormError(null);
  };

  const onCreate = async () => {
    if (!name.trim()) {
      setFormError("Tenant name is required");
      return;
    }

    const amountNum = amount.trim() ? Number(amount) : 0;
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      setFormError("Amount must be a valid number");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      const res = await apiFetch<{ item: Tenant }>("/api/tenants", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          amount: amountNum,
        }),
      });

      const created = res?.item;
      if (created?._id) {
        setItems((prev) => [created, ...prev]);
      }
      resetForm();
      setAddOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create tenant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">Manage tenants used in payment plans.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Tenant
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">All Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {apiError && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {apiError}
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No tenants found.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell className="font-medium">{t.name || "-"}</TableCell>
                      <TableCell>{t.email || "-"}</TableCell>
                      <TableCell>{t.phone || "-"}</TableCell>
                      <TableCell>{t.address || "-"}</TableCell>
                      <TableCell className="text-right">${Number(t.amount || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={(o) => {
        setAddOpen(o);
        if (!o) resetForm();
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Tenant</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" disabled={saving} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
