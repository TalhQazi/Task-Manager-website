import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Award,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface TrainingTabProps {
  employeeId: string;
  employeeName: string;
  onOpenAddModal: () => void;
}

export function TrainingTab({
  employeeId,
  employeeName,
  onOpenAddModal,
}: TrainingTabProps) {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ items: any[] }>(`/api/employees/${employeeId}/training`);
      setTrainings(res.items || []);
    } catch {
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, [employeeId]);

  const handleDelete = async (trainingId: string, name: string) => {
    if (!window.confirm(`Delete credential record "${name}"?`)) return;
    try {
      await apiFetch(`/api/employees/${employeeId}/training/${trainingId}`, {
        method: "DELETE",
      });
      fetchTrainings();
    } catch (err: any) {
      alert(err?.message || "Failed to remove training record");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            Training, Licenses & Professional Certifications
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage required credentials, OSHA safety, and trade certifications for {employeeName}
          </p>
        </div>

        <Button
          size="sm"
          onClick={onOpenAddModal}
          className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5 h-8 text-xs font-medium shadow-lg shadow-amber-600/20"
        >
          <Plus className="h-3.5 w-3.5" /> Add Credential
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span>Loading certifications & training...</span>
        </div>
      ) : trainings.length === 0 ? (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">No certifications recorded</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No active licenses or training records on file for {employeeName}.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAddModal}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 mt-2"
            >
              <Plus className="h-3.5 w-3.5" /> Add First Certification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainings.map((item) => {
            const isExpiringSoon =
              item.expirationDate &&
              new Date(item.expirationDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 &&
              new Date(item.expirationDate).getTime() > Date.now();
            const isExpired = item.expirationDate && new Date(item.expirationDate).getTime() <= Date.now();

            return (
              <Card
                key={item.id}
                className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="border-slate-800 text-slate-400 text-[10px] uppercase">
                            {item.type}
                          </Badge>
                          {item.issuingAuthority && (
                            <span className="text-xs text-slate-400">
                              Issued by {item.issuingAuthority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id, item.name)}
                      className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      Issued: {item.issueDate ? new Date(item.issueDate).toLocaleDateString() : "—"}
                    </div>

                    {item.doesNotExpire ? (
                      <div className="flex items-center gap-1 text-emerald-400 font-medium">
                        <ShieldCheck className="h-3 w-3" /> Lifetime Credential
                      </div>
                    ) : item.expirationDate ? (
                      <div
                        className={`flex items-center gap-1 font-medium ${
                          isExpired
                            ? "text-rose-400"
                            : isExpiringSoon
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {isExpired ? "Expired " : "Expires "}
                        {new Date(item.expirationDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="text-slate-500">No expiration date</div>
                    )}
                  </div>

                  {item.credentialId && (
                    <div className="text-[11px] font-mono text-slate-500">
                      Credential ID: {item.credentialId}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
