import React from "react";
import { Cpu, ShieldCheck, BatteryCharging, CpuIcon, AlertCircle, Info, HardDrive, Terminal } from "lucide-react";
import { type RaidControllerInfo } from "./types";

interface RaidControllerCardProps {
  controller?: RaidControllerInfo | null;
  raidLevel?: string;
  raidStatus?: string;
}

export function RaidControllerCard({ controller, raidLevel, raidStatus }: RaidControllerCardProps) {
  if (!controller && (!raidLevel || raidLevel === "No RAID controller")) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Cpu className="h-4 w-4 text-white/40" />
          <span>RAID Controller: <strong className="text-white/80">None Detected / Standalone Disks</strong></span>
        </div>
        <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">HBA / Direct Attached</span>
      </div>
    );
  }

  const name = controller?.name || "Hardware RAID Controller";
  const bbu = controller?.bbuStatus || "Optimal";
  const cache = controller?.cacheStatus || "Optimal";
  const fw = controller?.firmwareVersion;
  const isHealthy = (raidStatus || controller?.status) === "Healthy";
  const notice = controller?.hardwareNotice;

  return (
    <div className="rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-500/[0.06] via-white/[0.02] to-amber-500/[0.03] p-4 text-xs text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
            <Cpu className="h-4 w-4 text-amber-300" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              {name}
              {fw && <span className="text-[10px] font-mono text-white/40">FW: {fw}</span>}
            </h4>
            <p className="text-[11px] text-white/50 flex items-center gap-1.5 mt-0.5">
              <HardDrive className="h-3 w-3 text-amber-400/70" />
              Configured Level: <span className="font-semibold text-amber-300">{raidLevel || controller?.level || "RAID"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
            isHealthy
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30"
              : "bg-amber-500/10 text-amber-300 border-amber-400/30"
          }`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {raidStatus || controller?.status || "Active"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center gap-2">
          <BatteryCharging className="h-4 w-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-white/40 font-medium">BBU Status</div>
            <div className="font-bold text-white/90 text-xs">{bbu}</div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center gap-2">
          <CpuIcon className="h-4 w-4 text-blue-400" />
          <div>
            <div className="text-[10px] text-white/40 font-medium">Controller Cache</div>
            <div className="font-bold text-white/90 text-xs">{cache}</div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center gap-2 col-span-2 sm:col-span-1">
          <Info className="h-4 w-4 text-purple-400" />
          <div>
            <div className="text-[10px] text-white/40 font-medium">Management Tool</div>
            <div className="font-bold text-white/90 text-xs truncate">{controller?.tool || "Native Driver"}</div>
          </div>
        </div>
      </div>

      {notice && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold">Hardware Alert:</span> {notice}
          </div>
        </div>
      )}
    </div>
  );
}
