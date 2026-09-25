import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import {
  History,
  TrendingUp,
  FileText,
  Laptop,
  Award,
  DollarSign,
  UserCheck,
  UserMinus,
  Calendar,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface HistoryTabProps {
  employeeId: string;
}

export function HistoryTab({ employeeId }: HistoryTabProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ items: any[] }>(`/api/employees/${employeeId}/history`);
      setEvents(res.items || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [employeeId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "created":
        return <UserCheck className="h-3.5 w-3.5 text-emerald-400" />;
      case "title_changed":
      case "department_changed":
      case "location_changed":
        return <TrendingUp className="h-3.5 w-3.5 text-blue-400" />;
      case "document_uploaded":
      case "document_replaced":
        return <FileText className="h-3.5 w-3.5 text-violet-400" />;
      case "asset_assigned":
      case "asset_returned":
        return <Laptop className="h-3.5 w-3.5 text-cyan-400" />;
      case "training_completed":
      case "certification_added":
        return <Award className="h-3.5 w-3.5 text-amber-400" />;
      case "compensation_updated":
        return <DollarSign className="h-3.5 w-3.5 text-emerald-400" />;
      case "separation":
        return <UserMinus className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-violet-400" />
            Organizational Business Timeline & History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              <span>Loading organizational timeline...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              No recorded business events yet. Changes to personal info, promotions, documents, and assets will appear here.
            </div>
          ) : (
            <div className="relative pl-6 border-l border-slate-800 space-y-6">
              {events.map((event, index) => (
                <div key={event.id || index} className="relative group">
                  {/* Timeline node */}
                  <div className="absolute -left-[31px] top-0.5 h-6 w-6 rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-violet-500 transition-colors flex items-center justify-center">
                    {getEventIcon(event.eventType)}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-white">{event.title}</div>
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-[11px]">
                        {new Date(event.eventDate).toLocaleDateString()} at{" "}
                        {new Date(event.eventDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Badge>
                    </div>

                    {event.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                      <span>Action by: {event.actorName || "System"}</span>
                      {event.actorRole && <span>({event.actorRole})</span>}
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
