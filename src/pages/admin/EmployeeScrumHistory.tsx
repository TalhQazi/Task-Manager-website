import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Calendar, Clock, ChevronLeft, Building, Phone, Mail, User } from "lucide-react";
import { getAdminEmployeeScrumRecords } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface ScrumRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  scrum: string;
  createdAt: string;
}

export default function EmployeeScrumHistory() {
  const { employeeName } = useParams<{ employeeName: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<ScrumRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState<{
    name: string;
    email: string;
    company: string;
    phone: string;
    totalRecords: number;
  } | null>(null);

  useEffect(() => {
    if (employeeName) {
      loadEmployeeScrumRecords();
    }
  }, [employeeName]);

  const loadEmployeeScrumRecords = async () => {
    setLoading(true);
    try {
      const decodedName = decodeURIComponent(employeeName || "");
      const res = await getAdminEmployeeScrumRecords(decodedName);
      setRecords(res.items || []);
      
      // Set employee info from first record or use name from URL
      if (res.items && res.items.length > 0) {
        setEmployeeInfo({
          name: decodedName,
          email: "",
          company: "",
          phone: "",
          totalRecords: res.total || res.items.length,
        });
      } else {
        setEmployeeInfo({
          name: decodedName,
          email: "",
          company: "",
          phone: "",
          totalRecords: 0,
        });
      }
    } catch (err) {
      console.error("Failed to load employee scrum records:", err);
      toast.error("Failed to load employee scrum records");
    } finally {
      setLoading(false);
    }
  };

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

  // Group records by date
  const groupedRecords = records.reduce((acc, record) => {
    const dateKey = new Date(record.date).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(record);
    return acc;
  }, {} as Record<string, ScrumRecord[]>);

  const sortedDates = Object.keys(groupedRecords).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/scrum-records")}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to All Records
        </Button>
      </div>

      {/* Employee Info Card */}
      <Card className="bg-gradient-to-r from-[#133767] to-[#1a4a8c] text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-white/20 border-2 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {getInitials(employeeInfo?.name || employeeName || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{employeeInfo?.name || employeeName}</h1>
              <div className="flex items-center gap-6 mt-2 text-sm text-white/80">
                {employeeInfo?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {employeeInfo.email}
                  </span>
                )}
                {employeeInfo?.company && (
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {employeeInfo.company}
                  </span>
                )}
                {employeeInfo?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {employeeInfo.phone}
                  </span>
                )}
                <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                  {employeeInfo?.totalRecords || records.length} records
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date-wise Scrum Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Date-wise Scrum History
          </CardTitle>
          <CardDescription>
            Chronological view of all scrum entries for this employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
              <p className="text-muted-foreground">Loading scrum records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No scrum records found</p>
              <p className="text-sm mt-1">
                This employee has not submitted any scrum entries yet
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const dateRecords = groupedRecords[dateKey];
                const dateObj = new Date(dateKey);
                
                return (
                  <div key={dateKey} className="border rounded-lg overflow-hidden">
                    {/* Date Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#133767]" />
                      <span className="font-semibold text-gray-800">
                        {dateObj.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <Badge variant="outline" className="ml-auto">
                        {dateRecords.length} entries
                      </Badge>
                    </div>
                    
                    {/* Records Table for this Date */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Clock In</TableHead>
                          <TableHead>Clock Out</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead className="w-3/5">Scrum Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dateRecords.map((record, idx) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-green-500" />
                                <span className="font-medium">
                                  {record.clockIn || "--:--"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  {record.clockOut || "--:--"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-[#133767]">
                                {record.totalHours?.toFixed(2) || "--"}h
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {record.scrum}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
