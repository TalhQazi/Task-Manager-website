import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/admin/ui/alert-dialog";
import { Plus, Trash2, Users, Shield, UserPlus, ToggleLeft, ToggleRight } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { toast } from "@/hooks/use-toast";

interface TeamLeadMapping {
  id: string;
  teamLead: string;
  user: string;
  allowOverrideAdminAssignments: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function TeamLeadMappings() {
  const [mappings, setMappings] = useState<TeamLeadMapping[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<TeamLeadMapping | null>(null);
  const [formData, setFormData] = useState({
    teamLead: "",
    users: [] as string[],
    allowOverrideAdminAssignments: false,
  });
  const [userToAdd, setUserToAdd] = useState<string>("");

  const fetchMappings = async () => {
    try {
      const res = await apiFetch<{ items: TeamLeadMapping[] }>("/api/team-lead-mappings");
      setMappings(res?.items || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch team lead mappings",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch<{ items: User[] }>("/api/users");
      setUsers(res?.items || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMappings(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamLead || formData.users.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Team Lead and at least one User are required",
      });
      return;
    }

    try {
      await Promise.all(
        formData.users.map((user) =>
          apiFetch("/api/team-lead-mappings", {
            method: "POST",
            body: JSON.stringify({
              teamLead: formData.teamLead,
              user,
              allowOverrideAdminAssignments: formData.allowOverrideAdminAssignments,
            }),
          })
        )
      );
      toast({
        title: "Success",
        description: "Team lead mapping saved successfully",
      });
      setDialogOpen(false);
      setFormData({ teamLead: "", users: [], allowOverrideAdminAssignments: false });
      setUserToAdd("");
      await fetchMappings();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save team lead mapping",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedMapping) return;

    try {
      await apiFetch(`/api/team-lead-mappings?teamLead=${encodeURIComponent(selectedMapping.teamLead)}&user=${encodeURIComponent(selectedMapping.user)}`, {
        method: "DELETE",
      });
      toast({
        title: "Success",
        description: "Team lead mapping deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedMapping(null);
      await fetchMappings();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete team lead mapping",
      });
    }
  };

  const teamLeads = users.filter((u) => u.role === "team-lead" || u.role === "admin" || u.role === "super-admin");
  const regularUsers = users.filter((u) => u.role === "employee" || u.role === "manager" || u.role === "team-lead");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Lead Mappings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage team lead to user mappings and delegation permissions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF] hover:from-[#0072FF] hover:to-[#00C6FF]">
              <Plus className="w-4 h-4 mr-2" />
              Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Team Lead Mapping</DialogTitle>
              <DialogDescription>
                Map a user to a team lead to enable task delegation
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team Lead</label>
                  <Select
                    value={formData.teamLead}
                    onValueChange={(value) => setFormData({ ...formData, teamLead: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamLeads.map((user) => (
                        <SelectItem key={user.id} value={user.username || user.name}>
                          {user.name || user.username} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">User</label>
                  <Select value={userToAdd} onValueChange={setUserToAdd}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {regularUsers.map((user) => (
                        <SelectItem key={user.id} value={user.username || user.name}>
                          {user.name || user.username} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!userToAdd) return;
                        setFormData((prev) => {
                          if (prev.users.includes(userToAdd)) return prev;
                          return { ...prev, users: [...prev.users, userToAdd] };
                        });
                        setUserToAdd("");
                      }}
                      disabled={!userToAdd}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                    <p className="text-xs text-gray-500">Add multiple users one by one</p>
                  </div>
                  {formData.users.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.users.map((u) => (
                        <Badge
                          key={u}
                          variant="secondary"
                          className="flex items-center gap-2"
                        >
                          <span className="truncate max-w-[220px]">{u}</span>
                          <button
                            type="button"
                            className="text-gray-500 hover:text-gray-800"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                users: prev.users.filter((x) => x !== u),
                              }))
                            }
                            aria-label={`Remove ${u}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowOverride"
                    checked={formData.allowOverrideAdminAssignments}
                    onChange={(e) =>
                      setFormData({ ...formData, allowOverrideAdminAssignments: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="allowOverride" className="text-sm font-medium">
                    Allow override of admin assignments
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  When enabled, team leads can reassign tasks even if they were originally assigned by admins
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF]">
                  Save Mapping
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Existing Mappings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C6FF]" />
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No team lead mappings found</p>
              <p className="text-sm">Add a mapping to enable team lead delegation</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Lead</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Override Admin</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">{mapping.teamLead}</TableCell>
                    <TableCell>{mapping.user}</TableCell>
                    <TableCell>
                      {mapping.allowOverrideAdminAssignments ? (
                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20">
                          <ToggleRight className="w-3 h-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <ToggleLeft className="w-3 h-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(mapping.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMapping(mapping);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the mapping between {selectedMapping?.teamLead} and{" "}
              {selectedMapping?.user}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
