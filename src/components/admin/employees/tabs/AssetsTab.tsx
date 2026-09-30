import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Laptop,
  Smartphone,
  Car,
  Key,
  CreditCard,
  Shield,
  Plus,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Loader2,
  Package,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AssetsTabProps {
  employeeId: string;
  employeeName: string;
  onOpenAssignModal: () => void;
}

export function AssetsTab({
  employeeId,
  employeeName,
  onOpenAssignModal,
}: AssetsTabProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnSubmitting, setReturnSubmitting] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ items: any[] }>(`/api/employees/${employeeId}/assets`);
      setAssets(res.items || []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [employeeId]);

  const handleReturnAsset = async (assetId: string, assetName: string) => {
    const condition = window.prompt(`Return condition for ${assetName} (good, fair, damaged):`, "good");
    if (!condition) return;

    try {
      setReturnSubmitting(assetId);
      await apiFetch(`/api/employees/${employeeId}/assets/${assetId}/return`, {
        method: "PUT",
        body: JSON.stringify({ conditionOnReturn: condition }),
      });
      fetchAssets();
    } catch (err: any) {
      alert(err?.message || "Failed to return asset");
    } finally {
      setReturnSubmitting(null);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "laptop":
        return <Laptop className="h-5 w-5 text-emerald-400" />;
      case "phone":
      case "tablet":
        return <Smartphone className="h-5 w-5 text-blue-400" />;
      case "vehicle":
        return <Car className="h-5 w-5 text-amber-400" />;
      case "key":
      case "badge":
        return <Key className="h-5 w-5 text-violet-400" />;
      case "software_access":
        return <Shield className="h-5 w-5 text-cyan-400" />;
      case "credit_card":
        return <CreditCard className="h-5 w-5 text-rose-400" />;
      default:
        return <Package className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <Laptop className="h-4 w-4 text-emerald-400" />
            Assigned Equipment & System Access
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Track hardware, vehicles, security badges, and software licenses issued to {employeeName}
          </p>
        </div>

        <Button
          size="sm"
          onClick={onOpenAssignModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 h-8 text-xs font-medium shadow-lg shadow-emerald-600/20"
        >
          <Plus className="h-3.5 w-3.5" /> Assign Asset
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
          <span>Loading assigned equipment...</span>
        </div>
      ) : assets.length === 0 ? (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <Laptop className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">No assets currently assigned</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No laptops, keys, badges, or software licenses assigned to {employeeName}.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAssignModal}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 mt-2"
            >
              <Plus className="h-3.5 w-3.5" /> Assign First Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.map((asset) => (
            <Card
              key={asset.id}
              className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getAssetIcon(asset.assetType)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{asset.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="border-slate-800 text-slate-400 text-[10px] uppercase">
                          {asset.assetType.replace(/_/g, " ")}
                        </Badge>
                        {asset.identifier && (
                          <span className="text-xs font-mono text-slate-400">
                            #{asset.identifier}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge
                    className={
                      asset.status === "assigned"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px]"
                        : "bg-slate-800 text-slate-400 text-[11px]"
                    }
                  >
                    {asset.status === "assigned" ? "Active / Issued" : "Returned"}
                  </Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    Issued: {new Date(asset.assignedDate).toLocaleDateString()}
                  </div>
                  {asset.returnDate ? (
                    <div className="flex items-center gap-1 text-slate-400">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      Returned: {new Date(asset.returnDate).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={returnSubmitting === asset.id}
                        onClick={() => handleReturnAsset(asset.id, asset.name)}
                        className="h-6 px-2 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> Check-in Return
                      </Button>
                    </div>
                  )}
                </div>

                {asset.notes && (
                  <p className="text-[11px] text-slate-400 italic">
                    Note: {asset.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
