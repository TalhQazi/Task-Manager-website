import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Save, X, Quote, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "@/components/admin/ui/use-toast";
import { apiFetch } from "@/lib/admin/apiClient";

interface FounderMessage {
  _id: string;
  message: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export default function FounderMessagesAdmin() {
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
      await apiFetch(`/api/founder-messages/admin/${id}`, { method: "DELETE" });
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

  const handleCreate = () => {
    if (!newMessage.trim()) {
      toast({ title: "Message is required", variant: "destructive" });
      return;
    }
    createMutation.mutate(newMessage.trim());
  };

  const handleUpdate = () => {
    if (!editingMessage) return;
    if (!editMessageText.trim()) {
      toast({ title: "Message is required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: editingMessage._id,
      message: editMessageText.trim(),
    });
  };

  const handleToggleActive = (message: FounderMessage) => {
    updateMutation.mutate({
      id: message._id,
      isActive: !message.isActive,
    });
  };

  const openEdit = (message: FounderMessage) => {
    setEditingMessage(message);
    setEditMessageText(message.message);
    setIsEditOpen(true);
  };

  const openDelete = (message: FounderMessage) => {
    setDeletingMessage(message);
    setIsDeleteOpen(true);
  };

  const activeCount = messages.filter((m) => m.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Founder Messages</h1>
          <p className="text-muted-foreground">Manage motivational messages that appear on the dashboard</p>
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
            <p className="text-3xl font-bold">{messages.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-500">{messages.length - activeCount}</p>
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
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Quote className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No messages found. Create your first motivational message!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    message.isActive ? "bg-background" : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                    <p className={`font-medium truncate ${!message.isActive && "text-muted-foreground"}`}>
                      "{message.message}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={message.isActive ? "default" : "secondary"}>
                      {message.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(message)}
                      className="h-8 w-8 p-0"
                    >
                      {message.isActive ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(message)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDelete(message)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Message</DialogTitle>
            <DialogDescription>Create a motivational message for users to see on their dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter a motivational message..."
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{newMessage.length}/200 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>Update this motivational message.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Input
                value={editMessageText}
                onChange={(e) => setEditMessageText(e.target.value)}
                placeholder="Enter a motivational message..."
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{editMessageText.length}/200 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="gap-2">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Update Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the message: "{deletingMessage?.message}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMessage && deleteMutation.mutate(deletingMessage._id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
