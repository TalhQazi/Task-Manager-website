import { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Plus, Edit2, Trash2, Lock, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";

interface SocialMediaAccount {
  _id: string;
  platform: string;
  brand: string;
  url: string;
  username: string;
  accountHandle: string;
  status: "Active" | "Inactive" | "Suspended";
  notes: string;
  createdAt: string;
}

const statusColors = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  Suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const platformOptions = [
  "Instagram",
  "Facebook",
  "YouTube",
  "TikTok",
  "LinkedIn",
  "X (Twitter)",
  "Liberty social",
  "Rumble",
  "Truth Social",
  "Threads",
  "Other",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

export function SocialMediaAccounts() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SocialMediaAccount>>({
    platform: "",
    brand: "",
    url: "",
    username: "",
    accountHandle: "",
    status: "Active",
    notes: "",
  });
  const [selectedAccount, setSelectedAccount] = useState<SocialMediaAccount | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentials, setShowCredentials] = useState<string | null>(null);

  const accountsQuery = useQuery<SocialMediaAccount[]>({
    queryKey: ["social-media-accounts"],
    queryFn: async () => {
      const res = await apiFetch<{ items: SocialMediaAccount[] }>("/api/social-media");
      return (res.items || []).map(item => ({
        ...item,
        username: item.username || item.accountHandle || ""
      }));
    },
  });

  const accounts = accountsQuery.data || [];

  const resetForm = () => {
    setFormData({
      platform: "",
      brand: "",
      url: "",
      username: "",
      accountHandle: "",
      status: "Active",
      notes: "",
    });
    setSelectedAccount(null);
  };

  const handleSave = async () => {
    // Both username and accountHandle should be present for compatibility
    const handle = formData.accountHandle || formData.username;
    
    if (!formData.platform || !handle) {
      setApiError("Platform and Username are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const payload = {
        ...formData,
        accountHandle: handle,
        username: formData.username || handle
      };

      if (selectedAccount) {
        await apiFetch(`/api/social-media/${selectedAccount._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/social-media", {
          method: "POST",
          body: JSON.stringify(payload),
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

  const handleDelete = async (account: SocialMediaAccount) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      await apiFetch(`/api/social-media/${account._id}`, {
        method: "DELETE",
      });
      await accountsQuery.refetch();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleEdit = (account: SocialMediaAccount) => {
    setSelectedAccount(account);
    setFormData(account);
    setIsEditDialogOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <ExternalLink className="h-4 w-4 mr-2" />
          Social Media Accounts
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-5xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 sm:space-y-2">
          <DialogTitle className="text-lg sm:text-xl">
            Social Media Accounts
          </DialogTitle>
          <DialogDescription>
            Manage brand accounts and login information
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
            <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
          </div>
        )}

        <div className="space-y-4">
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
                Add Account
              </Button>
            </DialogTrigger>

            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedAccount ? "Edit Account" : "Add New Account"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <select
                    value={formData.platform || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, platform: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select platform</option>
                    {platformOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Brand</label>
                  <input
                    type="text"
                    value={formData.brand || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                    placeholder="Brand name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">URL</label>
                  <input
                    type="url"
                    value={formData.url || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Username</label>
                  <input
                    type="text"
                    value={formData.username || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value, accountHandle: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                    placeholder="Username"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status || "Active"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as SocialMediaAccount["status"],
                      })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="bg-primary"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {accountsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No accounts yet. Click "Add Account" to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {accounts.map((account) => (
                <motion.div
                  key={account._id}
                  variants={itemVariants}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{account.platform}</h3>
                      <a
                        href={account.url?.startsWith("http") ? account.url : `https://${account.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        @{account.username}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Badge className={statusColors[account.status]}>
                      {account.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    Brand: {account.brand}
                  </p>

                  {account.notes && (
                    <p className="text-xs text-muted-foreground mb-3">{account.notes}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(account)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCredentials(showCredentials === account._id ? null : account._id)}
                    >
                      <Lock className="h-3 w-3" />
                      Login
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(account)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {showCredentials === account._id && (
                    <Card className="mt-3 bg-muted/30">
                      <CardContent className="p-3 text-xs">
                        <p className="font-medium mb-2">Credentials Vault</p>
                        <p className="text-muted-foreground">
                          Credential management available through Credential Vault
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
