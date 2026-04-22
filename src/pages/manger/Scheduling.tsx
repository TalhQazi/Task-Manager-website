import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  MapPin,
  User,
  Clock,
} from "lucide-react";
import { apiFetch } from "@/lib/manger/api";

interface ScheduleItem {
  id: string;
  title: string;
  assignee: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "task" | "meeting" | "break" | "training";
  status: "scheduled" | "completed" | "canceled";
}

interface Employee {
  id: string;
  name: string;
  status: string;
}

type ScheduleItemApi = Omit<ScheduleItem, "id"> & {
  _id: string;
};

function normalizeScheduleItem(s: ScheduleItemApi): ScheduleItem {
  return {
    id: s._id,
    title: s.title,
    assignee: s.assignee,
    location: s.location,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    type: s.type,
    status: s.status || "scheduled",
  };
}

export default function Scheduling() {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    assignee: "",
    location: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "task" as ScheduleItem["type"],
    status: "scheduled" as ScheduleItem["status"],
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    assignee: "",
    location: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "task" as ScheduleItem["type"],
    status: "scheduled" as ScheduleItem["status"],
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);

        // Fetch schedules
        const res = await apiFetch<{ items: ScheduleItemApi[] }>("/api/events");
        if (!mounted) return;
        setSchedules(res.items.map(normalizeScheduleItem));

        // Fetch employees
        const empRes = await apiFetch<{ items: Employee[] }>("/api/employees");
        if (!mounted) return;
        setEmployees((empRes.items ?? []).filter((e) => e.status === "active"));
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load schedules");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshSchedules = async () => {
    const res = await apiFetch<{ items: ScheduleItemApi[] }>("/api/events");
    setSchedules(res.items.map(normalizeScheduleItem));
  };

  const displayIdByScheduleId = useMemo(() => {
    return new Map(
      schedules.map((s, idx) => {
        const displayId = `SC${String(idx + 1).padStart(3, "0")}`;
        return [s.id, displayId] as const;
      }),
    );
  }, [schedules]);

  const getDisplayScheduleId = (scheduleId: string) => {
    return displayIdByScheduleId.get(scheduleId) || scheduleId;
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter((s) => {
      return (
        s.location.toLowerCase().includes(q) ||
        s.assignee.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
      );
    });
  }, [schedules, searchQuery]);

  const addSchedule = async () => {
    if (!formData.title || !formData.assignee || !formData.date) return;
    const next: ScheduleItem = {
      id: `SCH-${Date.now().toString().slice(-6)}`,
      title: formData.title,
      assignee: formData.assignee,
      location: formData.location,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      type: formData.type,
      status: formData.status,
    };
    try {
      setApiError(null);
      await apiFetch("/api/events", {
        method: "POST",
        body: JSON.stringify(next),
      });
      await refreshSchedules();
      setAddOpen(false);
      setFormData({
        title: "",
        assignee: "",
        location: "",
        date: "",
        startTime: "",
        endTime: "",
        type: "task",
        status: "scheduled",
      });
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to add schedule");
    }
  };

  const onEdit = (s: ScheduleItem) => {
    setSelected(s);
    setEditFormData({
      title: s.title,
      assignee: s.assignee,
      location: s.location,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      type: s.type,
      status: s.status,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    try {
      setApiError(null);
      await apiFetch(`/api/events/${selected.id}`, {
        method: "PUT",
        body: JSON.stringify(editFormData),
      });
      await refreshSchedules();
      setEditOpen(false);
      setSelected(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update schedule");
    }
  };

  const onDelete = async (s: ScheduleItem) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      setApiError(null);
      await apiFetch(`/api/events/${s.id}`, {
        method: "DELETE",
      });
      await refreshSchedules();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to delete schedule");
    }
  };

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 space-y-6 max-w-[2000px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Scheduling
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan and manage team schedules
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-1.5 sm:space-y-2">
              <DialogTitle className="text-lg sm:text-xl">Add Schedule</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Create a new shift schedule
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-5">
              {/* Title & Employee */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                    placeholder="Event title"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Employee *</label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  {employees.length === 0 && (
                    <p className="text-xs text-warning mt-1">No employees found.</p>
                  )}
                </div>
              </div>

              {/* Location & Date */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    placeholder="e.g., Main Office"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Type & Status */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleItem["type"] })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                  >
                    <option value="task">Task</option>
                    <option value="meeting">Meeting</option>
                    <option value="break">Break</option>
                    <option value="training">Training</option>
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ScheduleItem["status"] })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={addSchedule}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                Add Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Error Message */}
      {apiError && (
        <div className="rounded-md bg-destructive/10 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-destructive break-words">
            {apiError}
          </p>
        </div>
      )}

      {/* Search Card */}
      <Card className="shadow-soft border-0 sm:border">
        <CardContent className="p-3 sm:p-6">
          <div className="relative w-full sm:max-w-md">
            <label className="block text-xs text-muted-foreground mb-1.5 sm:hidden">
              Search Schedules
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search by location, employee, or type..."
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules Card */}
      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
            Schedules ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Loading schedules...
              </div>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block sm:hidden space-y-3 p-4">
                {filtered.map((s) => (
                  <div key={s.id} className="bg-white rounded-lg border p-4 space-y-3">
                    {/* Header with ID and Actions */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                          <CalendarIcon className="h-4 w-4 text-info" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{getDisplayScheduleId(s.id)}</p>
                          <p className="text-xs text-muted-foreground">{s.title}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(s)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(s)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Employee */}
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">Employee</p>
                        <p className="text-sm">{s.assignee}</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">Location</p>
                        <p className="text-sm">{s.location}</p>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">Date & Time</p>
                        <p className="text-sm">{s.date} · {s.startTime || "—"} - {s.endTime || "—"}</p>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="flex justify-start">
                      <Badge className="text-xs" variant="secondary">
                        {s.type || "—"}
                      </Badge>
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">No schedules found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try adjusting your search or add a new schedule
                    </p>
                  </div>
                )}
              </div>

              {/* Tablet/Desktop View - Table */}
              <div className="hidden sm:block w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm w-[12%]">Schedule ID</TableHead>
                      <TableHead className="text-xs md:text-sm w-[20%]">Title</TableHead>
                      <TableHead className="text-xs md:text-sm w-[20%]">Employee</TableHead>
                      <TableHead className="text-xs md:text-sm w-[18%]">Location</TableHead>
                      <TableHead className="text-xs md:text-sm w-[12%]">Date</TableHead>
                      <TableHead className="text-xs md:text-sm w-[8%]">Time</TableHead>
                      <TableHead className="text-right text-xs md:text-sm w-[10%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell>
                          <span className="text-sm md:text-base font-mono text-muted-foreground">
                            {getDisplayScheduleId(s.id)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm md:text-base truncate max-w-[200px] lg:max-w-[250px]">
                            {s.title}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm md:text-base">
                          {s.assignee}
                        </TableCell>
                        <TableCell className="text-sm md:text-base">
                          {s.location}
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-muted-foreground">
                          {s.date}
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-muted-foreground">
                          {s.startTime || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(s)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(s)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Edit Schedule</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update schedule information and save changes
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 sm:space-y-5">
              {/* Title & Employee */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Employee *</label>
                  <select
                    value={editFormData.assignee}
                    onChange={(e) => setEditFormData({ ...editFormData, assignee: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Date */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Location *</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Type & Status */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Type</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as ScheduleItem["type"] })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                  >
                    <option value="task">Task</option>
                    <option value="meeting">Meeting</option>
                    <option value="break">Break</option>
                    <option value="training">Training</option>
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as ScheduleItem["status"] })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
