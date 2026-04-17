import { useCallback } from "react";
import { useTaskBlasterContext, type TaskBlasterTask, type TaskBlasterPriority } from "@/contexts/TaskBlasterContext";

export interface UseTaskBlasterReturn {
  trigger: (task: TaskBlasterTask) => boolean;
  isEligible: (task: TaskBlasterTask) => boolean;
  dismiss: () => void;
  settings: {
    enabled: boolean;
    soundEnabled: boolean;
    animationEnabled: boolean;
    autoMode: boolean;
    priorityOnly: boolean;
  };
  updateSettings: (settings: Partial<{
    enabled: boolean;
    soundEnabled: boolean;
    animationEnabled: boolean;
    autoMode: boolean;
    priorityOnly: boolean;
  }>) => void;
}

/**
 * Hook to use TaskBlaster functionality
 * This hook provides a simplified interface to trigger blaster animations
 * when tasks are completed
 * 
 * @example
 * ```tsx
 * const { trigger, isEligible } = useTaskBlaster();
 * 
 * const handleTaskComplete = (task) => {
 *   saveTask(task);
 *   if (isEligible(task)) {
 *     trigger(task);
 *   }
 * };
 * ```
 */
export function useTaskBlaster(): UseTaskBlasterReturn {
  const {
    triggerBlaster,
    dismissBlaster,
    isEligible,
    settings,
    updateSettings,
  } = useTaskBlasterContext();

  const trigger = useCallback((task: TaskBlasterTask): boolean => {
    return triggerBlaster(task);
  }, [triggerBlaster]);

  const dismiss = useCallback(() => {
    dismissBlaster();
  }, [dismissBlaster]);

  return {
    trigger,
    isEligible,
    dismiss,
    settings,
    updateSettings,
  };
}

/**
 * Helper function to convert task priority string to TaskBlasterPriority
 */
export function normalizePriority(priority: string): TaskBlasterPriority {
  const normalized = priority.toLowerCase();
  if (normalized === "top" || normalized === "highest") return "top";
  if (normalized === "red" || normalized === "critical") return "red";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

/**
 * Check if task completion should trigger blaster
 * Uses both priority rules and streak milestone rules
 */
export function shouldTriggerBlaster(
  task: { priority: string; id: string },
  completedCount: number,
  settings: { priorityOnly: boolean; enabled: boolean }
): boolean {
  if (!settings.enabled) return false;

  const priority = normalizePriority(task.priority);
  const isTopPriority = priority === "top" || priority === "red";
  const isHighPriority = priority === "high";

  // Check priority-only setting
  if (settings.priorityOnly && !isTopPriority && !isHighPriority) {
    return false;
  }

  // Check streak milestones (3rd, 5th, 10th)
  const nextCount = completedCount + 1;
  const isStreakMilestone = nextCount === 3 || nextCount === 5 || nextCount === 10;

  return isTopPriority || isHighPriority || isStreakMilestone;
}
