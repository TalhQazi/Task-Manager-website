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
  Home,
  Warehouse,
  Briefcase,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { createResource, listResource, updateResource, apiFetch } from "@/lib/admin/apiClient";

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  type: "commercial" | "residential" | "industrial";
  notes?: string;
  contactName: string;
  contactPhone: string;
  status: "active" | "inactive";
  createdAt?: string;
  photoDataUrl?: string;
  photoFileName?: string;
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
    country: String(l.country || "").trim(),
    type: (String(l.type || "commercial") as Location["type"]) || "commercial",
    notes: String(l.notes || "").trim() || "",
    contactName: String(l.contactName || "").trim(),
    contactPhone: String(l.contactPhone || "").trim(),
    status: (String(l.status || "active") as Location["status"]) || "active",
    createdAt: createdAt ? toDateOnly(createdAt) : undefined,
    photoDataUrl: String(l.photoDataUrl || "").trim() || undefined,
    photoFileName: String(l.photoFileName || "").trim() || undefined,
  };
}

const locations: Location[] = [
  {
    id: "LOC-001",
    name: "Building A - Corporate Office",
    address: "123 Main Street",
    city: "New York",
    country: "USA",
    type: "commercial",
    notes: "Main HQ. After-hours access requires front desk approval.",
    contactName: "James Wilson",
    contactPhone: "+1 (555) 111-2222",
    status: "active",
  },
  {
    id: "LOC-002",
    name: "Building B - Tech Hub",
    address: "456 Innovation Ave",
    city: "San Francisco",
    country: "USA",
    type: "commercial",
    contactName: "Maria Garcia",
    contactPhone: "+1 (555) 333-4444",
    status: "active",
  },
  {
    id: "LOC-003",
    name: "Warehouse C",
    address: "789 Industrial Blvd",
    city: "Los Angeles",
    country: "USA",
    type: "industrial",
    contactName: "Robert Chen",
    contactPhone: "+1 (555) 555-6666",
    status: "active",
  },
  {
    id: "LOC-004",
    name: "Residential Complex D",
    address: "321 Oak Lane",
    city: "Austin",
    country: "USA",
    type: "residential",
    contactName: "Sarah Thompson",
    contactPhone: "+1 (555) 777-8888",
    status: "active",
  },
  {
    id: "LOC-005",
    name: "Old Storage Facility",
    address: "555 Harbor Drive",
    city: "Seattle",
    country: "USA",
    type: "industrial",
    contactName: "Mike Brown",
    contactPhone: "+1 (555) 999-0000",
    status: "inactive",
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
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [editCities, setEditCities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    type: "commercial" as Location["type"],
    notes: "",
    contactName: "",
    contactPhone: "",
    status: "active" as Location["status"],
    photoDataUrl: "",
    photoFileName: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    type: "commercial" as Location["type"],
    notes: "",
    contactName: "",
    contactPhone: "",
    status: "active" as Location["status"],
    photoDataUrl: "",
    photoFileName: "",
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

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await apiFetch<{ countries: string[] }>("/api/locations/countries");
        setCountries(res.countries);
      } catch {
        setCountries([]);
      }
    };
    void loadCountries();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      if (!formData.country) {
        setCities([]);
        return;
      }
      try {
        const res = await apiFetch<{ cities: string[] }>(`/api/locations/cities?country=${encodeURIComponent(formData.country)}`);
        setCities(res.cities);
      } catch {
        setCities([]);
      }
    };
    void loadCities();
  }, [formData.country]);

  useEffect(() => {
    const loadEditCities = async () => {
      if (!editFormData.country) {
        setEditCities([]);
        return;
      }
      try {
        const res = await apiFetch<{ cities: string[] }>(`/api/locations/cities?country=${encodeURIComponent(editFormData.country)}`);
        setEditCities(res.cities);
      } catch {
        setEditCities([]);
      }
    };
    void loadEditCities();
  }, [editFormData.country]);

  const refreshLocations = async () => {
    const list = await listResource<BackendLocation>("locations");
    setLocationsList(list.map(normalizeLocation));
  };

  const handleAddLocation = async () => {
    if (!formData.name || !formData.address || !formData.city || !formData.country) return;
    try {
      setApiError(null);
      const newLocation: Location = {
        id: `LOC-${Date.now().toString().slice(-6)}`,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        type: formData.type,
        notes: formData.notes || "",
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        status: formData.status,
        createdAt: toDateOnly(new Date().toISOString()),
        photoDataUrl: formData.photoDataUrl || undefined,
        photoFileName: formData.photoFileName || undefined,
      };
      await createResource<Location>("locations", newLocation);
      await refreshLocations();
      setAddLocationOpen(false);
      setFormData({
        name: "",
        address: "",
        city: "",
        country: "",
        type: "commercial",
        notes: "",
        contactName: "",
        contactPhone: "",
        status: "active",
        photoDataUrl: "",
        photoFileName: "",
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
      country: location.country,
      type: location.type,
      notes: location.notes || "",
      contactName: location.contactName,
      contactPhone: location.contactPhone,
      status: location.status,
      photoDataUrl: location.photoDataUrl || "",
      photoFileName: location.photoFileName || "",
    });
    setEditLocationOpen(true);
  };

  const saveEditLocation = async () => {
    if (!selectedLocation) return;
    if (!editFormData.name || !editFormData.address || !editFormData.city || !editFormData.country) return;
    try {
      setApiError(null);
      await updateResource<Location>("locations", selectedLocation.id, {
        ...selectedLocation,
        name: editFormData.name,
        address: editFormData.address,
        city: editFormData.city,
        country: editFormData.country,
        type: editFormData.type,
        contactName: editFormData.contactName,
        contactPhone: editFormData.contactPhone,
        status: editFormData.status,
        notes: editFormData.notes || "",
        photoDataUrl: editFormData.photoDataUrl || undefined,
        photoFileName: editFormData.photoFileName || undefined,
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

                {/* Country & City */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Country *</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value, city: "" })}
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                      required
                    >
                      <option value="">Select country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">City *</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                      disabled={!formData.country}
                      required
                    >
                      <option value="">{formData.country ? "Select city" : "Select country first"}</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
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

                {/* Type & Status */}
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
                </div>

                {/* Location Photo Upload */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Location Photo</label>
                  <div className="flex flex-col gap-2">
                    {formData.photoDataUrl ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                        <img 
                          src={formData.photoDataUrl} 
                          alt="Location preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoDataUrl: "", photoFileName: "" })}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-full rounded-lg border border-dashed border-muted-foreground/25 px-3 py-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          const input = document.getElementById("location-photo-upload") as HTMLInputElement;
                          input?.click();
                        }}
                      >
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-xs sm:text-sm text-muted-foreground">Click to upload location photo</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                    <input
                      id="location-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({
                              ...formData,
                              photoDataUrl: reader.result as string,
                              photoFileName: file.name,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Location Notes */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Location Notes</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Short notes about this location"
                    className="text-sm sm:text-base h-9 sm:h-10"
                  />
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
                          {location.photoDataUrl ? (
                            <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 border">
                              <img 
                                src={location.photoDataUrl} 
                                alt={location.name} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
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
                            <div className="flex items-center gap-2 min-w-0">
                              {location.photoDataUrl ? (
                                <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0 border">
                                  <img 
                                    src={location.photoDataUrl} 
                                    alt={location.name} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <p className="font-medium text-sm md:text-base truncate max-w-[160px] lg:max-w-[200px]">
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
                  {selectedLocation.photoDataUrl ? (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden flex-shrink-0 border">
                      <img 
                        src={selectedLocation.photoDataUrl} 
                        alt={selectedLocation.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                    </div>
                  )}
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
                  <label className="text-xs sm:text-sm font-medium">Country</label>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {selectedLocation.country || "—"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">City</label>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {selectedLocation.city || "—"}
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs sm:text-sm font-medium">Address</label>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {selectedLocation.address || "—"}
                  </p>
                </div>

                {selectedLocation.notes && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs sm:text-sm font-medium">Notes</label>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      {selectedLocation.notes}
                    </p>
                  </div>
                )}
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

              {/* Address & Country/City */}
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
              </div>

              {/* Country & City */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Country *</label>
                  <select
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value, city: "" })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                    required
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">City *</label>
                  <select
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                    disabled={!editFormData.country}
                    required
                  >
                    <option value="">{editFormData.country ? "Select city" : "Select country first"}</option>
                    {editCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type & Status */}
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
              </div>

              {/* Location Photo Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Location Photo</label>
                <div className="flex flex-col gap-2">
                  {editFormData.photoDataUrl ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <img 
                        src={editFormData.photoDataUrl} 
                        alt="Location preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, photoDataUrl: "", photoFileName: "" })}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-full rounded-lg border border-dashed border-muted-foreground/25 px-3 py-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        const input = document.getElementById("edit-location-photo-upload") as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs sm:text-sm text-muted-foreground">Click to upload location photo</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                  <input
                    id="edit-location-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditFormData({
                            ...editFormData,
                            photoDataUrl: reader.result as string,
                            photoFileName: file.name,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Location Notes */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Location Notes</label>
                <Input
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Short notes about this location"
                  className="text-sm sm:text-base h-9 sm:h-10"
                />
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