// WIP Dashboard — shared types. Mirrors src/constants/wip.js on the backend.

export type WipStatus =
  | "working"
  | "paused"
  | "blocked"
  | "waiting"
  | "break"
  | "meeting"
  | "review"
  | "complete"
  | "offline"
  | "force_stopped";

export type WipEventType =
  | "start" | "pause" | "resume" | "statusChange" | "progressUpdate" | "note"
  | "upload" | "blockerAdded" | "blockerRemoved" | "requestUpdate"
  | "responseUpdate" | "complete" | "forceStop" | "reassigned"
  | "locationUpdate" | "idlePrompt";

export type BlockerCategory =
  | "parts" | "customer" | "vendor" | "approval" | "payment"
  | "inspection" | "court" | "management_decision" | "other";

export type BlockerSeverity = "low" | "medium" | "high" | "critical";

export interface WipBlocker {
  _id: string;
  reason: string;
  category: BlockerCategory;
  severity: BlockerSeverity;
  blockedOn?: string;
  createdAt: string;
}

/** One row of the live grid. */
export interface WipSession {
  _id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string | null;
  department: string;
  taskId: string;
  taskTitle: string;
  taskPriority?: "high" | "medium" | "low";
  taskDueDate?: string | null;
  projectId: string | null;
  projectName: string;
  status: WipStatus;
  statusColor: string;
  startedAt: string;
  endedAt?: string | null;
  pausedAt: string | null;
  pausedTotalSeconds: number;
  elapsedSeconds: number;
  progressPercent: number;
  laborCostCents: number;
  locationId: string | null;
  locationName: string;
  lastActivityAt: string;
  deviceType: string;
  estimatedFinishAt: string | null;
  blocker?: WipBlocker | null;
}

export interface WipSummary {
  employeesClockedIn: number;
  currentlyWorking: number;
  pausedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  activeProjects: number;
  averageActiveSeconds: number;
  runningLaborCostCents: number;
  totalActiveSessions: number;
  generatedAt: string;
}

export interface WipEvent {
  _id: string;
  workSessionId: string;
  eventType: WipEventType;
  oldValue: unknown;
  newValue: unknown;
  note: string;
  metadata: Record<string, unknown>;
  source: string;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  createdAt: string;
  clientTimestamp?: string | null;
}

export interface WipManagerNote {
  _id: string;
  body: string;
  createdByName: string;
  createdByRole: string;
  createdAt: string;
}

export interface WipSessionDetail {
  session: WipSession & {
    task?: { title: string; priority?: string; dueDate?: string; status?: string; category?: string };
    project?: { name: string; status?: string };
    employee?: { name: string; department?: string; email?: string; role?: string; avatar?: string };
    location?: { name: string; type: string };
  };
  events: WipEvent[];
  /** Present only for managers/owners. Absent — not empty — for employees. */
  managerNotes?: WipManagerNote[];
}

export interface WipListResponse {
  items: WipSession[];
  total: number;
  page: number;
  limit: number;
}

export interface WipActivityItem extends WipEvent {
  session: {
    employeeName: string;
    taskTitle: string;
    projectName: string;
    department: string;
    status: WipStatus;
  };
}

export interface WipFilterState {
  search?: string;
  employee?: string;
  department?: string;
  project?: string;
  status?: string;
  priority?: string;
  location?: string;
  dueBefore?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface WipSettings {
  enabled: boolean;
  gpsEnabled: boolean;
  gpsRequireConsent: boolean;
  heartbeatSeconds: number;
  idle: {
    enabled: boolean;
    softWarningMinutes: number;
    reminderMinutes: number;
    promptMinutes: number;
    managerAlertMinutes: number;
    excludedStatuses: WipStatus[];
  };
  departments: Array<{ department: string; enabled: boolean; idle: Record<string, unknown> }>;
  tvMode: { rotationSeconds: number; rowsPerPage: number; staleAfterSeconds: number; departments: string[] };
}

// ---------------------------------------------------------------------------
// Status presentation. Dark, muted, enterprise — one token set, used everywhere.
// ---------------------------------------------------------------------------
export interface StatusToken {
  label: string;
  dot: string;
  text: string;
  bg: string;
  border: string;
}

export const WIP_STATUS_TOKENS: Record<WipStatus, StatusToken> = {
  working:      { label: "Working",      dot: "#34d399", text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-400/30" },
  paused:       { label: "Paused",       dot: "#facc15", text: "text-yellow-300",  bg: "bg-yellow-500/10",  border: "border-yellow-400/30" },
  blocked:      { label: "Blocked",      dot: "#f87171", text: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-400/30" },
  waiting:      { label: "Waiting",      dot: "#fb923c", text: "text-orange-300",  bg: "bg-orange-500/10",  border: "border-orange-400/30" },
  break:        { label: "Break",        dot: "#fbbf24", text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-400/30" },
  meeting:      { label: "Meeting",      dot: "#60a5fa", text: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-400/30" },
  review:       { label: "Review",       dot: "#c084fc", text: "text-purple-300",  bg: "bg-purple-500/10",  border: "border-purple-400/30" },
  complete:     { label: "Complete",     dot: "#9ca3af", text: "text-gray-300",    bg: "bg-gray-500/10",    border: "border-gray-400/30" },
  offline:      { label: "Offline",      dot: "#4b5563", text: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-500/30" },
  force_stopped:{ label: "Force Stopped",dot: "#fb7185", text: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-400/30" },
};

export const PRIORITY_TOKENS: Record<string, { label: string; className: string }> = {
  high:   { label: "High",   className: "text-red-300 bg-red-500/10 border-red-400/30" },
  medium: { label: "Medium", className: "text-amber-300 bg-amber-500/10 border-amber-400/30" },
  low:    { label: "Low",    className: "text-slate-300 bg-slate-500/10 border-slate-400/30" },
};

/** Statuses an employee/manager may switch into directly (terminal ones excluded). */
export const SELECTABLE_STATUSES: WipStatus[] = [
  "working", "paused", "blocked", "waiting", "break", "meeting", "review",
];
