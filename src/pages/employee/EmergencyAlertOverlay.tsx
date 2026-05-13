import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/admin/ui/button";

interface EmergencyAlertOverlayProps {
  isOpen: boolean;
  announcement: {
    id: string;
    title: string;
    body: string;
    priority: string;
    requiresAcknowledgement: boolean;
  } | null;
  onClose: () => void;
  onAcknowledge?: () => void;
}

export default function EmergencyAlertOverlay({
  isOpen,
  announcement,
  onClose,
  onAcknowledge,
}: EmergencyAlertOverlayProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling when overlay is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!announcement) return null;

  const isEmergency = announcement.priority === "critical" || announcement.priority === "high";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          {/* Animated border */}
          <motion.div
            className="absolute inset-0 border-2 border-red-500"
            animate={{
              boxShadow: [
                "0 0 20px 0 rgba(239, 68, 68, 0.3)",
                "0 0 40px 0 rgba(239, 68, 68, 0.5)",
                "0 0 20px 0 rgba(239, 68, 68, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ pointerEvents: "none" }}
          />

          {/* Main Alert */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl mx-4 rounded-lg overflow-hidden shadow-2xl"
          >
            {/* Header with gradient */}
            <motion.div
              className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 px-8 py-8 text-center relative overflow-hidden"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            >
              {/* Animated background shapes */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
              </motion.div>

              {/* Content */}
              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertTriangle className="h-16 w-16 text-white mx-auto mb-4 drop-shadow-lg" />
                </motion.div>
                <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
                  EMERGENCY ALERT
                </h1>
                <p className="text-red-100 text-lg drop-shadow-md">
                  Immediate attention required
                </p>
              </div>
            </motion.div>

            {/* Content */}
            <div className="bg-gradient-to-b from-gray-900 to-black px-8 py-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Title */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {announcement.title}
                </h2>
              </div>

              {/* Message */}
              <motion.div
                className="p-6 rounded-lg border-2 border-red-500/30 bg-red-500/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-white/90 text-lg leading-relaxed space-y-3">
                  {announcement.body}
                </div>
              </motion.div>

              {/* Important Notice */}
              <motion.div
                className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-yellow-200 text-sm">
                  ⚠️ <strong>Important:</strong> This is an urgent announcement. Please read carefully
                  and take appropriate action. Failure to acknowledge this alert will be recorded.
                </p>
              </motion.div>

              {/* Checklist */}
              {announcement.requiresAcknowledgement && (
                <motion.div
                  className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-blue-200 font-semibold mb-3">Confirm acknowledgement:</p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-blue-400 cursor-pointer"
                    />
                    <span className="text-blue-100 group-hover:text-blue-50 transition-colors">
                      I acknowledge that I have read this alert and understand the required action
                    </span>
                  </label>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6 flex items-center justify-between border-t border-red-500/20">
              <div className="text-sm text-white/60">
                Your response will be recorded
              </div>
              <div className="flex gap-3">
                {!announcement.requiresAcknowledgement && (
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-white/20 hover:bg-white/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                )}
                <Button
                  onClick={() => {
                    onAcknowledge?.();
                    onClose();
                  }}
                  disabled={announcement.requiresAcknowledgement && !acknowledged}
                  className={`gap-2 ${
                    announcement.requiresAcknowledgement && !acknowledged
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-600/20 hover:from-red-500 hover:to-red-600"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  I Acknowledge
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
