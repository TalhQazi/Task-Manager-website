// Shared types for the Storage Health card. Mirrors the normalized payload
// returned by GET /api/health/servers/:id/storage-health.

export type DriveStatus =
  | "healthy"
  | "active"
  | "rebuilding"
  | "warning"
  | "failed"
  | "empty";

export type SummaryStatus = "healthy" | "warning" | "failed" | "rebuilding" | "unavailable";

export interface Drive {
  bay: number;
  installed: boolean;
  status: DriveStatus;
  model: string | null;
  serial: string | null;
  capacityGB: number | null;
  rpm?: number | null;
  transport?: string | null;
  temperatureC: number | null;
  powerOnHours: number | null;
  smartStatus: "PASSED" | "FAILED" | "FAILING" | "UNKNOWN" | null;
  raidState: "ONLINE" | "OFFLINE" | "REBUILDING" | "FAILED" | null;
  readMBps: number | null;
  writeMBps: number | null;
  utilizationPercent: number | null;
  healthScore: number | null;
  healthReasons: string[];
  rebuildPercent: number | null;
  pendingSectors?: number;
  reallocatedSectors?: number;
}

export interface RaidControllerInfo {
  name: string;
  tool?: string;
  status: string;
  level: string;
  bbuStatus?: string;
  cacheStatus?: string;
  firmwareVersion?: string | null;
  hardwareDetected?: boolean;
  hardwareNotice?: string | null;
}

export interface StorageSummary {
  status: SummaryStatus;
  totalBays: number;
  installedDrives: number;
  healthyDrives: number;
  trueHealthyDrives: number;
  warnings: number;
  failed: number;
  rebuilding: number;
  raidStatus: string;
  raidLevel: string;
  diskUsagePercent: number;
  source: "live" | "unavailable";
  /** "physical" = per-drive SMART/RAID; "filesystem" = real logical volumes only. */
  mode?: "physical" | "filesystem";
  message?: string;
  raidController?: RaidControllerInfo | null;
}

export interface StorageDiagnostics {
  platform?: string;
  hostname?: string;
  lsblk?: string;
  smartctl?: string;
  iostat?: string;
  storcli?: string;
  ranAsRoot?: boolean;
  notes?: string[];
}

export interface StorageHealthPayload {
  serverId: string;
  model: string;
  timestamp: string;
  summary: StorageSummary;
  diagnostics?: StorageDiagnostics;
  drives: Drive[];
}

// Visual tokens per drive status — dark, muted, enterprise palette (no neon).
export interface StatusTokens {
  label: string;
  dot: string; // solid color for indicators
  text: string; // tailwind text class
  bg: string; // tailwind bg tint class
  border: string; // tailwind border class
  glow: string; // box-shadow color (rgba)
}

export const DRIVE_STATUS_TOKENS: Record<DriveStatus, StatusTokens> = {
  healthy: {
    label: "Healthy",
    dot: "#34d399",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/30",
    glow: "rgba(52, 211, 153, 0.35)",
  },
  active: {
    label: "Active I/O",
    dot: "#60a5fa",
    text: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-400/30",
    glow: "rgba(96, 165, 250, 0.4)",
  },
  rebuilding: {
    label: "Rebuilding",
    dot: "#facc15",
    text: "text-yellow-300",
    bg: "bg-yellow-500/10",
    border: "border-yellow-400/30",
    glow: "rgba(250, 204, 21, 0.4)",
  },
  warning: {
    label: "Warning",
    dot: "#fb923c",
    text: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-400/30",
    glow: "rgba(251, 146, 60, 0.4)",
  },
  failed: {
    label: "Failed",
    dot: "#f87171",
    text: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-400/30",
    glow: "rgba(248, 113, 113, 0.45)",
  },
  empty: {
    label: "Empty",
    dot: "#64748b",
    text: "text-slate-400",
    bg: "bg-white/[0.015]",
    border: "border-white/10",
    glow: "rgba(100, 116, 139, 0.0)",
  },
};

// Summary badge tokens (Healthy / Warning / Failed / Rebuilding).
export const SUMMARY_STATUS_TOKENS: Record<SummaryStatus, StatusTokens> = {
  healthy: DRIVE_STATUS_TOKENS.healthy,
  warning: DRIVE_STATUS_TOKENS.warning,
  failed: DRIVE_STATUS_TOKENS.failed,
  rebuilding: DRIVE_STATUS_TOKENS.rebuilding,
  unavailable: {
    label: "Unavailable",
    dot: "#64748b",
    text: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-400/30",
    glow: "rgba(100, 116, 139, 0.3)",
  },
};
