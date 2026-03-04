import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
import { Label } from "@/components/admin/ui/label";
import { Textarea } from "@/components/admin/ui/textarea";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Building2,
  Phone,
  ClipboardList,
  Home,
  Warehouse,
  Briefcase,
} from "lucide-react";
import { createResource, listResource, updateResource } from "@/lib/admin/apiClient";

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  type: "commercial" | "residential" | "industrial";
  businessUnit?: string;
  notes?: string;
  contactName: string;
  contactPhone: string;
  status: "active" | "inactive";
  tasksCount: number;
  createdAt?: string;
}

const toDateOnly = (value: string) => {
  const v = String(value || "").trim();
  if (!v) return "";
  const idx = v.indexOf("T");
  return idx >= 0 ? v.slice(0, idx) : v;
};

type BackendLocation = Partial<Location> & {
  _id?: string;
  date?: string;
  createdAt?: string;
};

function normalizeLocation(l: BackendLocation): Location {
  const createdAt =
    String(l.createdAt || l.date || "").trim() || undefined;

  return {
    id: String(l.id || l._id || "").trim(),
    name: String(l.name || "").trim(),
    address: String(l.address || "").trim(),
    city: String(l.city || "").trim(),
    type: (String(l.type || "commercial") as Location["type"]) || "commercial",
    businessUnit: String(l.businessUnit || "").trim() || "",
    notes: String(l.notes || "").trim() || "",
    contactName: String(l.contactName || "").trim(),
    contactPhone: String(l.contactPhone || "").trim(),
    status: (String(l.status || "active") as Location["status"]) || "active",
    tasksCount: Number.isFinite(Number(l.tasksCount)) ? Number(l.tasksCount) : 0,
    createdAt: createdAt ? toDateOnly(createdAt) : undefined,
  };
}

const locations: Location[] = [
  {
    id: "LOC-001",
    name: "Building A - Corporate Office",
    address: "123 Main Street",
    city: "New York, NY 10001",
    type: "commercial",
    businessUnit: "Corporate",
    notes: "Main HQ. After-hours access requires front desk approval.",
    contactName: "James Wilson",
    contactPhone: "+1 (555) 111-2222",
    status: "active",
    tasksCount: 8,
  },
  {
    id: "LOC-002",
    name: "Building B - Tech Hub",
    address: "456 Innovation Ave",
    city: "San Francisco, CA 94102",
    type: "commercial",
    contactName: "Maria Garcia",
    contactPhone: "+1 (555) 333-4444",
    status: "active",
    tasksCount: 5,
  },
  {
    id: "LOC-003",
    name: "Warehouse C",
    address: "789 Industrial Blvd",
    city: "Los Angeles, CA 90012",
    type: "industrial",
    contactName: "Robert Chen",
    contactPhone: "+1 (555) 555-6666",
    status: "active",
    tasksCount: 12,
  },
  {
    id: "LOC-004",
    name: "Residential Complex D",
    address: "321 Oak Lane",
    city: "Austin, TX 78701",
    type: "residential",
    contactName: "Sarah Thompson",
    contactPhone: "+1 (555) 777-8888",
    status: "active",
    tasksCount: 3,
  },
  {
    id: "LOC-005",
    name: "Old Storage Facility",
    address: "555 Harbor Drive",
    city: "Seattle, WA 98101",
    type: "industrial",
    contactName: "Mike Brown",
    contactPhone: "+1 (555) 999-0000",
    status: "inactive",
    tasksCount: 0,
  },
];

const typeClasses = {
  commercial: "bg-accent/10 text-accent",
  residential: "bg-success/10 text-success",
  industrial: "bg-warning/10 text-warning",
};

const statusClasses = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
};

