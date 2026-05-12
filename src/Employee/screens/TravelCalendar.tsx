import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, DollarSign, Eye } from "lucide-react";
import { travelCalendarApi, TravelCalendar, TravelCalendarFilters } from "@/lib/travelCalendarApi";
import { Button } from "@/components/manger/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import { Input } from "@/components/manger/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/manger/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/manger/ui/dialog";
import { toast } from "sonner";

const EmployeeTravelCalendar = () => {
  const [travelCalendars, setTravelCalendars] = useState<TravelCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TravelCalendarFilters>({});
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Travel Calendar</h1>
        <p className="text-gray-600 mt-1">View your travel schedules</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Select value={filters.status || ""} onValueChange={(value) => setFilters({ ...filters, status: value || undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(calendar.startDate), "MMM dd, yyyy")} - {format(new Date(calendar.endDate), "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {calendar.destination}
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
              <p className="text-gray-600 mb-4">No travel schedules are currently available</p>
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
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="capitalize">{selectedCalendar.status}</p>
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

              {selectedCalendar.budget.estimated > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget</label>
                  <p>{selectedCalendar.budget.currency} {selectedCalendar.budget.estimated}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeTravelCalendar;
