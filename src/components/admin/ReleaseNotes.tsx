import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Sparkles, CheckCircle2, Bug, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CURRENT_VERSION = "1.2.0";

const RELEASE_NOTES = [
  {
    type: "feature",
    title: "Live Locations & Tracking",
    description: "Added robust image rendering for site locations and lazy-loading for better performance.",
    icon: Zap,
    color: "text-blue-500",
  },
  {
    type: "fix",
    title: "CRUD Stability",
    description: "Fixed payload validation errors in Vehicles, Websites, and Social Media modules.",
    icon: Bug,
    color: "text-amber-500",
  },
  {
    type: "fix",
    title: "Task Management",
    description: "Resolved a critical crash when updating standalone tasks without a parent project.",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  {
    type: "improvement",
    title: "Social Media Suite",
    description: "Aligned platform enums and improved field handling for easier brand management.",
    icon: Sparkles,
    color: "text-purple-500",
  },
];

export function ReleaseNotes() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastVersion = localStorage.getItem("last_seen_version");
    if (lastVersion !== CURRENT_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("last_seen_version", CURRENT_VERSION);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md sm:max-w-lg border-0 bg-white/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles size={120} />
          </div>
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/30"
            >
              New Update v{CURRENT_VERSION}
            </motion.div>
            <DialogTitle className="text-3xl font-black tracking-tight leading-none mb-2">
              What's New in <span className="text-indigo-200">TaskFlow Admin</span>
            </DialogTitle>
            <DialogDescription className="text-indigo-100 text-lg font-medium opacity-90">
              We've improved stability and added new features to your workspace.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-slate-50/50">
          <AnimatePresence>
            {RELEASE_NOTES.map((note, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className={`mt-1 p-2 rounded-lg bg-slate-50 ${note.color}`}>
                  <note.icon size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">{note.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {note.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <DialogFooter className="p-6 bg-white border-t border-slate-100">
          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-indigo-500/20 text-lg transition-all hover:scale-[1.02] active:scale-100"
          >
            Got it, Let's go!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