const Locations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editLocationOpen, setEditLocationOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [locationsList, setLocationsList] = useState<Location[]>(() => []);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    type: "commercial" as Location["type"],
    businessUnit: "",
    notes: "",
    contactName: "",
    contactPhone: "",
    status: "active" as Location["status"],
    tasksCount: 0,
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    address: "",
    city: "",
    type: "commercial" as Location["type"],
    businessUnit: "",
    notes: "",
    contactName: "",
    contactPhone: "",
    status: "active" as Location["status"],
    tasksCount: 0,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const list = await listResource<BackendLocation>("locations");
        if (!mounted) return;
        setLocationsList(list.map(normalizeLocation));
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load locations");
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

  const refreshLocations = async () => {
    const list = await listResource<BackendLocation>("locations");
    setLocationsList(list.map(normalizeLocation));
  };

  const handleAddLocation = async () => {
    if (!formData.name || !formData.address || !formData.city) return;
    try {
      setApiError(null);
      const newLocation: Location = {
        id: `LOC-${Date.now().toString().slice(-6)}`,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        type: formData.type,
        businessUnit: formData.businessUnit || "",
        notes: formData.notes || "",
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        status: formData.status,
        tasksCount: Number.isFinite(formData.tasksCount) ? formData.tasksCount : 0,
        createdAt: toDateOnly(new Date().toISOString()),
      };
      await createResource<Location>("locations", newLocation);
      await refreshLocations();
      setAddLocationOpen(false);
      setFormData({
        name: "",
        address: "",
        city: "",
        type: "commercial",
        businessUnit: "",
        notes: "",
        contactName: "",
        contactPhone: "",
        status: "active",
        tasksCount: 0,
      });
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to add location");
    }
  };

  const handleViewDetails = (location: Location) => {
    setSelectedLocation(location);
    setViewDetailsOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setEditFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      type: location.type,
      businessUnit: location.businessUnit || "",
      notes: location.notes || "",
      contactName: location.contactName,
      contactPhone: location.contactPhone,
      status: location.status,
      tasksCount: location.tasksCount,
    });
    setEditLocationOpen(true);
  };

  const saveEditLocation = async () => {
    if (!selectedLocation) return;
    if (!editFormData.name || !editFormData.address || !editFormData.city) return;
    try {
      setApiError(null);
      await updateResource<Location>("locations", selectedLocation.id, {
        ...selectedLocation,
        name: editFormData.name,
        address: editFormData.address,
        city: editFormData.city,
        type: editFormData.type,
        contactName: editFormData.contactName,
        contactPhone: editFormData.contactPhone,
        status: editFormData.status,
        businessUnit: editFormData.businessUnit || "",
        notes: editFormData.notes || "",
        tasksCount: Number.isFinite(editFormData.tasksCount) ? editFormData.tasksCount : 0,
      });
      await refreshLocations();
      setEditLocationOpen(false);
      setSelectedLocation(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update location");
    }
  };

  const handleDeactivateConfirm = (location: Location) => {
    setSelectedLocation(location);
    setDeactivateConfirmOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!selectedLocation) return;
    try {
      setApiError(null);
      await updateResource<Location>("locations", selectedLocation.id, {
        ...selectedLocation,
        status: selectedLocation.status === "inactive" ? "active" : "inactive",
      });
      await refreshLocations();
      setDeactivateConfirmOpen(false);
      setSelectedLocation(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update location");
    }
  };

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return locationsList;

    return locationsList.filter((l) => {
      return (
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q)
      );
    });
  }, [locationsList, searchQuery]);

  return (
    <AdminLayout>
      {/* Mobile-first container */}
      <div className="space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
        
        {/* Page Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Locations Management
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
              Manage service locations and business units.
            </p>
          </div>

          {/* Add Location Dialog */}
          <Dialog open={addLocationOpen} onOpenChange={setAddLocationOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto mt-2 sm:mt-0">
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Location</span>
              </Button>
            </DialogTrigger>
            
            <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-1.5 sm:space-y-2">
                <DialogTitle className="text-lg sm:text-xl">Add Location</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Create a new service location
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-4 sm:space-y-5">
                {/* Location Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Location Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    placeholder="Building A - Corporate Office"
                    required
                  />
                </div>

                {/* Address & City */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">City/State/Zip *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                      placeholder="New York, NY 10001"
                      required
                    />
                  </div>
                </div>

                {/* Type, Status, Tasks */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Location["type"] })}
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                    >
                      <option value="commercial">Commercial</option>
                      <option value="residential">Residential</option>
                      <option value="industrial">Industrial</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as Location["status"] })
                      }
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Active Tasks</label>
                    <input
                      type="number"
                      value={formData.tasksCount}
                      onChange={(e) => setFormData({ ...formData, tasksCount: Number(e.target.value) })}
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                      min={0}
                    />
                  </div>
                </div>

                {/* Business Unit & Notes */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Business Unit</label>
                    <Input
                      value={formData.businessUnit}
                      onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })}
                      placeholder="e.g., Corporate"
                      className="text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Location Notes</label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Short notes"
                      className="text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>
                </div>

                {/* Contact Name & Phone */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Contact Name</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                      placeholder="James Wilson"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Contact Phone</label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                      placeholder="+1 (555) 111-2222"
                    />
                  </div>
                </div>
              </form>

              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setAddLocationOpen(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddLocation} 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto order-1 sm:order-2"
                >
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  Add Location
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

        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Locations</p>
                  <p className="text-xl sm:text-2xl font-bold">{locationsList.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Commercial</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {locationsList.filter((l) => l.type === "commercial").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Home className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Residential</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {locationsList.filter((l) => l.type === "residential").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Warehouse className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Industrial</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {locationsList.filter((l) => l.type === "industrial").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Card */}
        <Card className="shadow-soft border-0 sm:border">
          <CardContent className="p-3 sm:p-6">
            <div className="relative w-full sm:max-w-md">
              <label className="block text-xs text-muted-foreground mb-1.5 sm:hidden">
                Search Locations
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, address, or contact..."
                  className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locations Card */}
        <Card className="shadow-soft border-0 sm:border">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
              Locations ({filteredLocations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Loading locations...
                </div>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="block sm:hidden space-y-3 p-4">
                  {filteredLocations.map((location) => (
                    <div key={location.id} className="bg-white rounded-lg border p-4 space-y-3">
                      {/* Header with Name and Actions */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{location.name}</p>
                            <p className="text-xs text-muted-foreground">{toDateOnly(location.createdAt || "") || "—"}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(location)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditLocation(location)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Location
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeactivateConfirm(location)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {location.status === "inactive" ? "Activate" : "Deactivate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Type and Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`${typeClasses[location.type]} text-xs`} variant="secondary">
                          {location.type}
                        </Badge>
                        <Badge className={`${statusClasses[location.status]} text-xs`} variant="secondary">
                          {location.status}
                        </Badge>
                      </div>

                      {/* Address */}
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <div className="text-xs">
                            <p>{location.address}</p>
                            <p>{location.city}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredLocations.length === 0 && (
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">No locations found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your search or add a new location
                      </p>
                    </div>
                  )}
                </div>

                {/* Tablet/Desktop View - Table */}
                <div className="hidden sm:block w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-sm w-[18%]">Name</TableHead>
                        <TableHead className="text-xs md:text-sm w-[10%]">Type</TableHead>
                        <TableHead className="text-xs md:text-sm w-[20%]">Address</TableHead>
                        <TableHead className="text-xs md:text-sm w-[10%]">City</TableHead>
                        <TableHead className="text-xs md:text-sm w-[10%]">Status</TableHead>
                        <TableHead className="text-xs md:text-sm w-[12%]">Date</TableHead>
                        <TableHead className="text-right text-xs md:text-sm w-[10%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLocations.map((location) => (
                        <TableRow key={location.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium text-sm md:text-base truncate max-w-[200px] lg:max-w-[250px]">
                                {location.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${typeClasses[location.type]} text-xs md:text-sm`} 
                              variant="secondary"
                            >
                              {location.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1.5 text-xs md:text-sm">
                              <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[200px] lg:max-w-[250px]">
                                {location.address}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs md:text-sm">
                            <span className="truncate max-w-[160px] lg:max-w-[200px] inline-block">
                              {location.city}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${statusClasses[location.status]} text-xs md:text-sm`} 
                              variant="secondary"
                            >
                              {location.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs md:text-sm">
                            {toDateOnly(location.createdAt || "") || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(location)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditLocation(location)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Location
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeactivateConfirm(location)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {location.status === "inactive" ? "Activate" : "Deactivate"}
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
      </div>

      {/* View Details Dialog - Responsive */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Location Details</DialogTitle>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-semibold break-words">{selectedLocation.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{toDateOnly(selectedLocation.createdAt || "") || "—"}</p>
                  </div>
                </div>
                <Badge className={`${statusClasses[selectedLocation.status]} text-xs sm:text-sm self-start sm:self-center`} variant="secondary">
                  {selectedLocation.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">Type</label>
                  <div>
                    <Badge className={`${typeClasses[selectedLocation.type]} text-xs sm:text-sm`} variant="secondary">
                      {selectedLocation.type}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">Date</label>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {toDateOnly(selectedLocation.createdAt || "") || "—"}
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">Address</label>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {selectedLocation.address || "—"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">City</label>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {selectedLocation.city || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4 sm:mt-6">
            <Button onClick={() => setViewDetailsOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog - Responsive */}
      <Dialog open={editLocationOpen} onOpenChange={setEditLocationOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Edit Location</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update location information and save changes
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <form className="space-y-4 sm:space-y-5">
              {/* Location Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Location Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                  required
                />
              </div>

              {/* Address & City */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Address *</label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">City/State/Zip *</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Type, Status, Tasks */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Type</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, type: e.target.value as Location["type"] })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                  >
                    <option value="commercial">Commercial</option>
                    <option value="residential">Residential</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value as Location["status"] })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Active Tasks</label>
                  <input
                    type="number"
                    value={editFormData.tasksCount}
                    onChange={(e) => setEditFormData({ ...editFormData, tasksCount: Number(e.target.value) })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    min={0}
                  />
                </div>
              </div>

              {/* Business Unit & Notes */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Business Unit</label>
                  <Input
                    value={editFormData.businessUnit}
                    onChange={(e) => setEditFormData({ ...editFormData, businessUnit: e.target.value })}
                    className="text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Location Notes</label>
                  <Input
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>
              </div>

              {/* Contact Name & Phone */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Contact Name</label>
                  <input
                    type="text"
                    value={editFormData.contactName}
                    onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={editFormData.contactPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                  />
                </div>
              </div>
            </form>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button 
              variant="outline" 
              onClick={() => setEditLocationOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveEditLocation} 
              className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto order-1 sm:order-2"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Activate Confirm Dialog - Responsive */}
      <Dialog open={deactivateConfirmOpen} onOpenChange={setDeactivateConfirmOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg text-destructive">
              {selectedLocation?.status === "inactive" ? "Activate Location" : "Deactivate Location"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedLocation?.status === "inactive"
                ? "This location will be marked as active again."
                : "This location will be marked as inactive. You can activate it again later."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLocation && (
            <div className="rounded-md bg-muted p-3 sm:p-4 text-xs sm:text-sm mt-2">
              <p className="font-medium break-words">{selectedLocation.name}</p>
              <p className="text-muted-foreground text-xs sm:text-sm break-words mt-1">
                {selectedLocation.id}
              </p>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button 
              variant="outline" 
              onClick={() => setDeactivateConfirmOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmToggleActive}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {selectedLocation?.status === "inactive" ? "Activate" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Locations;