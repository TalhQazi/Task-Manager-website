import { Server, Cpu, HardDrive, Activity } from "lucide-react";

export function ServerCards() {
  return (
    <div className="bg-[#121A2F] border border-white/10 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-400" />
          Server Resources
        </h2>
        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full border border-blue-500/20">
          Phase 3 Preview
        </span>
      </div>

      <div className="space-y-6 opacity-60 pointer-events-none">
        {/* Mock Server 1 */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              <span className="text-white font-medium">Main Application Server</span>
            </div>
            <span className="text-white/40 text-sm">Ubuntu 22.04</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 flex items-center gap-1"><Cpu className="h-3 w-3" /> CPU</span>
                <span className="text-emerald-400">24%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[24%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 flex items-center gap-1"><Activity className="h-3 w-3" /> RAM</span>
                <span className="text-amber-400">68%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 w-[68%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 flex items-center gap-1"><HardDrive className="h-3 w-3" /> Disk</span>
                <span className="text-emerald-400">42%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[42%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Mock Server 2 */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              <span className="text-white font-medium">Database Cluster</span>
            </div>
            <span className="text-white/40 text-sm">MongoDB Atlas</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 flex items-center gap-1"><Cpu className="h-3 w-3" /> CPU</span>
                <span className="text-emerald-400">12%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[12%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 flex items-center gap-1"><Activity className="h-3 w-3" /> RAM</span>
                <span className="text-emerald-400">45%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[45%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 flex items-center gap-1"><HardDrive className="h-3 w-3" /> Disk</span>
                <span className="text-amber-400">81%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 w-[81%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
