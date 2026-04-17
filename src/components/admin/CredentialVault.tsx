import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Key,
  Copy,
  CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

interface Credential {
  _id?: string;
  resourceName: string;
  resourceType: "website" | "social-media" | "api" | "service" | "other";
  username: string;
  email?: string;
  passwordHash?: string; // Encrypted
  apiKey?: string; // Encrypted
  notes?: string;
  lastUpdated?: string;
  expiryDate?: string;
  isActive: boolean;
}

const resourceTypeColors: Record<Credential["resourceType"], string> = {
  "website": "bg-blue-500/10 text-blue-700 border border-blue-300",
  "social-media": "bg-purple-500/10 text-purple-700 border border-purple-300",
  "api": "bg-green-500/10 text-green-700 border border-green-300",
  "service": "bg-orange-500/10 text-orange-700 border border-orange-300",
  "other": "bg-gray-500/10 text-gray-700 border border-gray-300",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

export function CredentialVault() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Credential>({
    resourceName: "",
    resourceType: "website",
    username: "",
    email: "",
    passwordHash: "",
    apiKey: "",
    notes: "",
    isActive: true,
  });

  const credentialsQuery = useQuery<Credential[]>({
    queryKey: ["credentials"],
    queryFn: async () => {
      const res = await apiFetch<{ items: Credential[] }>(
        "/api/credentials"
      );
      return res.items || [];
    },
  });

  const handleOpenDialog = (credential?: Credential) => {
    if (credential) {
      setSelectedCredential(credential);
      setFormData(credential);
    } else {
      setSelectedCredential(null);
      setFormData({
        resourceName: "",
        resourceType: "website",
        username: "",
        email: "",
        passwordHash: "",
        apiKey: "",
        notes: "",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.resourceName || !formData.username) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (selectedCredential) {
        await apiFetch(`/api/credentials/${selectedCredential._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/credentials", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      await credentialsQuery.refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save credential:", error);
      alert("Failed to save credential");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;

    try {
      await apiFetch(`/api/credentials/${id}`, { method: "DELETE" });
      await credentialsQuery.refetch();
    } catch (error) {
      console.error("Failed to delete credential:", error);
      alert("Failed to delete credential");
    }
  };

  const copyToClipboard = (text: string | undefined, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const credentials = credentialsQuery.data || [];
  const activeCount = credentials.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Credential Vault</h2>
          <p className="text-sm text-gray-500">
            Securely store and manage access credentials
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedCredential ? "Edit Credential" : "New Credential"}
              </DialogTitle>
              <DialogDescription>
                Store secure access information for resources
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Resource Name *</label>
                <input
                  type="text"
                  value={formData.resourceName}
                  onChange={(e) =>
                    setFormData({ ...formData, resourceName: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Company Website Admin"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Resource Type</label>
                <select
                  value={formData.resourceType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resourceType: e.target.value as Credential["resourceType"],
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="website">Website</option>
                  <option value="social-media">Social Media</option>
                  <option value="api">API</option>
                  <option value="service">Service</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Username/ID *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Username or identifier"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Associated email"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={formData.passwordHash}
                  onChange={(e) =>
                    setFormData({ ...formData, passwordHash: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password (encrypted in storage)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">API Key</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="API key (encrypted in storage)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Active
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {selectedCredential ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Total Credentials</p>
              <p className="text-3xl font-bold">{credentials.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-green-600">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-3xl font-bold text-gray-600">
                {credentials.length - activeCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials List */}
      {credentialsQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Loading credentials...
          </CardContent>
        </Card>
      ) : credentials.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold">No Credentials Stored</p>
              <p className="text-sm text-gray-500">Start by adding your first credential</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4"
        >
          {credentials.map((cred) => {
            const isShowing = showPasswords[cred._id!];
            const isExpiring =
              cred.expiryDate &&
              new Date(cred.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return (
              <motion.div key={cred._id} variants={itemVariants}>
                <Card
                  className={`hover:shadow-md transition-shadow ${
                    !cred.isActive ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-lg">
                              {cred.resourceName}
                            </h3>
                            {cred.isActive ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <Badge className={resourceTypeColors[cred.resourceType]}>
                            {cred.resourceType}
                          </Badge>
                          {isExpiring && cred.expiryDate && (
                            <Badge variant="destructive" className="text-xs">
                              Expiring: {new Date(cred.expiryDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(cred)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(cred._id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium">Username</p>
                          <div className="flex items-center justify-between mt-1">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {cred.username}
                            </code>
                            <button
                              onClick={() => copyToClipboard(cred.username, `user-${cred._id}`)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Copy username"
                            >
                              {copiedId === `user-${cred._id}` ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {cred.email && (
                          <div>
                            <p className="text-gray-600 font-medium">Email</p>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {cred.email}
                            </code>
                          </div>
                        )}

                        {cred.passwordHash && (
                          <div>
                            <p className="text-gray-600 font-medium">Password</p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {isShowing ? cred.passwordHash : "••••••••"}
                              </code>
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    setShowPasswords({
                                      ...showPasswords,
                                      [cred._id!]: !isShowing,
                                    })
                                  }
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  {isShowing ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      cred.passwordHash,
                                      `pass-${cred._id}`
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {copiedId === `pass-${cred._id}` ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {cred.apiKey && (
                          <div>
                            <p className="text-gray-600 font-medium">API Key</p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs truncate">
                                {isShowing ? cred.apiKey : "••••••••"}
                              </code>
                              <button
                                onClick={() =>
                                  copyToClipboard(cred.apiKey, `key-${cred._id}`)
                                }
                                className="text-blue-600 hover:text-blue-700"
                              >
                                {copiedId === `key-${cred._id}` ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {cred.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600">
                            <strong>Notes:</strong> {cred.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Security Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            All credentials are encrypted at rest and access is logged for audit purposes. Only authorized administrators can view and manage credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
