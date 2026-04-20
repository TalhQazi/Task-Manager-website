import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Sparkles, CheckCircle2, ChevronRight, Rocket, Zap, Users, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Update this version and list when making significant changes
const CURRENT_VERSION = "2.1.0";
const RELEASE_NOTES = [
  {
    title: "Performance Boost",
    description: "Locations module loading speed optimized by 95% using lazy-loaded assets.",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    title: "Filtered Reassignments",
    description: "Task and Project reassignment dropdowns now exclusively show active employees.",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Digital Assets Fix",
    description: "Resolved validation issues in Future Websites and improved data mapping.",
    icon: Globe,
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    title: "Real-time Updates",
    description: "Introduced this release notes system to keep you informed of new features.",
    icon: Rocket,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
];

export function ReleaseNotes() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem("last_seen_version");
    if (lastSeenVersion !== CURRENT_VERSION) {
      // Delay slightly to ensure user is settled
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("last_seen_version", CURRENT_VERSION);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white relative">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute top-6 right-8"
          >
            <Sparkles className="h-12 w-12 text-white/30" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Version {CURRENT_VERSION}</p>
            <DialogTitle className="text-3xl font-black tracking-tight">What's New</DialogTitle>
            <DialogDescription className="text-white/80 mt-2 font-medium">
              We've been busy making Task Manager even better for you.
            </DialogDescription>
          </motion.div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900">
          <div className="space-y-5">
            <AnimatePresence>
              {RELEASE_NOTES.map((note, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  className="flex items-start gap-4"
                >
                  <div className={`h-10 w-10 rounded-xl ${note.bg} flex items-center justify-center flex-shrink-0`}>
                    <note.icon className={`h-5 w-5 ${note.color}`} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{note.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {note.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <DialogFooter className="mt-8">
            <Button 
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
