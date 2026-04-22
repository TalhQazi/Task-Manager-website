import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Search, Calendar, Building, Phone, Mail } from "lucide-react";
import { getAdminEODStatus } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface EmployeeEODData {
  employeeId: string;
  employeeName: string;
  status: "submitted" | "missing" | "late" | "not_clocked_in";
  clockIn?: string;
  clockOut?: string;
  reportSubmittedAt?: string;
}

export default function AdminEODReports() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeEODData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadEODStatus();
  }, [dateFilter]);

  const loadEODStatus = async () => {
    setLoading(true);
    try {
      const res = await getAdminEODStatus(dateFilter || today);
      setEmployees(res.items || []);
    } catch (err) {
      console.error("Failed to load EOD status:", err);
      toast.error("Failed to load EOD status");
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployee = (employee: EmployeeEODData) => {
    navigate(`/admin/eod-reports/${encodeURIComponent(employee.employeeName)}`);
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
            Submitted
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
            Missing
          </Badge>
        );
      case "late":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
            Late
          </Badge>
        );
      case "not_clocked_in":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">
            Not Clocked In
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">EOD Reports</h1>
          <p className="text-sm text-muted-foreground">
            View all employee end-of-day reports and work logs
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {employees.length} employees
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-48">
              <Input
                type="date"
                value={dateFilter || today}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDateFilter(today);
                setSearchTerm("");
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Employee EOD Status
          </CardTitle>
          <CardDescription>
            Click on an employee to view their detailed EOD history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
              <p className="text-muted-foreground">Loading EOD status...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No employees found</p>
              <p className="text-sm mt-1">
                Employees will appear here once they clock in
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Report Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.employeeId} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-[#133767]">
                            <AvatarFallback className="bg-[#133767] text-white text-sm">
                              {getInitials(emp.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{emp.employeeName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(emp.status)}</TableCell>
                      <TableCell>{emp.clockIn || "—"}</TableCell>
                      <TableCell>{emp.clockOut || "—"}</TableCell>
                      <TableCell>
                        {emp.reportSubmittedAt
                          ? new Date(emp.reportSubmittedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {emp.status !== "not_clocked_in" && (
                          <Button
                            size="sm"
                            onClick={() => handleViewEmployee(emp)}
                            className="bg-[#133767] hover:bg-[#0d2654]"
                          >
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
