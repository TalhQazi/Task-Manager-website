import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, Users, DollarSign, Filter, Plus, Edit, Trash2, Eye } from "lucide-react";
import { travelCalendarApi, TravelCalendar, TravelCalendarFilters } from "@/lib/travelCalendarApi";
import { Button } from "@/components/manger/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import { Input } from "@/components/manger/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/manger/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/manger/ui/dialog";
import { toast } from "sonner";

const ManagerTravelCalendar = () => {
  const [travelCalendars, setTravelCalendars] = useState<TravelCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TravelCalendarFilters>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<TravelCalendar | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Load travel calendars
  const loadTravelCalendars = async () => {
    try {
      setLoading(true);
      const response = await travelCalendarApi.getTravelCalendars(filters);
      if (response.success) {
        setTravelCalendars(response.data.items);
      }
    } catch (error) {
      console.error("Failed to load travel calendars:", error);
      toast.error("Failed to load travel calendars");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTravelCalendars();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this travel calendar?")) return;
    
    try {
      const response = await travelCalendarApi.deleteTravelCalendar(id);
      if (response.success) {
        toast.success("Travel calendar deleted successfully");
        loadTravelCalendars();
      } else {
        toast.error(response.error?.message || "Failed to delete travel calendar");
      }
    } catch (error) {
      console.error("Failed to delete travel calendar:", error);
      toast.error("Failed to delete travel calendar");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-purple-100 text-purple-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case "business": return "bg-blue-50 text-blue-700";
      case "conference": return "bg-purple-50 text-purple-700";
      case "meeting": return "bg-green-50 text-green-700";
      case "training": return "bg-orange-50 text-orange-700";
      case "personal": return "bg-pink-50 text-pink-700";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Travel Calendar</h1>
          <p className="text-gray-600 mt-1">Manage travel schedules for your team</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Travel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Travel Calendar Entry</DialogTitle>
            </DialogHeader>
            <div className="p-4 text-center text-gray-500">
              Travel calendar creation form will be implemented here
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select value={filters.status || ""} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Purpose</label>
              <Select value={filters.purpose || ""} onValueChange={(value) => setFilters({ ...filters, purpose: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Purpose</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Travel Calendar List */}
      <div className="grid gap-4">
        {travelCalendars.map((calendar) => (
          <Card key={calendar._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{calendar.title}</h3>
                    <Badge className={getStatusColor(calendar.status)}>
                      {calendar.status}
                    </Badge>
                    <Badge className={getPurposeColor(calendar.purpose)}>
                      {calendar.purpose}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(calendar.startDate), "MMM dd, yyyy")} - {format(new Date(calendar.endDate), "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {calendar.destination}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {calendar.employee.name}
                    </div>
                  </div>

                  {calendar.description && (
                    <p className="text-gray-600 mt-2">{calendar.description}</p>
                  )}

                  {calendar.budget.estimated > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <DollarSign className="h-4 w-4" />
                      <span>Budget: {calendar.budget.currency} {calendar.budget.estimated}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCalendar(calendar);
                      setShowViewDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCalendar(calendar);
                      // Edit functionality will be implemented
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(calendar._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {travelCalendars.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No travel calendars found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first travel calendar entry</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Travel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Travel Calendar Details</DialogTitle>
          </DialogHeader>
          {selectedCalendar && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedCalendar.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(selectedCalendar.status)}>
                    {selectedCalendar.status}
                  </Badge>
                  <Badge className={getPurposeColor(selectedCalendar.purpose)}>
                    {selectedCalendar.purpose}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <p>{format(new Date(selectedCalendar.startDate), "MMMM dd, yyyy")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <p>{format(new Date(selectedCalendar.endDate), "MMMM dd, yyyy")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <p>{selectedCalendar.destination}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <p>{selectedCalendar.employee.name}</p>
                </div>
              </div>

              {selectedCalendar.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p>{selectedCalendar.description}</p>
                </div>
              )}

              {selectedCalendar.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p>{selectedCalendar.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerTravelCalendar;
