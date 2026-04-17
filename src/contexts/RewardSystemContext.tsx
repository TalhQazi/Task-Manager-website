import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { getAuthState } from "@/lib/auth";
import { getEmployeeAuth } from "@/Employee/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import { rewardService } from "@/services/rewardService";
import { Trophy, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Reward {
  taskId: string;
  taskTitle: string;
  message: string;
  animationStyle: "pulse" | "checkmark";
  rewardedBy: string;
}

interface RewardContextType {
  lastReward: Reward | null;
  clearReward: () => void;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export const RewardSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [activeReward, setActiveReward] = useState<Reward | null>(null);

  useEffect(() => {
    if (!socket) return;

    const auth = getAuthState();
    const employeeAuth = getEmployeeAuth();
    
    // We need a unique identifier to listen for. 
    // Usually, the backend emits to 'user-reward-{id}'.
    // If we don't have MongoDB ID in local storage, we might need to rely on username if the backend supports it.
    // However, looking at the backend code, it uses assignee._id.
    // For now, let's assume we can use username if we adjust the backend, 
    // or better, find where the ID is stored.
    
    const currentUser = employeeAuth || (auth.isAuthenticated ? auth : null);
    if (!currentUser) return;

    // We'll use username for now, and I will ensure the backend emits to username too.
    const identifier = currentUser.username;

    const handleUserRewarded = (data: any) => {
      const reward: Reward = {
        taskId: data.taskId,
        taskTitle: data.taskTitle,
        message: data.message || data.reward?.message || "Great job!",
        animationStyle: (data.animationStyle === "pulse" || data.reward?.animationStyle === "pulse") ? "pulse" : "checkmark",
        rewardedBy: data.rewardedBy || data.reward?.rewardedBy || "Manager"
      };

      // Get preferences from the fetched profile (or stick to defaults if not yet loaded)
      // Since notifications/rewards settings are in the employee profile query
      const profile = queryClient.getQueryData<any>(["employee-profile"]);
      const prefs = profile?.item?.rewards || { enabled: true, animations: true, sounds: false, haptics: false };

      if (prefs.enabled) {
        if (prefs.animations) {
          setActiveReward(reward);
        }
        if (prefs.sounds) {
          void rewardService.playRewardSound();
        }
        if (prefs.haptics) {
          rewardService.triggerHaptic();
        }
      }

      // Invalidate tasks to show reward status in UI
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Auto-clear after animation duration
      setTimeout(() => {
        setActiveReward(null);
      }, 5000);
    };

    socket.on(`user-reward-${identifier}`, handleUserRewarded);

    return () => {
      socket.off(`user-reward-${identifier}`, handleUserRewarded);
    };
  }, [socket, queryClient]);

  const clearReward = () => setActiveReward(null);

  return (
    <RewardContext.Provider value={{ lastReward: activeReward, clearReward }}>
      {children}
      <AnimatePresence>
        {activeReward && (
          <RewardOverlay reward={activeReward} onComplete={() => setActiveReward(null)} />
        )}
      </AnimatePresence>
    </RewardContext.Provider>
  );
};

export const useRewardSystem = () => {
  const context = useContext(RewardContext);
  if (!context) throw new Error("useRewardSystem must be used within a RewardSystemProvider");
  return context;
};

const RewardOverlay: React.FC<{ reward: Reward; onComplete: () => void }> = ({ reward, onComplete }) => {
  const getIcon = () => {
    return reward.animationStyle === "pulse"
      ? <Trophy className="w-12 h-12 text-yellow-500" />
      : <CheckCircle2 className="w-12 h-12 text-green-500" />;
  };

  const getAnimationProps = () => {
    switch (reward.animationStyle) {
      case "pulse":
        return {
          animate: { scale: [1, 1.2, 1], opacity: [0, 1, 1, 0] },
          transition: { duration: 3, times: [0, 0.2, 0.8, 1] }
        };
      case "checkmark":
        return {
          animate: { y: [20, 0], opacity: [0, 1, 1, 0], scale: [0.8, 1] },
          transition: { duration: 3 }
        };
      default:
        return {
          animate: { scale: [1, 1.1, 1], opacity: [0, 1, 1, 0] },
          transition: { duration: 3 }
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
    >
      <motion.div
        {...getAnimationProps()}
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-yellow-200 dark:border-yellow-900/50 p-8 rounded-3xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] flex flex-col items-center gap-4 text-center max-w-sm mx-4"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.2, repeat: 2 }}
          >
            {getIcon()}
          </motion.div>
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Excellent Work!</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            You've been rewarded for: <span className="text-slate-900 dark:text-slate-200 font-bold">"{reward.taskTitle}"</span>
          </p>
        </div>

        {reward.message && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-xl">
             <p className="text-sm italic text-yellow-700 dark:text-yellow-400 font-medium">
               "{reward.message}"
             </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
           <Trophy className="w-3 h-3 fill-yellow-400 text-yellow-400" />
           Reward Granted by {reward.rewardedBy}
        </div>
      </motion.div>
    </motion.div>
  );
};
