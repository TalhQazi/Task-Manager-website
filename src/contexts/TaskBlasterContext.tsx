import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type TaskBlasterPriority = "low" | "medium" | "high" | "top" | "red";

export interface TaskBlasterTask {
  id: string;
  title: string;
  priority: TaskBlasterPriority;
  status: string;
}

export interface TaskBlasterSettings {
  enabled: boolean;
  soundEnabled: boolean;
  animationEnabled: boolean;
  autoMode: boolean;
  priorityOnly: boolean;
}

export interface TaskBlasterState {
  isVisible: boolean;
  task: TaskBlasterTask | null;
  settings: TaskBlasterSettings;
  lastTriggeredAt: number | null;
  completedTasksCount: number;
  streakCount: number;
}

interface TaskBlasterContextType {
  state: TaskBlasterState;
  settings: TaskBlasterSettings;
  updateSettings: (settings: Partial<TaskBlasterSettings>) => void;
  triggerBlaster: (task: TaskBlasterTask) => boolean;
  dismissBlaster: () => void;
  popBlaster: () => void;
  isEligible: (task: TaskBlasterTask) => boolean;
  incrementCompletedCount: () => void;
}

const defaultSettings: TaskBlasterSettings = {
  enabled: true,
  soundEnabled: true,
  animationEnabled: true,
  autoMode: false,
  priorityOnly: true,
};

const STORAGE_KEY = "task_blaster_settings";
const COMPLETED_COUNT_KEY = "task_blaster_completed_count";
const LAST_TRIGGERED_KEY = "task_blaster_last_triggered";

const TaskBlasterContext = createContext<TaskBlasterContextType | null>(null);

export function useTaskBlasterContext() {
  const context = useContext(TaskBlasterContext);
  if (!context) {
    throw new Error("useTaskBlasterContext must be used within a TaskBlasterProvider");
  }
  return context;
}

interface TaskBlasterProviderProps {
  children: ReactNode;
}

export function TaskBlasterProvider({ children }: TaskBlasterProviderProps) {
  // Load settings from localStorage
  const loadSettings = (): TaskBlasterSettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore parse errors
    }
    return defaultSettings;
  };

  const loadCompletedCount = (): number => {
    try {
      const saved = localStorage.getItem(COMPLETED_COUNT_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  };

  const loadLastTriggered = (): number | null => {
    try {
      const saved = localStorage.getItem(LAST_TRIGGERED_KEY);
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  };

  const [settings, setSettings] = useState<TaskBlasterSettings>(loadSettings);
  const [isVisible, setIsVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskBlasterTask | null>(null);
  const [completedCount, setCompletedCount] = useState(loadCompletedCount);
  const [lastTriggeredAt, setLastTriggeredAt] = useState<number | null>(loadLastTriggered);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Save completed count
  useEffect(() => {
    localStorage.setItem(COMPLETED_COUNT_KEY, completedCount.toString());
  }, [completedCount]);

  // Save last triggered time
  useEffect(() => {
    if (lastTriggeredAt) {
      localStorage.setItem(LAST_TRIGGERED_KEY, lastTriggeredAt.toString());
    }
  }, [lastTriggeredAt]);

  const updateSettings = useCallback((newSettings: Partial<TaskBlasterSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Check if task is eligible for blaster animation
  const isEligible = useCallback((task: TaskBlasterTask): boolean => {
    // If globally disabled
    if (!settings.enabled) return false;

    // Check priority eligibility
    const isTopPriority = task.priority === "top" || task.priority === "high";
    const isRedPriority = task.priority === "red";

    // Check if priority-only mode is enabled
    if (settings.priorityOnly && !(isTopPriority || isRedPriority)) {
      return false;
    }

    // Check streak milestones (3rd, 5th, 10th task)
    const newCount = completedCount + 1;
    const isStreakMilestone = newCount === 3 || newCount === 5 || newCount === 10;

    // If not a priority task and not a streak milestone, don't trigger
    if (!(isTopPriority || isRedPriority || isStreakMilestone)) {
      return false;
    }

    // Check frequency limit (1 per 20 seconds)
    if (lastTriggeredAt) {
      const timeSinceLastTrigger = Date.now() - lastTriggeredAt;
      if (timeSinceLastTrigger < 20000) {
        return false;
      }
    }

    return true;
  }, [settings.enabled, settings.priorityOnly, completedCount, lastTriggeredAt]);

  const triggerBlaster = useCallback((task: TaskBlasterTask): boolean => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return false;
    }

    if (!isEligible(task)) {
      return false;
    }

    setCurrentTask(task);
    setIsVisible(true);
    setLastTriggeredAt(Date.now());
    return true;
  }, [isEligible]);

  const dismissBlaster = useCallback(() => {
    setIsVisible(false);
    setCurrentTask(null);
  }, []);

  const popBlaster = useCallback(() => {
    // Handle pop animation completion
    setIsVisible(false);
    setCurrentTask(null);
  }, []);

  const incrementCompletedCount = useCallback(() => {
    setCompletedCount((prev) => prev + 1);
  }, []);

  const state: TaskBlasterState = {
    isVisible,
    task: currentTask,
    settings,
    lastTriggeredAt,
    completedTasksCount: completedCount,
    streakCount: completedCount,
  };

  const value: TaskBlasterContextType = {
    state,
    settings,
    updateSettings,
    triggerBlaster,
    dismissBlaster,
    popBlaster,
    isEligible,
    incrementCompletedCount,
  };

  return (
    <TaskBlasterContext.Provider value={value}>
      {children}
    </TaskBlasterContext.Provider>
  );
}
