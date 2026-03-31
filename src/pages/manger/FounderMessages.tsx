import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Save, X, Quote, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/manger/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/manger/ui/alert-dialog";
import { toast } from "@/components/manger/ui/use-toast";
import { apiFetch } from "@/lib/manger/api";

interface FounderMessage {
  _id: string;
  message: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export default function FounderMessagesManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<FounderMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<FounderMessage | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [editMessageText, setEditMessageText] = useState("");

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["founder-messages-admin"],
    queryFn: async () => {
      const res = await apiFetch<{ items: FounderMessage[] }>("/api/founder-messages/admin");
      return res.items;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiFetch<{ item: FounderMessage }>("/api/founder-messages/admin", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      return res.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-messages-admin"] });
      setIsCreateOpen(false);
      setNewMessage("");
      toast({ title: "Message created", description: "New founder message has been added." });
    },
    onError: (err) => {
      toast({
        title: "Failed to create message",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, message, isActive }: { id: string; message?: string; isActive?: boolean }) => {
      const res = await apiFetch<{ item: FounderMessage }>(`/api/founder-messages/admin/${id}`, {
        method: "PUT",
        body: JSON.stringify({ message, isActive }),
      });
      return res.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-messages-admin"] });
      setIsEditOpen(false);
      setEditingMessage(null);
      setEditMessageText("");
      toast({ title: "Message updated", description: "Founder message has been updated." });
    },
    onError: (err) => {
      toast({
        title: "Failed to update message",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/founder-messages/admin/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-messages-admin"] });
      setIsDeleteOpen(false);
      setDeletingMessage(null);
      toast({ title: "Message deleted", description: "Founder message has been removed." });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete message",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActive = (msg: FounderMessage) => {
    updateMutation.mutate({ id: msg._id, isActive: !msg.isActive });
  };

  // Open edit dialog
  const openEdit = (msg: FounderMessage) => {
    setEditingMessage(msg);
    setEditMessageText(msg.message);
    setIsEditOpen(true);
  };

  // Open delete dialog
  const openDelete = (msg: FounderMessage) => {
    setDeletingMessage(msg);
    setIsDeleteOpen(true);
  };

  // Save edit
  const saveEdit = () => {
    if (editingMessage && editMessageText.trim()) {
      updateMutation.mutate({ id: editingMessage._id, message: editMessageText.trim() });
    }
  };

  // Create new
  const handleCreate = () => {
    if (newMessage.trim()) {
      createMutation.mutate(newMessage.trim());
    }
  };

  // Delete confirm
  const handleDelete = () => {
    if (deletingMessage) {
      deleteMutation.mutate(deletingMessage._id);
    }
  };

  const activeMessages = messages.filter((m) => m.isActive);
  const inactiveMessages = messages.filter((m) => !m.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Founder Messages</h1>
          <p className="text-sm text-muted-foreground">
            Manage motivational messages shown on the dashboard
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Message
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{messages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeMessages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">{inactiveMessages.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            All Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Add your first motivational message!
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    msg.isActive ? "bg-card" : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant={msg.isActive ? "default" : "secondary"}>
                      {msg.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className={`truncate ${!msg.isActive ? "text-muted-foreground" : ""}`}>
                      {msg.message}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(msg)}
                      disabled={updateMutation.isPending}
                    >
                      {msg.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(msg)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDelete(msg)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Message</DialogTitle>
            <DialogDescription>
              Create a motivational message for users to see on their dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Message</label>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter a motivational message..."
              className="mt-2"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {newMessage.length}/200 characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newMessage.trim() || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Message</label>
            <Input
              value={editMessageText}
              onChange={(e) => setEditMessageText(e.target.value)}
              placeholder="Enter a motivational message..."
              className="mt-2"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editMessageText.length}/200 characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={!editMessageText.trim() || updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
