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
import { getAdminScrumRecords } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface EmployeeScrumData {
  employeeName: string;
  employeeId: string | null;
  email: string;
  company: string;
  phone: string;
  status: string;
  totalScrumRecords: number;
  latestRecord: string;
  records: ScrumRecord[];
}

interface ScrumRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  scrum: string;
  createdAt: string;
}

export default function AdminScrumRecords() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeScrumData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadScrumRecords();
  }, []);

  const loadScrumRecords = async () => {
    setLoading(true);
    try {
      const res = await getAdminScrumRecords();
      setEmployees(res.items || []);
    } catch (err) {
      console.error("Failed to load scrum records:", err);
      toast.error("Failed to load scrum records");
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployee = (employee: EmployeeScrumData) => {
    navigate(`/admin/scrum-records/${encodeURIComponent(employee.employeeName)}`);
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.phone.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scrum Records</h1>
          <p className="text-sm text-muted-foreground">
            View all employee scrum entries and daily work logs
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {employees.length} employees
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search employees by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Employee Scrum Records
          </CardTitle>
          <CardDescription>
            Click on an employee to view their detailed scrum history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
              <p className="text-muted-foreground">Loading scrum records...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No scrum records found</p>
              <p className="text-sm mt-1">
                Employees will appear here once they submit their scrum entries
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Total Records</TableHead>
                    <TableHead>Latest Record</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.employeeName} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-[#133767]">
                            <AvatarFallback className="bg-[#133767] text-white text-sm">
                              {getInitials(emp.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{emp.employeeName}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {emp.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4 text-gray-400" />
                          {emp.company || "--"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {emp.phone || "--"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {emp.totalScrumRecords}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {emp.latestRecord ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-blue-500" />
                            {formatDate(emp.latestRecord)}
                          </div>
                        ) : (
                          "--"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            emp.status === "active"
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-gray-500 text-gray-700 bg-gray-50"
                          }
                        >
                          {emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleViewEmployee(emp)}
                          className="bg-[#133767] hover:bg-[#0d2654]"
                        >
                          View Details
                        </Button>
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
