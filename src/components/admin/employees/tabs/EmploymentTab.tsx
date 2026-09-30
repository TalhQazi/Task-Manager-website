import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Briefcase,
  Building2,
  MapPin,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  Plus,
  Clock,
  History,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface EmploymentTabProps {
  employeeId: string;
  employee: any;
  onOpenUpdateModal: () => void;
}

export function EmploymentTab({
  employeeId,
  employee,
  onOpenUpdateModal,
}: EmploymentTabProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // Fetch timeline and career records
      const res = await apiFetch<{ items: any[] }>(`/api/employees/${employeeId}/history`);
      const careerEvents = (res.items || []).filter((e) =>
        [
          "created",
          "title_changed",
          "department_changed",
          "location_changed",
          "compensation_updated",
          "separation",
          "rehire",
        ].includes(e.eventType)
      );
      setHistory(careerEvents);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [employeeId]);

  return (
    <div className="space-y-6">
      {/* Current Employment Card */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" />
              Current Position & Employment Terms
            </CardTitle>
          </div>
          <Button
            size="sm"
            onClick={onOpenUpdateModal}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 h-8 text-xs font-medium"
          >
            <TrendingUp className="h-3.5 w-3.5" /> Record Career / Wage Update
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400">Department</div>
              <div className="text-sm font-semibold text-white">
                {employee.department || "General"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400">Job Title</div>
              <div className="text-sm font-semibold text-blue-400">
                {employee.role || "Team Member"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400">Work Location</div>
              <div className="text-sm font-semibold text-white">
                {employee.location || employee.company || "Primary Facility"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400">Employment Status</div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Badge
                  className={
                    employee.status === "active"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  }
                >
                  {employee.status?.toUpperCase() || "ACTIVE"}
                </Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400">Hire Date</div>
              <div className="text-sm font-semibold text-white">
                {employee.hireDate || (employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : "—")}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400">Shift Schedule</div>
              <div className="text-sm font-semibold text-white">
                {employee.shift || "Regular 8hr Shift"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400">Pay Type</div>
              <div className="text-sm font-semibold text-white capitalize">
                {employee.payType || "Hourly"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400">Direct Supervisor</div>
              <div className="text-sm font-semibold text-white">
                {employee.supervisor?.name || "Management"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Effective-Dated Career History Ledger */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-violet-400" />
            Effective-Dated Career Progression Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {history.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              No historical career changes recorded yet. Future promotions, transfers, and title updates will be logged here.
            </div>
          ) : (
            <div className="relative pl-6 border-l border-slate-800 space-y-6">
              {history.map((event, index) => (
                <div key={event.id || index} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-[31px] top-0.5 h-6 w-6 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center text-[10px] text-blue-400">
                    <TrendingUp className="h-3 w-3" />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-white">{event.title}</div>
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-[11px]">
                        {new Date(event.eventDate).toLocaleDateString()}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                      <span>Recorded by: {event.actorName || "Admin"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
