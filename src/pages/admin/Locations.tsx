import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { cn } from "@/lib/utils";
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
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { createResource, listResource, updateResource, apiFetch } from "@/lib/admin/apiClient";

<<<<<<< HEAD
=======
function LocationPhoto({ locationId, alt, containerClassName, iconClassName }: { locationId: string; alt: string; containerClassName: string; iconClassName: string }) {
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ photoDataUrl: string }>(`/api/locations/${encodeURIComponent(locationId)}/photo`)
      .then(d => { if (!cancelled) setSrc(d.photoDataUrl || null); })
      .catch(() => { if (!cancelled) setSrc(null); });
    return () => { cancelled = true; };
  }, [locationId]);
  if (src) {
    return (
      <div className={`${containerClassName} overflow-hidden border flex-shrink-0`}>
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${containerClassName} bg-muted flex items-center justify-center flex-shrink-0`}>
      <MapPin className={iconClassName} />
    </div>
  );
}

>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
const LOCATION_TYPES = [
  "Property",
  "Building",
  "Unit",
  "Office",
  "Room",
  "Warehouse",
  "Yard",
] as const;

type LocationType = (typeof LOCATION_TYPES)[number];

function normalizeLocationType(value: unknown): LocationType {
  const v = String(value || "").trim();
  if ((LOCATION_TYPES as readonly string[]).includes(v)) return v as LocationType;
  const lower = v.toLowerCase();
  if (lower === "commercial") return "Office";
  if (lower === "residential") return "Unit";
  if (lower === "industrial") return "Warehouse";
  return "Property";
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  type: LocationType;
<<<<<<< HEAD
  businessUnits?: string[];
=======
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
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
    type: normalizeLocationType(l.type),
<<<<<<< HEAD
    businessUnits: Array.isArray(l.businessUnits) ? l.businessUnits : [],
=======
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
    notes: String(l.notes || "").trim() || "",
    contactName: String(l.contactName || "").trim(),
    contactPhone: String(l.contactPhone || "").trim(),
    status: (String(l.status || "active") as Location["status"]) || "active",
    createdAt: createdAt ? toDateOnly(createdAt) : undefined,
    photoDataUrl: String(l.photoDataUrl || "").trim() || undefined,
    photoFileName: String(l.photoFileName || "").trim() || undefined,
  };
}

function nextLocationId(existing: readonly Location[]): string {
  let max = 0;
  for (const l of existing) {
    const m = /^LOC-(\d+)$/.exec(String(l.id || "").trim());
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `LOC-${String(max + 1).padStart(3, "0")}`;
}

<<<<<<< HEAD
const typeClasses = {
  Property: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Building: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Unit: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Office: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  Room: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Warehouse: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Yard: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const statusClasses = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
=======
const locations: Location[] = [
  {
    id: "LOC-001",
    name: "Building A - Corporate Office",
    address: "123 Main Street",
    city: "New York",
    country: "USA",
    type: "Office",
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
    type: "Office",
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
    type: "Warehouse",
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
    type: "Unit",
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
    type: "Warehouse",
    contactName: "Mike Brown",
    contactPhone: "+1 (555) 999-0000",
    status: "inactive",
  },
];

const typeClasses = {
  Property: "bg-accent/10 text-accent",
  Building: "bg-accent/10 text-accent",
  Unit: "bg-success/10 text-success",
  Office: "bg-accent/10 text-accent",
  Room: "bg-success/10 text-success",
  Warehouse: "bg-warning/10 text-warning",
  Yard: "bg-warning/10 text-warning",
};

const statusClasses = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
};

const Locations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editLocationOpen, setEditLocationOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
<<<<<<< HEAD
  const [locationsList, setLocationsList] = useState<Location[]>([]);
=======
  const [locationsList, setLocationsList] = useState<Location[]>(() => []);
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "USA",
    type: "Property" as Location["type"],
<<<<<<< HEAD
    businessUnits: [] as string[],
=======
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
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
    type: "Property" as Location["type"],
<<<<<<< HEAD
    businessUnits: [] as string[],
=======
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
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
<<<<<<< HEAD
    const viewId = searchParams.get("view");
    if (!viewId) return;
    
    const match = locationsList.find((l) => l.id === viewId);
    if (match && !viewDetailsOpen) {
      setSelectedLocation(match);
      setViewDetailsOpen(true);
      
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("view");
      setSearchParams(newParams, { replace: true });
    }
  }, [locationsList, searchParams, setSearchParams, viewDetailsOpen]);
=======
    const viewId = String(searchParams.get("view") || "").trim();
    if (!viewId) return;
    if (viewDetailsOpen || editLocationOpen || deactivateConfirmOpen || addLocationOpen) return;

    const match = locationsList.find((l) => String(l.id) === viewId);
    if (!match) return;

    setSelectedLocation(match);
    setViewDetailsOpen(true);

    const next = new URLSearchParams(searchParams);
    next.delete("view");
    setSearchParams(next, { replace: true });
  }, [
    locationsList,
    searchParams,
    setSearchParams,
    viewDetailsOpen,
    editLocationOpen,
    deactivateConfirmOpen,
    addLocationOpen,
  ]);
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081

  const countriesWithUsa = useMemo(() => {
    if (!countries.includes("USA")) return ["USA", ...countries];
    return countries;
  }, [countries]);

  const refreshLocations = async () => {
<<<<<<< HEAD
    try {
      const list = await listResource<BackendLocation>("locations");
      setLocationsList(list.map(normalizeLocation));
    } catch (e) {
      console.error("Failed to refresh locations", e);
    }
=======
    const list = await listResource<BackendLocation>("locations");
    setLocationsList(list.map(normalizeLocation));
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
  };

  const handleAddLocation = async () => {
    if (!formData.name || !formData.address || !formData.city || !formData.country) {
      setFormError("Please fill in all required fields: Name, Address, City, and Country");
      return;
    }
    try {
      setSubmitLoading(true);
      setFormError(null);
<<<<<<< HEAD
=======
      setApiError(null);
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
      const newLocation: Location = {
        id: nextLocationId(locationsList),
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        type: formData.type,
<<<<<<< HEAD
        businessUnits: formData.businessUnits,
=======
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
        notes: formData.notes || "",
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        status: formData.status,
<<<<<<< HEAD
        createdAt: new Date().toISOString(),
=======
        createdAt: toDateOnly(new Date().toISOString()),
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
        photoDataUrl: formData.photoDataUrl || undefined,
        photoFileName: formData.photoFileName || undefined,
      };
      await createResource<Location>("locations", newLocation);
      setSubmitSuccess(true);
<<<<<<< HEAD
      setTimeout(() => {
        setSubmitSuccess(false);
        setAddLocationOpen(false);
      }, 1500);
      await refreshLocations();
=======
      setTimeout(() => setSubmitSuccess(false), 2000);
      await refreshLocations();
      setAddLocationOpen(false);
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
      setFormData({
        name: "",
        address: "",
        city: "",
        country: "USA",
        type: "Property",
<<<<<<< HEAD
        businessUnits: [],
=======
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
        notes: "",
        contactName: "",
        contactPhone: "",
        status: "active",
        photoDataUrl: "",
        photoFileName: "",
      });
    } catch (e) {
<<<<<<< HEAD
      setFormError(e instanceof Error ? e.message : "Failed to add location");
=======
      setFormError(e instanceof Error ? e.message : "Failed to add location. Please try again.");
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
    } finally {
      setSubmitLoading(false);
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
      type: normalizeLocationType(location.type),
<<<<<<< HEAD
      businessUnits: location.businessUnits || [],
=======
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
      notes: location.notes || "",
      contactName: location.contactName,
      contactPhone: location.contactPhone,
      status: location.status,
<<<<<<< HEAD
      photoDataUrl: location.photoDataUrl || "",
      photoFileName: location.photoFileName || "",
    });
    setEditLocationOpen(true);
=======
      photoDataUrl: "",
      photoFileName: location.photoFileName || "",
    });
    setEditLocationOpen(true);
    // Load existing photo in background
    apiFetch<{ photoDataUrl: string; photoFileName: string }>(`/api/locations/${encodeURIComponent(location.id)}/photo`)
      .then(d => {
        if (d.photoDataUrl) {
          setEditFormData(prev => ({ ...prev, photoDataUrl: d.photoDataUrl, photoFileName: d.photoFileName || prev.photoFileName }));
        }
      })
      .catch(() => {});
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
  };

  const saveEditLocation = async () => {
    if (!selectedLocation) return;
    if (!editFormData.name || !editFormData.address || !editFormData.city || !editFormData.country) return;
    try {
<<<<<<< HEAD
      setSubmitLoading(true);
=======
      setApiError(null);
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
      await updateResource<Location>("locations", selectedLocation.id, {
        ...selectedLocation,
        name: editFormData.name,
        address: editFormData.address,
        city: editFormData.city,
        country: editFormData.country,
        type: editFormData.type,
<<<<<<< HEAD
        businessUnits: editFormData.businessUnits,
=======
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
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
<<<<<<< HEAD
    } finally {
      setSubmitLoading(false);
=======
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
    }
  };

  const handleDeactivateConfirm = (location: Location) => {
    setSelectedLocation(location);
    setDeactivateConfirmOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!selectedLocation) return;
    try {
<<<<<<< HEAD
=======
      setApiError(null);
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
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
<<<<<<< HEAD
    const q = searchQuery.toLowerCase();
    return locationsList.filter((l) => 
      l.name.toLowerCase().includes(q) || 
      l.address.toLowerCase().includes(q) || 
      l.city.toLowerCase().includes(q)
    );
  }, [locationsList, searchQuery]);

  const locationCodeById = useMemo(() => {
    const map = new Map<string, string>();
    locationsList.forEach((l, idx) => {
=======
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

  const locationCodeById = useMemo(() => {
    const sorted = [...locationsList].sort((a, b) => {
      const aDate = a.createdAt || "9999-99-99";
      const bDate = b.createdAt || "9999-99-99";
      const dateCmp = aDate.localeCompare(bDate);
      if (dateCmp !== 0) return dateCmp;
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.id.localeCompare(b.id);
    });
    const map = new Map<string, string>();
    sorted.forEach((l, idx) => {
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
      map.set(l.id, `LOC-${String(idx + 1).padStart(3, "0")}`);
    });
    return map;
  }, [locationsList]);

  return (
<<<<<<< HEAD
    <div className="pl-6 space-y-4 sm:space-y-6 md:space-y-8 pr-2 sm:pr-0 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Locations
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage site locations, business units, and site information.
          </p>
        </div>

        <Dialog open={addLocationOpen} onOpenChange={setAddLocationOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl mx-auto p-0 overflow-hidden rounded-xl border-0 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <DialogTitle className="text-xl sm:text-2xl font-bold">Add New Location</DialogTitle>
              <DialogDescription className="text-blue-100 mt-1">
                Fill in the details to create a new service location.
              </DialogDescription>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Location Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="HQ Office" className="focus:ring-2 focus:ring-blue-500/20 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-semibold">Location Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v as LocationType})}>
                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 border-slate-200">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold">Full Address *</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="123 Business Way" className="focus:ring-2 focus:ring-blue-500/20 border-slate-200" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold">City *</Label>
                    <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="New York" className="focus:ring-2 focus:ring-blue-500/20 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-semibold">Country *</Label>
                    <Select value={formData.country} onValueChange={(v) => setFormData({...formData, country: v})}>
                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 border-slate-200">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countriesWithUsa.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
=======
    <>
      {/* Mobile-first container */}
      <div className="pl-12 space-y-4 sm:space-y-5 md:space-y-6 pr-2 sm:pr-0">
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
                    <Select
                      value={formData.country || undefined}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {countriesWithUsa.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                      placeholder="Enter city"
                      required
                    />
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
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as Location["type"] })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as Location["status"] })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
                      </SelectContent>
                    </Select>
                  </div>
                </div>

<<<<<<< HEAD
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-sm font-semibold">Contact Person</Label>
                    <Input id="contactName" value={formData.contactName} onChange={(e) => setFormData({...formData, contactName: e.target.value})} placeholder="John Doe" className="focus:ring-2 focus:ring-blue-500/20 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-sm font-semibold">Contact Phone</Label>
                    <Input id="contactPhone" value={formData.contactPhone} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} placeholder="+1 (555) 000-0000" className="focus:ring-2 focus:ring-blue-500/20 border-slate-200" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Photo</Label>
                  <div className="flex items-center gap-4">
                    {formData.photoDataUrl && (
                      <div className="h-16 w-16 rounded-lg border overflow-hidden">
                        <img src={formData.photoDataUrl} className="h-full w-full object-cover" alt="Preview" />
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('add-photo')?.click()} className="border-dashed border-2 hover:border-blue-400 hover:bg-blue-50 transition-all">
                      <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />
                      Upload Photo
                    </Button>
                    <input id="add-photo" type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => setFormData({...formData, photoDataUrl: re.target?.result as string, photoFileName: file.name});
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Business Units</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.businessUnits.map((u, i) => (
                        <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-slate-100 text-slate-700">
                          {u}
                          <button onClick={() => setFormData({...formData, businessUnits: formData.businessUnits.filter((_, idx) => idx !== i)})} className="hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                        <Input id="unit-input" placeholder="Enter unit and press Add" className="text-sm border-slate-200 focus:ring-2 focus:ring-blue-500/20" onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = e.currentTarget.value.trim();
                                if (val && !formData.businessUnits.includes(val)) {
                                    setFormData({...formData, businessUnits: [...formData.businessUnits, val]});
                                    e.currentTarget.value = '';
                                }
                            }
                        }} />
                        <Button type="button" onClick={() => {
                            const input = document.getElementById('unit-input') as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !formData.businessUnits.includes(val)) {
                                setFormData({...formData, businessUnits: [...formData.businessUnits, val]});
                                input.value = '';
                            }
                        }} className="bg-slate-800 hover:bg-slate-900 text-white shadow-md">Add</Button>
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">Notes</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Any additional information..." className="min-h-[100px] border-slate-200 focus:ring-2 focus:ring-blue-500/20" />
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 animate-shake">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-xs text-red-600 font-medium">{formError}</p>
                  </div>
                )}
                
                {submitSuccess && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 animate-bounce-subtle">
                    <Check className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-green-600 font-medium">Location added successfully!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3 border-t">
              <Button variant="outline" onClick={() => setAddLocationOpen(false)} className="border-0 shadow-none hover:bg-slate-100 font-medium text-slate-600 order-2 sm:order-1">Discard</Button>
              <Button onClick={handleAddLocation} disabled={submitLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-lg shadow-blue-500/20 font-bold order-1 sm:order-2">
                {submitLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Confirm & Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Sites", value: locationsList.length, icon: MapPin, color: "blue" },
          { label: "Offices", value: locationsList.filter(l => l.type === "Office").length, icon: Building2, color: "indigo" },
          { label: "Units", value: locationsList.filter(l => l.type === "Unit").length, icon: Home, color: "purple" },
          { label: "Active", value: locationsList.filter(l => l.status === "active").length, icon: Check, color: "emerald" }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-xl shadow-slate-200/50 bg-white dark:bg-slate-800 transition-all duration-300 hover:translate-y-[-4px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center bg-opacity-10", `bg-${stat.color}-500`)}>
                  <stat.icon className={cn("h-6 w-6", `text-${stat.color}-500`)} />
=======
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
                {/* Form Error Message */}
                {formError && (
                  <div className="rounded-md bg-destructive/10 p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-destructive">{formError}</p>
                  </div>
                )}

                {/* Success Message */}
                {submitSuccess && (
                  <div className="rounded-md bg-green-100 p-3 flex items-start gap-2 dark:bg-green-900/30">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5 dark:text-green-400" />
                    <p className="text-xs sm:text-sm text-green-800 dark:text-green-400">Location added successfully!</p>
                  </div>
                )}
              </form>

              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddLocationOpen(false);
                    setFormError(null);
                  }}
                  disabled={submitLoading}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLocation}
                  disabled={submitLoading}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto order-1 sm:order-2"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                      Add Location
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className="rounded-md bg-destructive/10 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-destructive break-words">
              {apiError.startsWith("<") ? "Server error: failed to load locations. The server may be temporarily unavailable (504 Gateway Timeout). Please try again later." : apiError}
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
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
                </div>
              </div>
            </CardContent>
          </Card>
<<<<<<< HEAD
        ))}
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-xl border-slate-100 bg-white dark:bg-slate-800 overflow-hidden rounded-2xl">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-blue-500" />
            Location Database
          </CardTitle>
          <div className="relative w-full sm:w-64 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sites..." 
              className="pl-9 h-10 bg-slate-50 border-0 focus:ring-2 focus:ring-blue-500/20 text-sm" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[100px] font-bold text-slate-600 uppercase text-[11px] tracking-wider">ID</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Site Name</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Type</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Contact</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Status</TableHead>
                  <TableHead className="text-right font-bold text-slate-600 uppercase text-[11px] tracking-wider">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 opacity-50 mb-2" />
                            <p className="text-slate-400 font-medium">Synchronizing database...</p>
                        </TableCell>
                    </TableRow>
                ) : filteredLocations.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                           No locations found matching your filter.
                        </TableCell>
                    </TableRow>
                ) : filteredLocations.map((location) => (
                  <TableRow key={location.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="font-mono text-xs text-slate-400">
                      {locationCodeById.get(location.id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50 flex items-center justify-center">
                          {location.photoDataUrl ? (
                            <img src={location.photoDataUrl} alt={location.name} className="h-full w-full object-cover" />
                          ) : (
                            <MapPin className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white text-sm sm:text-base truncate">{location.name}</p>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                            <Home className="h-2.5 w-2.5" />
                            {location.city}, {location.country}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(typeClasses[location.type], "border-0 shadow-none font-bold text-[10px] uppercase tracking-tighter px-2")}>
                        {location.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{location.contactName || "—"}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="h-2 w-2" />
                          {location.contactPhone || "No direct line"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusClasses[location.status], "border-0 shadow-none font-bold text-[10px] uppercase")}>
                        {location.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-100 shadow-xl p-1">
                          <DropdownMenuItem onClick={() => handleViewDetails(location)} className="rounded-lg gap-2 cursor-pointer focus:bg-blue-50 focus:text-blue-600">
                             <Eye className="h-4 w-4" /> View Info
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditLocation(location)} className="rounded-lg gap-2 cursor-pointer focus:bg-amber-50 focus:text-amber-600">
                             <Edit className="h-4 w-4" /> Edit Record
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeactivateConfirm(location)} className="rounded-lg gap-2 cursor-pointer focus:bg-red-50 focus:text-red-600 text-red-600 font-medium">
                             <X className="h-4 w-4" /> {location.status === 'active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden rounded-xl border-0 shadow-2xl max-h-[90vh] flex flex-col">
          <div className="bg-slate-900 p-6 text-white relative">
            <div className="flex items-center gap-4">
               <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  {selectedLocation?.photoDataUrl ? (
                      <img src={selectedLocation.photoDataUrl} className="h-full w-full object-cover rounded-xl" alt="Location" />
                  ) : <MapPin className="h-8 w-8 text-blue-400" />}
               </div>
               <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{selectedLocation?.name}</h2>
                  <p className="text-blue-300 text-sm font-medium flex items-center gap-1">
                    <Badge variant="outline" className="text-blue-300 border-blue-400/30 font-bold uppercase text-[10px] bg-blue-400/10">
                        {selectedLocation?.type}
                    </Badge>
                    <span className="opacity-50">•</span>
                    {locationCodeById.get(selectedLocation?.id || '')}
                  </p>
               </div>
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="col-span-2 rounded-xl bg-slate-50 p-4 border border-slate-100 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Site Address</p>
                     <p className="text-slate-700 font-medium leading-relaxed">
                        {selectedLocation?.address},<br/>
                        {selectedLocation?.city}, {selectedLocation?.country}
                     </p>
                  </div>
               </div>

               <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Person</p>
                  <p className="text-slate-800 font-semibold text-lg">{selectedLocation?.contactName || "None Assigned"}</p>
               </div>
               
               <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Phone</p>
                  <p className="text-slate-800 font-semibold text-lg">{selectedLocation?.contactPhone || "No Line"}</p>
               </div>

               <div className="col-span-2 space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Units</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation?.businessUnits?.length ? selectedLocation.businessUnits.map((u, i) => (
                      <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 px-3 py-1">
                        {u}
                      </Badge>
                    )) : <p className="text-slate-300 italic text-sm">No business units defined</p>}
                  </div>
               </div>

               {selectedLocation?.notes && (
                 <div className="col-span-2 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Notes</p>
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-amber-900 text-sm italic leading-relaxed">
                        "{selectedLocation.notes}"
                    </div>
                 </div>
               )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t flex justify-end">
             <Button onClick={() => setViewDetailsOpen(false)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-10">Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editLocationOpen} onOpenChange={setEditLocationOpen}>
        <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden rounded-xl border-0 shadow-2xl max-h-[90vh] flex flex-col">
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold">Edit Location Record</DialogTitle>
            <Badge className={cn(statusClasses[editFormData.status], "font-bold uppercase")}>
                {editFormData.status}
            </Badge>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Location Name *</Label>
                  <Input value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Location Type</Label>
                  <Select value={editFormData.type} onValueChange={(v) => setEditFormData({...editFormData, type: v as LocationType})}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Full Address *</Label>
                <Input value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} className="border-slate-200" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">City *</Label>
                  <Input value={editFormData.city} onChange={(e) => setEditFormData({...editFormData, city: e.target.value})} className="border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Country *</Label>
                  <Select value={editFormData.country} onValueChange={(v) => setEditFormData({...editFormData, country: v})}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countriesWithUsa.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Contact Person</Label>
                  <Input value={editFormData.contactName} onChange={(e) => setEditFormData({...editFormData, contactName: e.target.value})} className="border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Contact Phone</Label>
                  <Input value={editFormData.contactPhone} onChange={(e) => setEditFormData({...editFormData, contactPhone: e.target.value})} className="border-slate-200" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Photo</Label>
                <div className="flex items-center gap-4">
                  {editFormData.photoDataUrl && (
                    <div className="h-16 w-16 rounded-xl border overflow-hidden shadow-sm">
                      <img src={editFormData.photoDataUrl} className="h-full w-full object-cover" alt="Preview" />
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('edit-photo')?.click()} className="border-slate-200 font-semibold">
                    Change Image
                  </Button>
                  <input id="edit-photo" type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (re) => setEditFormData({...editFormData, photoDataUrl: re.target?.result as string, photoFileName: file.name});
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Status Override</Label>
                <Select value={editFormData.status} onValueChange={(v) => setEditFormData({...editFormData, status: v as Location["status"]})}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Operational (Active)</SelectItem>
                    <SelectItem value="inactive">Shutdown (Inactive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Internal Notes</Label>
                <Textarea value={editFormData.notes} onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})} className="min-h-[100px] border-slate-200" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row justify-end gap-3">
             <Button variant="outline" onClick={() => setEditLocationOpen(false)} className="font-semibold text-slate-500 border-0 hover:bg-slate-100 order-2 sm:order-1">Cancel Changes</Button>
             <Button onClick={saveEditLocation} disabled={submitLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-500/30 order-1 sm:order-2">
               {submitLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
               Update Record
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate Modal */}
      <Dialog open={deactivateConfirmOpen} onOpenChange={setDeactivateConfirmOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <div className="p-8 text-center">
            <div className="h-20 w-20 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-6">
               <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Change Site Status?</h3>
            <p className="text-slate-500 mb-2">You are about to modify the operational status of:</p>
            <p className="text-slate-900 font-extrabold text-lg p-3 bg-slate-50 rounded-xl border border-slate-100 mb-6">{selectedLocation?.name}</p>
            
            <div className="flex flex-col gap-3">
               <Button onClick={confirmToggleActive} variant="destructive" className="h-12 text-base font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all">
                  Confirm Status Change
               </Button>
               <Button onClick={() => setDeactivateConfirmOpen(false)} variant="ghost" className="h-12 text-slate-500 font-semibold hover:bg-slate-50">
                  Cancel
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Locations;
=======

          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Office</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {locationsList.filter((l) => l.type === "Office").length}
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
                  <p className="text-xs sm:text-sm text-muted-foreground">Unit</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {locationsList.filter((l) => l.type === "Unit").length}
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
                  <p className="text-xs sm:text-sm text-muted-foreground">Warehouse</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {locationsList.filter((l) => l.type === "Warehouse").length}
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
                          <LocationPhoto locationId={location.id} alt={location.name} containerClassName="h-10 w-10 rounded-lg" iconClassName="h-5 w-5 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{location.name}</p>
                            <p className="text-xs text-muted-foreground">{locationCodeById.get(location.id) || "—"}</p>
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
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
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
                        <TableHead className="text-xs md:text-sm w-[10%]">Code</TableHead>
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
                          <TableCell className="text-muted-foreground text-xs md:text-sm">
                            {locationCodeById.get(location.id) || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              <LocationPhoto locationId={location.id} alt={location.name} containerClassName="h-8 w-8 rounded" iconClassName="h-4 w-4 text-muted-foreground" />
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
                              <span className="truncate max-w-[200px] lg:max-w-[250px] inline-block">
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
                  <LocationPhoto locationId={selectedLocation.id} alt={selectedLocation.name} containerClassName="h-16 w-16 sm:h-20 sm:w-20 rounded-lg" iconClassName="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  <div>
                    <p className="text-base sm:text-lg font-semibold break-words">{selectedLocation.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{locationCodeById.get(selectedLocation.id) || "—"}</p>
                    <p className="text-xs text-muted-foreground">{toDateOnly(selectedLocation.createdAt || "") || "—"}</p>
                  </div>
                </div>
                <Badge
                  className={`${statusClasses[selectedLocation.status]} text-xs sm:text-sm self-start sm:self-center`}
                  variant="secondary"
                >
                  {selectedLocation.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">Type</label>
                  <div>
                    <Badge
                      className={`${typeClasses[selectedLocation.type]} text-xs sm:text-sm`}
                      variant="secondary"
                    >
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
                  <Select
                    value={editFormData.country || undefined}
                    onValueChange={(value) => setEditFormData({ ...editFormData, country: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {countriesWithUsa.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">City *</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    placeholder="Enter city"
                    required
                  />
                </div>
              </div>

              {/* Type & Status */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Type</label>
                  <Select
                    value={editFormData.type}
                    onValueChange={(value) => setEditFormData({ ...editFormData, type: value as Location["type"] })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value as Location["status"] })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
                {locationCodeById.get(selectedLocation.id) || selectedLocation.id}
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
    </>
  );
};

export default Locations;
>>>>>>> 0f95b09cffeef036d647e3e7c9107418d2c97081
