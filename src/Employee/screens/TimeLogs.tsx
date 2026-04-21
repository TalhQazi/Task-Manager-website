import { useEffect, useState } from "react";
import { getEmployeeTimeLogs } from "../lib/api";

export default function TimeLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    getEmployeeTimeLogs().then(res => setLogs(res.items || []));
  }, []);

  const totalHours = logs.reduce((sum, l) => sum + (l.total_hours || 0), 0);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Time Logs</h2>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Date</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.clock_in?.split("T")[0]}</td>
              <td>{log.clock_in}</td>
              <td>{log.clock_out}</td>
              <td>{log.total_hours}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
  <div className="text-center py-6 text-gray-500">
    No time logs found
  </div>
)}

      <div className="mt-4 font-semibold">
        Weekly Total: {totalHours} hrs
      </div>
    </div>
  );
}