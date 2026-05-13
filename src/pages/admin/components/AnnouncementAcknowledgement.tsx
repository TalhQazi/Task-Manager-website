import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Checkbox } from "@/components/admin/ui/checkbox";
import { toast } from "@/components/admin/ui/use-toast";
import { apiFetch } from "@/lib/admin/apiClient";
import { AlertTriangle, CheckCircle2, X, AlertCircle } from "lucide-react";

type JsonFetch = <T = unknown>(path: string, init?: RequestInit) => Promise<T>;

interface AnnouncementAcknowledgementProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: any;
  onSuccess?: () => void;
  /** Defaults to admin apiFetch (supports manager/admin JWT). Use employeeApiFetch from the employee portal. */
  request?: JsonFetch;
}

export default function AnnouncementAcknowledgement({
  isOpen,
  onClose,
  announcement,
  onSuccess,
  request = apiFetch,
}: AnnouncementAcknowledgementProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [requiresTypedConfirmation] = useState(false);

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      return request<any>(`/api/announcements/${announcement.id}/acknowledge`, {
        method: "POST",
        body: JSON.stringify({ acknowledged: true }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement acknowledged",
      });
      onSuccess?.();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge announcement",
        variant: "destructive",
      });
    },
  });

  if (!isOpen || !announcement) return null;

  const priorityColors = {
    low: "blue",
    medium: "yellow",
    high: "orange",
    critical: "red",
  };

  const bgColor = priorityColors[announcement.priority as keyof typeof priorityColors] || "red";
  const isEmergency = announcement.emergency || announcement.priority === "critical";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl mx-4 rounded-lg border-2 overflow-hidden shadow-2xl ${
          isEmergency
            ? `border-${bgColor}-500/50 bg-gradient-to-br from-${bgColor}-500/10 to-transparent`
            : "border-white/20 bg-gradient-to-br from-white/10 to-white/5"
        }`}
      >
        {/* Close button */}
        {!isEmergency && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white z-10"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Emergency Header */}
        {isEmergency && (
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center gap-3">
            <div className="animate-pulse">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">EMERGENCY ANNOUNCEMENT</h2>
              <p className="text-sm text-red-100">Requires immediate acknowledgement</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!isEmergency && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{announcement.title}</h2>
              <p className="text-sm text-white/60">
                From {announcement.authorName} • {new Date(announcement.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {isEmergency && (
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-white mb-2">{announcement.title}</h3>
              <p className="text-sm text-white/60">
                From {announcement.authorName} • {new Date(announcement.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Message Content */}
          <div className={`p-4 rounded-lg border ${
            isEmergency
              ? "border-red-500/30 bg-red-500/10"
              : "border-white/10 bg-white/5"
          }`}>
            <div className="text-white/90 space-y-2">
              {announcement.body}
            </div>
          </div>

          {/* Acknowledgement Confirmation */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-start gap-3">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={() => setAcknowledged(!acknowledged)}
                className="mt-1"
              />
              <label htmlFor="acknowledge" className="text-sm text-white/80 cursor-pointer flex-1">
                I have read and understand this announcement and acknowledge receipt.
              </label>
            </div>

            {requiresTypedConfirmation && acknowledged && (
              <div className="mt-3">
                <label className="text-xs font-semibold text-white/70 mb-2 block">
                  Type "YES" to confirm:
                </label>
                <Input
                  type="text"
                  placeholder="Type YES to confirm"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                  className="bg-white/5 border-white/10 text-white placeholder-white/40"
                />
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200">
              {isEmergency
                ? "This is an emergency announcement. Your acknowledgement will be recorded."
                : "This announcement requires your acknowledgement. Please confirm that you have read this message."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/[0.03] border-t border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <CheckCircle2 className="h-4 w-4" />
            <span>Acknowledgement will be recorded</span>
          </div>
          <div className="flex gap-3">
            {!isEmergency && (
              <Button
                variant="outline"
                onClick={onClose}
                className="border-white/20 hover:bg-white/10"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={() => acknowledgeMutation.mutate()}
              disabled={
                !acknowledged ||
                acknowledgeMutation.isPending ||
                (requiresTypedConfirmation && confirmationText !== "YES")
              }
              className="gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg hover:shadow-green-600/20"
            >
              {acknowledgeMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Acknowledging...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  I Acknowledge
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
