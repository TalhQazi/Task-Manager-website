import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import { ListTodo, AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { analytics, STATUS_COLUMNS } from "@/lib/taskViews";
import { ViewLoading } from "./shared";

function Tile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <span className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tone}1a`, color: tone }}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

/* Read-only KPIs via server-side aggregation (never ships 100k rows). */
export default function ExecutiveDashboard() {
  const summaryQ = useQuery({ queryKey: ["task-analytics", "summary"], queryFn: () => analytics.summary() });
  const workloadQ = useQuery({ queryKey: ["task-analytics", "workload"], queryFn: () => analytics.workload() });

  if (summaryQ.isLoading) return <ViewLoading />;
  const s = summaryQ.data;
  if (!s) return <ViewLoading />;

  const statusData = STATUS_COLUMNS.map((c) => ({ name: c.label, value: s.byStatus[c.key] || 0, color: c.color }));
  const topWorkload = (workloadQ.data?.items || []).slice(0, 8);

  return (
    <div className="h-full overflow-y-auto space-y-4 pb-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Tile icon={ListTodo} label="Total tasks" value={s.total} tone="#3b82f6" />
        <Tile icon={AlertTriangle} label="Overdue" value={s.overdue} tone="#ef4444" />
        <Tile icon={CheckCircle2} label="Done this week" value={s.completedThisWeek} tone="#22c55e" />
        <Tile icon={Clock} label="On-time" value={`${s.onTimePct}%`} tone="#f59e0b" />
        <Tile icon={TrendingUp} label="Completion" value={`${s.completionPct}%`} tone="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold mb-3">Throughput (last 7 days)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={s.throughput}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={24} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold mb-3">Status breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={24} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {topWorkload.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold mb-3">Top workload</h4>
          <div className="space-y-2">
            {topWorkload.map((r) => {
              const util = r.utilizationPct;
              const pct = util != null ? Math.min(util, 100) : Math.min(r.active * 10, 100);
              const color = util == null ? "#3b82f6" : util > 100 ? "#ef4444" : util > 80 ? "#f59e0b" : "#22c55e";
              return (
                <div key={r.assignee} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate">{r.assignee}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="w-24 text-right text-xs text-muted-foreground">{r.active} active{util != null ? ` · ${util}%` : ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
