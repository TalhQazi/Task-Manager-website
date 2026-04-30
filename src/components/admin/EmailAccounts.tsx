import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Plus, Edit2, Trash2, Lock, ExternalLink, Search, Mail } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/admin/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";

interface EmailAccount {
  _id: string;
  email: string;
  password?: string;
  provider: string;
  brand: string;
  status: "Active" | "Inactive" | "Suspended";
  notes: string;
  createdAt: string;
}

const statusColors = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  Suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function EmailAccounts() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<EmailAccount | null>(null);
  const [formData, setFormData] = useState<Partial<EmailAccount>>({
    email: "",
    password: "",
    provider: "Other",
    brand: "",
    status: "Active",
    notes: "",
  });
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const accountsQuery = useQuery<EmailAccount[]>({
    queryKey: ["email-accounts"],
    queryFn: async () => {
      const res = await apiFetch<{ items: EmailAccount[] }>("/api/email-accounts");
      return res.items || [];
    },
  });

  const accounts = useMemo(() => {
    let list = (accountsQuery.data || []).slice();
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.email.toLowerCase().includes(q) || 
        a.provider.toLowerCase().includes(q) || 
        a.brand.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.email.localeCompare(b.email));
  }, [accountsQuery.data, searchQuery]);

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      provider: "Other",
      brand: "",
      status: "Active",
      notes: "",
    });
    setSelectedAccount(null);
  };

  const handleSave = async () => {
    if (!formData.email) {
      setApiError("Email is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      if (selectedAccount) {
        await apiFetch(`/api/email-accounts/${selectedAccount._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/email-accounts", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }

      await accountsQuery.refetch();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (account: EmailAccount) => {
    if (!confirm("Are you sure you want to delete this email account?")) return;
    try {
      await apiFetch(`/api/email-accounts/${account._id}`, {
        method: "DELETE",
      });
      await accountsQuery.refetch();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleEdit = (account: EmailAccount) => {
    setSelectedAccount(account);
    setFormData(account);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
          <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(true);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Email Account
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount ? "Edit Email Account" : "Add New Email Account"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="text"
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  placeholder="Password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Provider</label>
                  <select
                    value={formData.provider || "Other"}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Gmail">Gmail</option>
                    <option value="Outlook">Outlook</option>
                    <option value="Yahoo">Yahoo</option>
                    <option value="Private">Private Domain</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Brand/Company</label>
                  <input
                    type="text"
                    value={formData.brand || ""}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                    placeholder="Brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status || "Active"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EmailAccount["status"] })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSubmitting} className="bg-primary">
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by email, provider or brand..."
            className="pl-9 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {accountsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No email accounts yet. Click "Add Email Account" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-hidden mt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 font-bold">#</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Provider</TableHead>
                <TableHead className="font-bold">Brand</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account, index) => (
                <TableRow 
                  key={account._id} 
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setViewingAccount(account);
                    setIsViewOpen(true);
                  }}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {account.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{account.provider}</TableCell>
                  <TableCell className="text-sm">{account.brand}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[account.status]} border-0 shadow-none font-bold text-[10px] uppercase`}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-blue-600"
                        onClick={(e) => { e.stopPropagation(); handleEdit(account); }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(account); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Email Account Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Email Account Details</DialogTitle>
          </DialogHeader>
          {viewingAccount && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                  <p className="font-semibold text-sm truncate">{viewingAccount.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                  <Badge className={`${statusColors[viewingAccount.status]} border-0 shadow-none font-bold text-[10px] uppercase`}>
                    {viewingAccount.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Provider</p>
                  <p className="text-sm">{viewingAccount.provider}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Brand</p>
                  <p className="text-sm">{viewingAccount.brand || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="flex justify-between items-center group">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Password</p>
                    <p className="text-sm font-mono">{viewingAccount.password || "No password set"}</p>
                  </div>
                  {viewingAccount.password && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(viewingAccount.password || "");
                      }}
                    >
                      <Lock className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {viewingAccount.notes && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Notes</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1 leading-relaxed">
                    {viewingAccount.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsViewOpen(false);
                handleEdit(viewingAccount!);
              }}
              className="w-full sm:w-auto"
            >
              <Edit2 className="h-3.5 w-3.5 mr-2" />
              Edit Details
            </Button>
            <Button onClick={() => setIsViewOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
