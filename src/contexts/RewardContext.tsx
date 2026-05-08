import React, { createContext, useContext, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";
import { getEmployeeAuth } from "@/Employee/lib/auth";
import { TaskCompletionEffect } from "@/components/rewards/TaskCompletionEffect";

interface RewardContextType {
  triggerReward: (x: number, y: number) => void;
}

const RewardContext = createContext<RewardContextType | null>(null);

export const useRewards = () => {
  const context = useContext(RewardContext);
  if (!context) throw new Error("useRewards must be used within a RewardProvider");
  return context;
};

export const RewardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRewards, setActiveRewards] = useState<{ id: number; x: number; y: number }[]>([]);

  // Detect active token (Admin or Employee)
  const auth = getAuthState();
  const empAuth = getEmployeeAuth();
  const token = auth?.token || empAuth?.token;
  const isAuthenticated = auth?.isAuthenticated || !!empAuth?.token;

  // 1. Fetch Global System Settings (Publicly accessible but requires some auth)
  const systemSettingsQuery = useQuery({
    queryKey: ["system-settings-public"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await apiFetch<{ item: { taskRewardSystemEnabled: boolean } }>("/api/system-settings/public");
      return res.item;
    },
  });

  // 2. Fetch User Preferences
  const userPrefsQuery = useQuery({
    queryKey: ["settings"], 
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await apiFetch<{ item: { rewardSettings: any } }>("/api/settings");
      return res.item;
    },
  });

  const triggerReward = useCallback((x: number, y: number) => {
    // Check Global Disable
    if (systemSettingsQuery.data?.taskRewardSystemEnabled === false) return;

    // Check if reduced motion is preferred at OS level
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setActiveRewards((prev) => [...prev, { id: Date.now(), x, y }]);
  }, [systemSettingsQuery.data]);

  const removeReward = (id: number) => {
    setActiveRewards((prev) => prev.filter((r) => r.id !== id));
  };

  const rewardSettings = userPrefsQuery.data?.rewardSettings || {
    animationsEnabled: true,
    hapticsEnabled: true,
    soundEnabled: false,
  };

  return (
    <RewardContext.Provider value={{ triggerReward }}>
      {children}
      {activeRewards.map((reward) => (
        <TaskCompletionEffect
          key={reward.id}
          x={reward.x}
          y={reward.y}
          settings={rewardSettings}
          onComplete={() => removeReward(reward.id)}
        />
      ))}
    </RewardContext.Provider>
  );
};
