import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, ArrowUpRight, Loader2 } from "lucide-react";
import { getEmployeeTimeLogs, employeeApiFetch } from "../lib/api";
import { EmployeeStatCard } from "../components/StatCard";

export default function TimeLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 });

  useEffect(() => {
    Promise.all([
      getEmployeeTimeLogs(),
      employeeApiFetch("/api/employees/me/time-logs/summary")
    ]).then(([logsRes, summaryRes]) => {
      setLogs(logsRes.items || []);
      setSummary(summaryRes.item || { today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 });
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#133767]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#133767]">Time Logs</h1>
        <p className="text-muted-foreground">View your work hours and time records</p>
      </div>

      {/* Stats Cards - Admin Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EmployeeStatCard
          title="TODAY"
          value={`${summary.today.toFixed(1)} hrs`}
          icon={Clock}
          variant="blue"
        />
        <EmployeeStatCard
          title="THIS WEEK"
          value={`${summary.thisWeek.toFixed(1)} hrs`}
          icon={ArrowUpRight}
          variant="green"
        />
        <EmployeeStatCard
          title="THIS MONTH"
          value={`${summary.thisMonth.toFixed(1)} hrs`}
          icon={Calendar}
          variant="purple"
        />
        <EmployeeStatCard
          title="ALL TIME"
          value={`${summary.allTime.toFixed(1)} hrs`}
          icon={Clock}
          variant="orange"
        />
      </div>

      {/* Time Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Time Records</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time logs found</p>
              <p className="text-sm">Start tracking your time by clocking in</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Clock In</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Clock Out</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id || index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(log.clock_in)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-500" />
                          {formatTime(log.clock_in)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {log.clock_out ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-red-500" />
                            {formatTime(log.clock_out)}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            In Progress
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{log.total_hours?.toFixed(2) || "0.00"} hrs</span>
                      </td>
                      <td className="py-3 px-4">
                        {log.clock_out ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Active</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}