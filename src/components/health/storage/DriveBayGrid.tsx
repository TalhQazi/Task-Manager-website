import { cn } from "@/lib/admin/utils";
import { DriveActivityBars } from "./DriveActivityBars";
import { DRIVE_STATUS_TOKENS, type Drive } from "./types";
import { Thermometer, Gauge } from "lucide-react";

interface DriveBayGridProps {
  drives: Drive[];
  onSelect: (drive: Drive) => void;
  selectedBay?: number | null;
}

function DriveTooltip({ drive, above }: { drive: Drive; above: boolean }) {
  const tokens = DRIVE_STATUS_TOKENS[drive.status];
  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-1/2 z-30 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0B1120]/95 p-3 text-left shadow-2xl backdrop-blur-sm",
        "opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100",
        above ? "bottom-full mb-2" : "top-full mt-2"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-white">Bay {String(drive.bay).padStart(2, "0")}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", tokens.bg, tokens.text)}>
          {tokens.label}
        </span>
      </div>
      <div className="space-y-1 text-[11px]">
        <Row label="Model" value={drive.model ?? "—"} />
        <Row label="Capacity" value={drive.capacityGB ? `${drive.capacityGB} GB` : "—"} />
        <Row label="Temp" value={drive.temperatureC != null ? `${drive.temperatureC}°C` : "—"} />
        <Row label="SMART" value={drive.smartStatus ?? "—"} />
        <Row label="RAID" value={drive.raidState ?? "—"} />
        <Row label="Read" value={drive.readMBps != null ? `${drive.readMBps} MB/s` : "—"} />
        <Row label="Write" value={drive.writeMBps != null ? `${drive.writeMBps} MB/s` : "—"} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/40">{label}</span>
      <span className="truncate font-medium text-white/85">{value}</span>
    </div>
  );
}

function DriveBay({
  drive,
  above,
  selected,
  onSelect,
}: {
  drive: Drive;
  above: boolean;
  selected: boolean;
  onSelect: (d: Drive) => void;
}) {
  const tokens = DRIVE_STATUS_TOKENS[drive.status];
  const empty = !drive.installed;

  const ledAnimation =
    drive.status === "failed"
      ? "animate-drive-fail-pulse"
      : drive.status === "empty"
      ? ""
      : "animate-drive-pulse";

  return (
    <div className="group relative">
      <button
        type="button"
        disabled={empty}
        onClick={() => !empty && onSelect(drive)}
        aria-label={
          empty
            ? `Bay ${drive.bay} empty`
            : `Bay ${drive.bay}, ${drive.model}, ${tokens.label}`
        }
        className={cn(
          "relative flex h-[74px] w-full flex-col justify-between overflow-hidden rounded-lg border p-2 text-left transition-all duration-200",
          empty
            ? "cursor-default border-dashed border-white/10 bg-white/[0.015]"
            : "cursor-pointer border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
          selected && !empty && "border-amber-400/60 ring-1 ring-amber-400/40"
        )}
        style={
          !empty
            ? { boxShadow: selected ? `0 0 0 1px ${tokens.glow}` : undefined }
            : undefined
        }
      >
        {/* caddy latch rail (decorative) */}
        <span className="pointer-events-none absolute inset-y-1 left-1 w-[3px] rounded-full bg-white/5" />

        {/* Active I/O scan sheen */}
        {drive.status === "active" && (
          <span className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="absolute top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-blue-400/15 to-transparent animate-drive-scan" />
          </span>
        )}

        <div className="flex items-start justify-between pl-2">
          <span className={cn("text-[10px] font-bold tracking-wider", empty ? "text-white/25" : "text-white/60")}>
            {String(drive.bay).padStart(2, "0")}
          </span>
          {/* status LED */}
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span
              className={cn("absolute inline-flex h-2.5 w-2.5 rounded-full", ledAnimation)}
              style={{ backgroundColor: tokens.dot, boxShadow: empty ? "none" : `0 0 6px ${tokens.glow}` }}
            />
          </span>
        </div>

        {empty ? (
          <div className="pl-2 text-[9px] uppercase tracking-widest text-white/20">Empty</div>
        ) : (
          <div className="flex items-end justify-between pl-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-[9px] text-white/45">
                <Thermometer className="h-2.5 w-2.5" />
                {drive.temperatureC}°C
              </div>
              {drive.status === "rebuilding" && drive.rebuildPercent != null ? (
                <div className="flex items-center gap-1 text-[9px] font-semibold text-yellow-300">
                  <Gauge className="h-2.5 w-2.5" />
                  {drive.rebuildPercent}%
                </div>
              ) : (
                <div className="text-[9px] font-medium text-white/45">{drive.capacityGB} GB</div>
              )}
            </div>
            <DriveActivityBars readMBps={drive.readMBps ?? 0} writeMBps={drive.writeMBps ?? 0} />
          </div>
        )}

        {/* rebuild progress rail */}
        {drive.status === "rebuilding" && drive.rebuildPercent != null && (
          <span className="pointer-events-none absolute bottom-0 left-0 h-[3px] bg-yellow-400/80" style={{ width: `${drive.rebuildPercent}%` }} />
        )}
      </button>

      {!empty && <DriveTooltip drive={drive} above={above} />}
    </div>
  );
}

export function DriveBayGrid({ drives, onSelect, selectedBay }: DriveBayGridProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
      {/* chassis label strip */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
          Front Backplane · 16 Bays
        </span>
        <span className="hidden text-[10px] font-medium text-white/25 sm:block">2.5&quot; SAS / SATA</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-2.5">
        {drives.map((drive, i) => {
          // Bottom visual row(s) point tooltips upward to avoid clipping below.
          const cols = 8;
          const isBottomRow = i >= drives.length - cols;
          return (
            <DriveBay
              key={drive.bay}
              drive={drive}
              above={isBottomRow}
              selected={selectedBay === drive.bay}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
