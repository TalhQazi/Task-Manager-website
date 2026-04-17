import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Calendar, Clock, Search } from "lucide-react";
import { getEmployeeScrumRecords } from "../lib/api";
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

export default function ScrumRecords() {
  const [records, setRecords] = useState<ScrumRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const res = await getEmployeeScrumRecords();
        // Sort by date descending (newest first)
        const sorted = (res.items || []).sort((a: ScrumRecord, b: ScrumRecord) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setRecords(sorted);
      } catch (err) {
        console.error("Failed to load scrum records:", err);
        toast.error("Failed to load scrum records");
      } finally {
        setLoading(false);
      }
    };
    loadRecords();
  }, []);

  const filteredRecords = records.filter((record) =>
    record.scrum.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(record.date).toLocaleDateString().includes(searchTerm)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Scrum Records</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300 animate-pulse" />
            <p className="text-muted-foreground">Loading scrum records...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scrum Records</h1>
          <p className="text-sm text-muted-foreground">
            Your daily scrum entries and work logs
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {records.length} records
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search scrum records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scrum Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Daily Scrum Entries
          </CardTitle>
          <CardDescription>
            Date-wise record of your daily scrum submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No scrum records yet</p>
              <p className="text-sm mt-1">
                Your scrum entries will appear here after you clock out with scrum details
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead className="w-1/2">Scrum Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(record.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-green-500" />
                          {record.clockIn || "--:--"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          {record.clockOut || "--:--"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {record.totalHours?.toFixed(2) || "--"}h
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {record.scrum}
                        </p>
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
