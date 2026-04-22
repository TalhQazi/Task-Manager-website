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
  Archive,
} from "lucide-react";
import { createResource, listResource, updateResource, apiFetch, getApiBaseUrl } from "@/lib/admin/apiClient";

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
  businessUnits?: string[];
  notes?: string;
  contactName: string;
  contactPhone: string;
  status: "active" | "inactive";
  createdAt?: string;
  photoDataUrl?: string;
  photoFileName?: string;
  attachments?: { fileName: string; url: string }[];
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
    businessUnits: Array.isArray(l.businessUnits) ? l.businessUnits : [],
    notes: String(l.notes || "").trim() || "",
    contactName: String(l.contactName || "").trim(),
    contactPhone: String(l.contactPhone || "").trim(),
    status: (String(l.status || "active") as Location["status"]) || "active",
    createdAt: createdAt ? toDateOnly(createdAt) : undefined,
    photoDataUrl: String(l.photoDataUrl || "").trim() || undefined,
    photoFileName: String(l.photoFileName || "").trim() || undefined,
    attachments: Array.isArray(l.attachments) ? l.attachments : [],
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
  inactive: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

const Locations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editLocationOpen, setEditLocationOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "USA",
    type: "Property" as Location["type"],
    businessUnits: [] as string[],
    notes: "",
    contactName: "",
    contactPhone: "",
    status: "active" as Location["status"],
    photoDataUrl: "",
    photoFileName: "",
    attachments: [] as { fileName: string; url: string }[],
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    type: "Property" as Location["type"],
    businessUnits: [] as string[],
    notes: "",
    contactName: "",
    contactPhone: "",
    status: "active" as Location["status"],
    photoDataUrl: "",
    photoFileName: "",
    attachments: [] as { fileName: string; url: string }[],
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

  const countriesWithUsa = useMemo(() => {
    if (!countries.includes("USA")) return ["USA", ...countries];
    return countries;
  }, [countries]);

  const refreshLocations = async () => {
    try {
      const list = await listResource<BackendLocation>("locations");
      setLocationsList(list.map(normalizeLocation));
      setRefreshTimestamp(Date.now());
    } catch (e) {
      console.error("Failed to refresh locations", e);
    }
  };

  const handleAddLocation = async () => {
    if (!formData.name || !formData.address || !formData.city || !formData.country) {
      setFormError("Please fill in all required fields: Name, Address, City, and Country");
      return;
    }
    try {
      setSubmitLoading(true);
      setFormError(null);
      const newLocation: Location = {
        id: nextLocationId(locationsList),
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        type: formData.type,
        businessUnits: formData.businessUnits,
        notes: formData.notes || "",
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        status: formData.status,
        createdAt: new Date().toISOString(),
        photoDataUrl: formData.photoDataUrl || undefined,
        photoFileName: formData.photoFileName || undefined,
        attachments: formData.attachments,
      };
      await createResource<Location>("locations", newLocation);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setAddLocationOpen(false);
      }, 1500);
      await refreshLocations();
      setFormData({
        name: "",
        address: "",
        city: "",
        country: "USA",
        type: "Property",
        businessUnits: [],
        notes: "",
        contactName: "",
        contactPhone: "",
        status: "active",
        photoDataUrl: "",
        photoFileName: "",
        attachments: [],
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to add location");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleViewDetails = async (location: Location) => {
    setSelectedLocation(location);
    setViewDetailsOpen(true);
    
    // Lazy load photo if needed
    if (!location.photoDataUrl) {
      try {
        const res = await apiFetch<{ photoDataUrl: string; photoFileName: string; attachments: { fileName: string; url: string }[] }>(`/api/locations/${location.id}/photo`);
        if (res.photoDataUrl || (res.attachments && res.attachments.length > 0)) {
          setSelectedLocation(prev => prev && prev.id === location.id ? { ...prev, photoDataUrl: res.photoDataUrl, photoFileName: res.photoFileName, attachments: res.attachments || [] } : prev);
        }
      } catch (err) {
        console.error("Failed to load location photo:", err);
      }
    }
  };

  const handleEditLocation = async (location: Location) => {
    setSelectedLocation(location);
    setEditFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      country: location.country,
      type: normalizeLocationType(location.type),
      businessUnits: location.businessUnits || [],
      notes: location.notes || "",
      contactName: location.contactName,
      contactPhone: location.contactPhone,
      status: location.status,
      photoDataUrl: location.photoDataUrl || "",
      photoFileName: location.photoFileName || "",
      attachments: location.attachments || [],
    });
    setEditLocationOpen(true);

    // Lazy load photo for editing if not present
    if (!location.photoDataUrl) {
      try {
        const res = await apiFetch<{ photoDataUrl: string; photoFileName: string; attachments: { fileName: string; url: string }[] }>(`/api/locations/${location.id}/photo`);
        if (res.photoDataUrl || (res.attachments && res.attachments.length > 0)) {
           setEditFormData(prev => ({ ...prev, photoDataUrl: res.photoDataUrl, photoFileName: res.photoFileName, attachments: res.attachments || [] }));
           setSelectedLocation(prev => prev && prev.id === location.id ? { ...prev, photoDataUrl: res.photoDataUrl, photoFileName: res.photoFileName, attachments: res.attachments || [] } : prev);
        }
      } catch (err) {
        console.error("Failed to load location photo for edit:", err);
      }
    }
  };

  const saveEditLocation = async () => {
    if (!selectedLocation) return;
    if (!editFormData.name || !editFormData.address || !editFormData.city || !editFormData.country) return;
    try {
      setSubmitLoading(true);
      await updateResource<Location>("locations", selectedLocation.id, {
        ...selectedLocation,
        name: editFormData.name,
        address: editFormData.address,
        city: editFormData.city,
        country: editFormData.country,
        type: editFormData.type,
        businessUnits: editFormData.businessUnits,
        contactName: editFormData.contactName,
        contactPhone: editFormData.contactPhone,
        status: editFormData.status,
        notes: editFormData.notes || "",
        photoDataUrl: editFormData.photoDataUrl || undefined,
        photoFileName: editFormData.photoFileName || undefined,
        attachments: editFormData.attachments,
      });
      await refreshLocations();
      setEditLocationOpen(false);
      setSelectedLocation(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update location");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeactivateConfirm = (location: Location) => {
    setSelectedLocation(location);
    setDeactivateConfirmOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!selectedLocation) return;
    try {
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
    const q = searchQuery.toLowerCase();
    const statusFilter = activeTab === "active" ? "active" : "inactive";
    
    return locationsList.filter((l) => 
      l.status === statusFilter && (
        l.name.toLowerCase().includes(q) || 
        l.address.toLowerCase().includes(q) || 
        l.city.toLowerCase().includes(q)
      )
    );
  }, [locationsList, searchQuery, activeTab]);

  const locationCodeById = useMemo(() => {
    const map = new Map<string, string>();
    locationsList.forEach((l, idx) => {
      map.set(l.id, `LOC-${String(idx + 1).padStart(3, "0")}`);
    });
    return map;
  }, [locationsList]);

  return (
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                  <Label className="text-sm font-semibold">Multiple Photos</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.attachments.map((att, i) => (
                      <div key={i} className="relative h-16 w-16 border rounded overflow-hidden group">
                        <img src={att.url} className="h-full w-full object-cover" alt={`Attachment ${i + 1}`} />
                        <button onClick={() => setFormData({...formData, attachments: formData.attachments.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('add-multiple-photos')?.click()} className="h-16 w-16 border-dashed border-2 hover:border-blue-400 hover:bg-blue-50 transition-all p-0 flex flex-col items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-blue-500 mb-1" />
                      <span className="text-[10px]">Add Photo</span>
                    </Button>
                    <input id="add-multiple-photos" type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          setFormData(prev => ({
                            ...prev, 
                            attachments: [...prev.attachments, { fileName: file.name, url: re.target?.result as string }]
                          }));
                        };
                        reader.readAsDataURL(file);
                      });
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-xl border-slate-100 bg-white dark:bg-slate-800 overflow-hidden rounded-2xl">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-blue-500" />
              Location Database
            </CardTitle>
            
            <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab("active")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                  activeTab === "active" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                  activeTab === "archived" ? "bg-white text-slate-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Archived
              </button>
            </div>
          </div>
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
                          <img 
                            src={`${String(getApiBaseUrl()).replace(/\/$/, "")}/api/locations/${location.id}/render-photo?v=${refreshTimestamp}`} 
                            alt={location.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // If image fails to load, replace with MapPin
                              (e.target as HTMLImageElement).style.display = "none";
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent && !parent.querySelector(".fallback-pin")) {
                                const pin = document.createElement("div");
                                pin.className = "fallback-pin text-slate-300";
                                pin.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
                                parent.appendChild(pin);
                              }
                            }}
                          />
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
                        {location.status === "active" ? "Active" : "Archived"}
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
                             <Archive className="h-4 w-4" /> {location.status === 'active' ? 'Archive Location' : 'Restore Location'}
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

               {selectedLocation?.attachments && selectedLocation.attachments.length > 0 && (
                 <div className="col-span-2 pt-4 border-t border-slate-100">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Site Photos ({selectedLocation.attachments.length})</p>
                   <div className="grid grid-cols-2 gap-3">
                     {selectedLocation.attachments.map((att, i) => (
                       <div key={i} className="rounded-xl overflow-hidden border border-slate-100 shadow-sm aspect-video">
                         <img src={att.url} className="h-full w-full object-cover" alt={`Site ${i + 1}`} />
                       </div>
                     ))}
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
                <Label className="text-sm font-semibold">Site Photos</Label>
                <div className="flex flex-wrap gap-2">
                  {editFormData.attachments.map((att, i) => (
                    <div key={i} className="relative h-16 w-16 border rounded-xl overflow-hidden group shadow-sm">
                      <img src={att.url} className="h-full w-full object-cover" alt={`Attachment ${i + 1}`} />
                      <button onClick={() => setEditFormData({...editFormData, attachments: editFormData.attachments.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('edit-multiple-photos')?.click()} className="h-16 w-16 border-dashed border-2 hover:border-blue-400 hover:bg-blue-50 transition-all p-0 flex flex-col items-center justify-center rounded-xl">
                    <ImageIcon className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="text-[10px]">Add Photo</span>
                  </Button>
                  <input id="edit-multiple-photos" type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = (re) => {
                        setEditFormData(prev => ({
                          ...prev, 
                          attachments: [...prev.attachments, { fileName: file.name, url: re.target?.result as string }]
                        }));
                      };
                      reader.readAsDataURL(file);
                    });
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

      {/* Archive Modal */}
      <Dialog open={deactivateConfirmOpen} onOpenChange={setDeactivateConfirmOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <div className="p-8 text-center">
            <div className={cn(
              "h-20 w-20 rounded-full mx-auto flex items-center justify-center mb-6",
              selectedLocation?.status === 'active' ? "bg-amber-100" : "bg-blue-100"
            )}>
               <Archive className={cn("h-10 w-10", selectedLocation?.status === 'active' ? "text-amber-600" : "text-blue-600")} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              {selectedLocation?.status === 'active' ? 'Archive Site?' : 'Restore Site?'}
            </h3>
            <p className="text-slate-500 mb-2">
              {selectedLocation?.status === 'active' 
                ? 'This site will be moved to the archives and hidden from the active database.' 
                : 'This site will be restored to the operational database.'}
            </p>
            <p className="text-slate-900 font-extrabold text-lg p-3 bg-slate-50 rounded-xl border border-slate-100 mb-6">{selectedLocation?.name}</p>
            
            <div className="flex flex-col gap-3">
               <Button 
                onClick={confirmToggleActive} 
                className={cn(
                  "h-12 text-base font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-white",
                  selectedLocation?.status === 'active' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                )}
               >
                  {selectedLocation?.status === 'active' ? 'Archive Location' : 'Restore Location'}
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
