import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, DollarSign, Filter, Plus, Edit, Trash2, Eye } from "lucide-react";
import { travelCalendarApi, TravelCalendar, TravelCalendarFilters, TravelCalendarCreateRequest } from "@/lib/travelCalendarApi";
import { Button } from "@/components/manger/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import { Input } from "@/components/manger/ui/input";
import { Textarea } from "@/components/manger/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/manger/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/manger/ui/dialog";
import { toast } from "sonner";

const ManagerTravelCalendar = () => {
  const [travelCalendars, setTravelCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTravelCalendar, setNewTravelCalendar] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    destination: "",
    purpose: "business",
    status: "planned",
    visibility: "team",
    budget: {
      estimated: 0,
      actual: 0,
      currency: "USD",
    },
    notes: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
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

  const handleDelete = async (id) => {
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

  const handleCreateTravelCalendar = async () => {
    setIsCreating(true);
    try {
      const response = await travelCalendarApi.createTravelCalendar(newTravelCalendar);
      if (response.success) {
        toast.success(response.message || "Travel calendar created successfully");
        setShowCreateDialog(false);
        setNewTravelCalendar({
          title: "",
          description: "",
          startDate: "",
          endDate: "",
          destination: "",
          purpose: "business",
          status: "planned",
          visibility: "team",
          budget: {
            estimated: 0,
            actual: 0,
            currency: "USD",
          },
          notes: "",
        });
        loadTravelCalendars();
      } else {
        toast.error(response.error?.message || "Failed to create travel calendar");
      }
    } catch (error) {
      console.error("Failed to create travel calendar:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create travel calendar");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "planned": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-purple-100 text-purple-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPurposeColor = (purpose) => {
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Travel Calendar</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage travel schedules for your team</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Travel
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-blue z-10 pb-4">
              <DialogTitle>Create Travel Calendar Entry</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={newTravelCalendar.title}
                    onChange={(e) => setNewTravelCalendar({ ...newTravelCalendar, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Destination</label>
                  <Input
                    value={newTravelCalendar.destination}
                    onChange={(e) => setNewTravelCalendar({ ...newTravelCalendar, destination: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={newTravelCalendar.startDate}
                    onChange={(e) => setNewTravelCalendar({ ...newTravelCalendar, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input
                    type="date"
                    value={newTravelCalendar.endDate}
                    onChange={(e) => setNewTravelCalendar({ ...newTravelCalendar, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purpose</label>
                  <Select
                    value={newTravelCalendar.purpose}
                    onValueChange={(value) => setNewTravelCalendar({ ...newTravelCalendar, purpose: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Visibility</label>
                  <Select
                    value={newTravelCalendar.visibility}
                    onValueChange={(value) => setNewTravelCalendar({ ...newTravelCalendar, visibility: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select
                    value={newTravelCalendar.status}
                    onValueChange={(value) => setNewTravelCalendar({ ...newTravelCalendar, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
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
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Budget</label>
                  <Input
                    type="number"
                    min={0}
                    value={newTravelCalendar.budget?.estimated ?? 0}
                    onChange={(e) =>
                      setNewTravelCalendar({
                        ...newTravelCalendar,
                        budget: {
                          ...(newTravelCalendar.budget ?? { actual: 0, currency: "USD" }),
                          estimated: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={newTravelCalendar.description}
                    onChange={(e) => setNewTravelCalendar({ ...newTravelCalendar, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <Textarea
                    value={newTravelCalendar.notes}
                    onChange={(e) => setNewTravelCalendar({ ...newTravelCalendar, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4 sticky bottom-0 bg-blue pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTravelCalendar}
                  disabled={isCreating || !newTravelCalendar.title || !newTravelCalendar.destination || !newTravelCalendar.startDate || !newTravelCalendar.endDate}
                >
                  {isCreating ? "Creating..." : "Create Travel"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Select value={filters.status || "all"} onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
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
              <Select value={filters.purpose || "all"} onValueChange={(value) => setFilters({ ...filters, purpose: value === "all" ? undefined : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Purpose</SelectItem>
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
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-base sm:text-lg font-semibold">{calendar.title}</h3>
                    <Badge className={getStatusColor(calendar.status)}>
                      {calendar.status}
                    </Badge>
                    <Badge className={getPurposeColor(calendar.purpose)}>
                      {calendar.purpose}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">
                        {format(new Date(calendar.startDate), "MMM dd, yyyy")} - {format(new Date(calendar.endDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{calendar.destination}</span>
                    </div>
                  </div>

                  {calendar.description && (
                    <p className="text-gray-600 mt-2 text-sm break-words">{calendar.description}</p>
                  )}

                  {calendar.budget?.estimated > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <DollarSign className="h-4 w-4 flex-shrink-0" />
                      <span>Budget: {calendar.budget.currency} {calendar.budget.estimated}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
            <CardContent className="p-6 sm:p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No travel calendars found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Get started by creating your first travel calendar entry</p>
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
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-blue z-10 pb-4">
            <DialogTitle>Travel Calendar Details</DialogTitle>
          </DialogHeader>
          {selectedCalendar && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold break-words">{selectedCalendar.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className={getStatusColor(selectedCalendar.status)}>
                    {selectedCalendar.status}
                  </Badge>
                  <Badge className={getPurposeColor(selectedCalendar.purpose)}>
                    {selectedCalendar.purpose}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <p className="break-words">{format(new Date(selectedCalendar.startDate), "MMMM dd, yyyy")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <p className="break-words">{format(new Date(selectedCalendar.endDate), "MMMM dd, yyyy")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <p className="break-words">{selectedCalendar.destination}</p>
                </div>
              </div>

              {selectedCalendar.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="break-words whitespace-pre-wrap">{selectedCalendar.description}</p>
                </div>
              )}

              {selectedCalendar.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="break-words whitespace-pre-wrap">{selectedCalendar.notes}</p>
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