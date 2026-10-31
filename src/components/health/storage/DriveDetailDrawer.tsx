import { useEffect } from "react";
import { cn } from "@/lib/admin/utils";
import { DRIVE_STATUS_TOKENS, type Drive } from "./types";
import {
  X,
  HardDrive,
  Thermometer,
  Clock,
  ShieldCheck,
  Activity,
  Gauge,
  Layers,
  AlertTriangle,
} from "lucide-react";

interface DriveDetailDrawerProps {
  drive: Drive | null;
  onClose: () => void;
}

function StatRow({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-white/55">
        {icon}
        {label}
      </span>
      <span className={cn("text-sm font-semibold text-white", valueClass)}>{value}</span>
    </div>
  );
}

function formatPoh(hours: number | null): string {
  if (hours == null) return "—";
  const days = Math.floor(hours / 24);
  const years = (hours / 8760).toFixed(1);
  return `${hours.toLocaleString()} h · ${days}d (${years}y)`;
}

export function DriveDetailDrawer({ drive, onClose }: DriveDetailDrawerProps) {
  const open = !!drive;

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!drive) return null;
  const tokens = DRIVE_STATUS_TOKENS[drive.status];
  const score = drive.healthScore ?? 0;
  const scoreColor =
    score >= 85 ? "text-emerald-300" : score >= 60 ? "text-yellow-300" : "text-red-300";

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Drive bay ${drive.bay} details`}>
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* panel */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0B1120] shadow-2xl animate-slide-in-right">
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl border", tokens.bg, tokens.border)}>
              <HardDrive className={cn("h-5 w-5", tokens.text)} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Bay {String(drive.bay).padStart(2, "0")}
              </h3>
              <p className="max-w-[16rem] truncate text-xs text-white/50">{drive.model}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drive details"
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* status + health score */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Status</div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className="absolute inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tokens.dot, boxShadow: `0 0 8px ${tokens.glow}` }}
                  />
                </span>
                <span className={cn("text-sm font-bold", tokens.text)}>{tokens.label}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs uppercase tracking-wider text-white/40">Health Score</div>
              <div className={cn("text-2xl font-bold tabular-nums", scoreColor)}>{score}</div>
            </div>
          </div>

          {/* rebuild progress */}
          {drive.status === "rebuilding" && drive.rebuildPercent != null && (
            <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/5 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-yellow-300">
                  <Gauge className="h-4 w-4" /> Rebuild in progress
                </span>
                <span className="font-bold text-yellow-300">{drive.rebuildPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${drive.rebuildPercent}%` }} />
              </div>
            </div>
          )}

          {/* health reasons */}
          {drive.healthReasons.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/45">
                <AlertTriangle className="h-3.5 w-3.5" /> Diagnostics
              </div>
              <ul className="space-y-1.5">
                {drive.healthReasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/40" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* details */}
          <div className="space-y-2">
            <div className="px-1 text-xs font-semibold uppercase tracking-wider text-white/35">Device</div>
            <StatRow icon={<Layers className="h-4 w-4" />} label="Serial" value={drive.serial ?? "—"} />
            <StatRow icon={<HardDrive className="h-4 w-4" />} label="Capacity" value={drive.capacityGB ? `${drive.capacityGB} GB` : "—"} />
            <StatRow
              icon={<Thermometer className="h-4 w-4" />}
              label="Temperature"
              value={drive.temperatureC != null ? `${drive.temperatureC}°C` : "—"}
              valueClass={
                drive.temperatureC != null && drive.temperatureC >= 55
                  ? drive.temperatureC >= 60
                    ? "text-red-300"
                    : "text-orange-300"
                  : undefined
              }
            />
            <StatRow icon={<Clock className="h-4 w-4" />} label="Power-On Hours" value={formatPoh(drive.powerOnHours)} />
          </div>

          <div className="space-y-2">
            <div className="px-1 text-xs font-semibold uppercase tracking-wider text-white/35">Health & RAID</div>
            <StatRow
              icon={<ShieldCheck className="h-4 w-4" />}
              label="SMART Status"
              value={drive.smartStatus ?? "—"}
              valueClass={drive.smartStatus === "PASSED" ? "text-emerald-300" : drive.smartStatus === "FAILED" ? "text-red-300" : undefined}
            />
            <StatRow
              icon={<Layers className="h-4 w-4" />}
              label="RAID Member"
              value={drive.raidState ?? "—"}
              valueClass={drive.raidState === "ONLINE" ? "text-emerald-300" : drive.raidState ? "text-red-300" : undefined}
            />
            <StatRow icon={<Gauge className="h-4 w-4" />} label="Utilization" value={drive.utilizationPercent != null ? `${drive.utilizationPercent}%` : "—"} />
          </div>

          <div className="space-y-2">
            <div className="px-1 text-xs font-semibold uppercase tracking-wider text-white/35">Throughput</div>
            <StatRow icon={<Activity className="h-4 w-4 text-blue-400" />} label="Read Speed" value={drive.readMBps != null ? `${drive.readMBps} MB/s` : "—"} valueClass="text-blue-300" />
            <StatRow icon={<Activity className="h-4 w-4 text-amber-400" />} label="Write Speed" value={drive.writeMBps != null ? `${drive.writeMBps} MB/s` : "—"} valueClass="text-amber-300" />
          </div>
        </div>
      </aside>
    </div>
  );
}
