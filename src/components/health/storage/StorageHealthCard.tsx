import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/admin/utils";
import {
  Database,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ServerCrash,
  RefreshCw,
  Clock,
  Layers,
  HardDrive,
} from "lucide-react";
import { useStorageHealth } from "./useStorageHealth";
import { DriveBayGrid } from "./DriveBayGrid";
import { DriveDetailDrawer } from "./DriveDetailDrawer";
import { SUMMARY_STATUS_TOKENS, type Drive, type StorageDiagnostics, type SummaryStatus } from "./types";
import { HardDriveDownload, Terminal } from "lucide-react";

interface StorageHealthCardProps {
  serverId?: string;
  className?: string;
}

function StatusBadge({ status }: { status: SummaryStatus }) {
  const tokens = SUMMARY_STATUS_TOKENS[status];
  const Icon =
    status === "healthy"
      ? CheckCircle2
      : status === "rebuilding"
      ? Loader2
      : status === "unavailable"
      ? ServerCrash
      : AlertTriangle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        tokens.bg,
        tokens.text,
        tokens.border
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ backgroundColor: tokens.dot }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: tokens.dot }} />
      </span>
      <Icon className={cn("h-3.5 w-3.5", status === "rebuilding" && "animate-spin")} />
      {tokens.label}
    </span>
  );
}

function SummaryPill({
  icon,
  value,
  label,
  tone = "default",
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-300"
      : tone === "warn"
      ? "text-orange-300"
      : tone === "bad"
      ? "text-red-300"
      : "text-white";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="text-white/40">{icon}</div>
      <div className="min-w-0">
        <div className={cn("text-sm font-bold leading-tight", toneClass)}>{value}</div>
        <div className="truncate text-[11px] text-white/45">{label}</div>
      </div>
    </div>
  );
}

/** Ticking relative timestamp so "Last updated" stays live between polls. */
function LiveTimestamp({ date }: { date: Date | null }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);
  if (!date) return <span>—</span>;
  return <span>{formatDistanceToNow(date, { addSuffix: true })}</span>;
}

