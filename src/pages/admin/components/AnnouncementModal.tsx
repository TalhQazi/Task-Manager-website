import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Badge } from "@/components/admin/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/admin/ui/form";
import { Checkbox } from "@/components/admin/ui/checkbox";
import { toast } from "@/components/admin/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/admin/apiClient";
import { Loader2, X, Plus } from "lucide-react";

const announcementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  category: z.enum(["general", "policy", "training", "safety", "hr", "it", "operations"]),
  requiresAcknowledgement: z.boolean(),
  sendPushNotification: z.boolean(),
  sendEmail: z.boolean(),
  sendSMS: z.boolean(),
  pinned: z.boolean(),
  emergency: z.boolean(),
  repeatFrequency: z.enum(["none", "daily", "weekly"]),
  expiresAt: z.string().optional(),
  scheduledAt: z.string().optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: any;
  onSuccess?: () => void;
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  announcement,
  onSuccess,
}: AnnouncementModalProps) {
  const queryClient = useQueryClient();
  const [selectedTargets, setSelectedTargets] = useState<any[]>(announcement?.targets || []);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: announcement ? {
      title: announcement.title,
      body: announcement.body,
      priority: announcement.priority,
      category: announcement.category,
      requiresAcknowledgement: announcement.requiresAcknowledgement,
      sendPushNotification: announcement.sendPushNotification,
      sendEmail: announcement.sendEmail,
      sendSMS: announcement.sendSMS,
      pinned: announcement.pinned,
      emergency: announcement.emergency,
      repeatFrequency: announcement.repeatFrequency,
      expiresAt: announcement.expiresAt?.split('T')[0],
      scheduledAt: announcement.scheduledAt?.split('T')[0],
    } : {
      title: "",
      body: "",
      priority: "medium",
      category: "general",
      requiresAcknowledgement: false,
      sendPushNotification: true,
      sendEmail: false,
      sendSMS: false,
      pinned: false,
      emergency: false,
      repeatFrequency: "none",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const url = announcement
        ? `/api/announcements/${announcement.id}`
        : `/api/announcements`;

      const method = announcement ? "PUT" : "POST";

      return apiFetch<{ item: unknown }>(url, {
        method,
        body: JSON.stringify({
          ...data,
          targets: selectedTargets,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Success",
        description: announcement ? "Announcement updated" : "Announcement created",
      });
      onSuccess?.();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save announcement",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {announcement ? "Edit Announcement" : "Create Announcement"}
          </DialogTitle>
          <DialogDescription>
            {announcement 
              ? "Update the announcement details"
              : "Create a new announcement for your team"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Announcement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Body */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Announcement content (HTML supported)"
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority and Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="it">IT</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule For (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires At (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Repeat Frequency */}
            <FormField
              control={form.control}
              name="repeatFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repeat</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkboxes */}
            <div className="space-y-3 border-t pt-4">
              <FormField
                control={form.control}
                name="requiresAcknowledgement"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="mb-0 font-normal cursor-pointer">
                      Require read acknowledgement
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendPushNotification"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="mb-0 font-normal cursor-pointer">
                      Send push notification
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="mb-0 font-normal cursor-pointer">
                      Send email notification
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendSMS"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="mb-0 font-normal cursor-pointer">
                      Send SMS notification
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pinned"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="mb-0 font-normal cursor-pointer">
                      Pin to dashboard
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="mb-0 font-normal cursor-pointer">
                      Mark as emergency alert
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 gap-2 bg-gradient-to-r from-[#00C6FF] to-[#0072FF]"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {announcement ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