/** Honest empty state shown when the host can't provide real drive telemetry. */
function UnavailableState({
  message,
  diagnostics,
  onRetry,
}: {
  message?: string;
  diagnostics?: StorageDiagnostics;
  onRetry: () => void;
}) {
  const checks: Array<{ label: string; value?: string; ok: boolean }> = [
    { label: "OS", value: diagnostics?.platform, ok: diagnostics?.platform === "linux" },
    { label: "lsblk", value: diagnostics?.lsblk, ok: diagnostics?.lsblk === "found" },
    { label: "smartctl", value: diagnostics?.smartctl, ok: diagnostics?.smartctl === "found" },
    { label: "iostat", value: diagnostics?.iostat, ok: diagnostics?.iostat === "found" },
    { label: "storcli / perccli", value: diagnostics?.storcli, ok: (diagnostics?.storcli || "").startsWith("found") },
    { label: "running as root", value: diagnostics?.ranAsRoot ? "yes" : "no", ok: !!diagnostics?.ranAsRoot },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.015] p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <HardDriveDownload className="h-7 w-7 text-white/40" />
        </div>
        <h3 className="text-base font-semibold text-white">No physical drive telemetry</h3>
        <p className="mt-1 max-w-md text-sm text-white/50">
          {message || "Real drive & RAID data could not be collected on this host."}
        </p>
      </div>

      {/* Per-tool diagnostics */}
      <div className="mx-auto mt-6 max-w-md space-y-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs">
            <span className="text-white/55">{c.label}</span>
            <span className={cn("flex items-center gap-1.5 font-medium", c.ok ? "text-emerald-300" : "text-orange-300")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", c.ok ? "bg-emerald-400" : "bg-orange-400")} />
              {c.value || "—"}
            </span>
          </div>
        ))}
      </div>

      {diagnostics?.notes && diagnostics.notes.length > 0 && (
        <div className="mx-auto mt-4 max-w-md rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            <Terminal className="h-3.5 w-3.5" /> Diagnostics
          </div>
          <ul className="space-y-1">
            {diagnostics.notes.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/40" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fix-it hint */}
      <div className="mx-auto mt-4 max-w-md rounded-lg border border-amber-400/15 bg-amber-500/[0.04] p-3 text-xs text-white/60">
        <p className="mb-1.5 font-medium text-amber-200/80">To enable real data on this server:</p>
        <code className="block whitespace-pre-wrap break-words rounded bg-black/40 p-2 font-mono text-[11px] text-white/70">
          sudo apt install smartmontools sysstat util-linux{"\n"}
          # PERC/MegaRAID: install perccli or storcli{"\n"}
          # run the backend with root / CAP_SYS_RAWIO so smartctl can read drives
        </code>
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Re-check
        </button>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
      <div className="mb-3 h-3 w-40 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-2.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-lg bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

export function StorageHealthCard({ serverId = "host", className }: StorageHealthCardProps) {
  const { data, loading, error, lastUpdated, refresh } = useStorageHealth(serverId);
  const [selected, setSelected] = useState<Drive | null>(null);

  // Keep the open drawer in sync with fresh telemetry (live temps/speeds).
  useEffect(() => {
    if (!selected || !data) return;
    const fresh = data.drives.find((d) => d.bay === selected.bay);
    if (fresh) setSelected(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const summary = data?.summary;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-b from-[#141d33] to-[#101728] shadow-xl",
        className
      )}
    >
      {/* subtle gold top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/15 to-amber-600/5">
            <Database className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Storage Health</h2>
            <p className="text-xs text-white/45">
              {data?.model || "Physical drive & RAID monitoring"}
              {summary?.source === "live" && (
                <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> live
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary && <StatusBadge status={summary.status} />}
          <button
            type="button"
            onClick={refresh}
            aria-label="Refresh storage health"
            className="rounded-lg border border-white/10 p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {/* Error state */}
        {error && !data ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-400/20 bg-red-500/5 py-12 text-center">
            <ServerCrash className="h-10 w-10 text-red-400/70" />
            <div>
              <p className="font-semibold text-white">Storage telemetry unavailable</p>
              <p className="mt-1 max-w-sm text-sm text-white/50">{error}</p>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="mt-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Retry
            </button>
          </div>
        ) : loading && !data ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[62px] animate-pulse rounded-xl bg-white/[0.03]" />
              ))}
            </div>
            <GridSkeleton />
          </>
        ) : summary?.source === "unavailable" ? (
          <UnavailableState message={summary.message} diagnostics={data?.diagnostics} onRetry={refresh} />
        ) : summary && data ? (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryPill
                icon={<HardDrive className="h-5 w-5" />}
                value={`${summary.trueHealthyDrives} / ${summary.installedDrives}`}
                label="Drives Healthy"
                tone={summary.failed > 0 ? "bad" : summary.warnings > 0 ? "warn" : "good"}
              />
              <SummaryPill
                icon={<ShieldCheck className="h-5 w-5" />}
                value={summary.raidStatus}
                label={summary.raidLevel}
                tone={
                  summary.raidStatus === "Healthy"
                    ? "good"
                    : summary.raidStatus === "No RAID"
                    ? "default"
                    : "warn"
                }
              />
              <SummaryPill
                icon={<AlertTriangle className="h-5 w-5" />}
                value={String(summary.warnings)}
                label={summary.warnings === 1 ? "Warning" : "Warnings"}
                tone={summary.warnings > 0 ? "warn" : "default"}
              />
              <SummaryPill
                icon={<Layers className="h-5 w-5" />}
                value={`${summary.installedDrives} / ${summary.totalBays}`}
                label="Bays Populated"
              />
            </div>

            {/* Visual drive panel */}
            <DriveBayGrid drives={data.drives} onSelect={setSelected} selectedBay={selected?.bay} />

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-white/55">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/70" />
                  RAID: <span className="font-medium text-white/80">{summary.raidStatus}</span>
                </span>
                <span className="flex items-center gap-1.5 text-white/55">
                  <Database className="h-3.5 w-3.5 text-blue-400/70" />
                  Disk Usage: <span className="font-medium text-white/80">{summary.diskUsagePercent}%</span>
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-white/40">
                <Clock className="h-3.5 w-3.5" />
                Updated <LiveTimestamp date={lastUpdated} />
              </span>
            </div>
          </>
        ) : null}
      </div>

      <DriveDetailDrawer drive={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
