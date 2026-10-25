import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Flame,
  Shield,
  HeartPulse,
  Building2,
  Zap,
  Lock,
  Landmark,
  Wrench,
  Truck,
  AlertTriangle,
  PhoneCall,
  Search,
  Filter,
  Plus,
  MapPin,
  Globe,
  Clock,
  User,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  MoreVertical,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  X,
  FileText,
  ChevronRight,
  Radio,
  PhoneForwarded,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Label } from "@/components/admin/ui/label";
import { Textarea } from "@/components/admin/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/admin/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { apiFetch, listResource } from "@/lib/admin/apiClient";
import { cn } from "@/lib/utils";

export const CATEGORIES = [
  "Fire Brigade",
  "Police",
  "Medical / Ambulance",
  "Hospital",
  "Security",
  "Utility",
  "Municipal / Government",
  "Maintenance / Contractor",
  "Tow / Roadside",
  "Emergency Management",
  "Other",
] as const;

export type PhoneCategory = (typeof CATEGORIES)[number];

export interface LocationItem {
  id: string;
  _id?: string;
  name: string;
  city: string;
  address?: string;
  country?: string;
  type?: string;
  phone?: string;
}

export interface PhoneContact {
  id: string;
  _id?: string;
  name: string;
  category: PhoneCategory;
  phoneNumber: string;
  secondaryPhone?: string;
  extension?: string;
  contactPerson?: string;
  email?: string;
  address?: string;
  locationId?: string | null;
  locationName?: string;
  location?: LocationItem | null;
  isAllLocations: boolean;
  priority: "emergency" | "high" | "standard";
  status: "active" | "inactive";
  operatingHours?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FormState {
  name: string;
  category: PhoneCategory;
  phoneNumber: string;
  secondaryPhone: string;
  extension: string;
  contactPerson: string;
  email: string;
  address: string;
  locationId: string;
  isAllLocations: boolean;
  priority: "emergency" | "high" | "standard";
  status: "active" | "inactive";
  operatingHours: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  category: "Police",
  phoneNumber: "",
  secondaryPhone: "",
  extension: "",
  contactPerson: "",
  email: "",
  address: "",
  locationId: "all_locations",
  isAllLocations: true,
  priority: "standard",
  status: "active",
  operatingHours: "24/7",
  notes: "",
};

// Styling and icons for categories
export function getCategoryMeta(category: string) {
  switch (category) {
    case "Fire Brigade":
      return {
        icon: Flame,
        color: "text-rose-500 dark:text-rose-400",
        bg: "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/20 text-rose-700 dark:text-rose-300",
        badge: "bg-rose-500 text-white dark:bg-rose-600",
        gradient: "from-rose-500/10 via-orange-500/5 to-transparent",
        accent: "border-l-rose-500",
      };
    case "Police":
      return {
        icon: Shield,
        color: "text-blue-500 dark:text-blue-400",
        bg: "bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/20 text-blue-700 dark:text-blue-300",
        badge: "bg-blue-500 text-white dark:bg-blue-600",
        gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
        accent: "border-l-blue-500",
      };
    case "Medical / Ambulance":
      return {
        icon: HeartPulse,
        color: "text-red-500 dark:text-red-400",
        bg: "bg-red-500/10 dark:bg-red-950/40 border-red-500/20 text-red-700 dark:text-red-300",
        badge: "bg-red-500 text-white dark:bg-red-600",
        gradient: "from-red-500/10 via-pink-500/5 to-transparent",
        accent: "border-l-red-500",
      };
    case "Hospital":
      return {
        icon: Building2,
        color: "text-emerald-500 dark:text-emerald-400",
        bg: "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
        badge: "bg-emerald-500 text-white dark:bg-emerald-600",
        gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
        accent: "border-l-emerald-500",
      };
    case "Security":
      return {
        icon: Lock,
        color: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/20 text-amber-700 dark:text-amber-300",
        badge: "bg-amber-500 text-white dark:bg-amber-600",
        gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
        accent: "border-l-amber-500",
      };
    case "Utility":
      return {
        icon: Zap,
        color: "text-cyan-500 dark:text-cyan-400",
        bg: "bg-cyan-500/10 dark:bg-cyan-950/40 border-cyan-500/20 text-cyan-700 dark:text-cyan-300",
        badge: "bg-cyan-500 text-white dark:bg-cyan-600",
        gradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
        accent: "border-l-cyan-500",
      };
    case "Municipal / Government":
      return {
        icon: Landmark,
        color: "text-purple-500 dark:text-purple-400",
        bg: "bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/20 text-purple-700 dark:text-purple-300",
        badge: "bg-purple-500 text-white dark:bg-purple-600",
        gradient: "from-purple-500/10 via-violet-500/5 to-transparent",
        accent: "border-l-purple-500",
      };
    case "Maintenance / Contractor":
      return {
        icon: Wrench,
        color: "text-orange-500 dark:text-orange-400",
        bg: "bg-orange-500/10 dark:bg-orange-950/40 border-orange-500/20 text-orange-700 dark:text-orange-300",
        badge: "bg-orange-500 text-white dark:bg-orange-600",
        gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
        accent: "border-l-orange-500",
      };
    case "Tow / Roadside":
      return {
        icon: Truck,
        color: "text-zinc-500 dark:text-zinc-400",
        bg: "bg-zinc-500/10 dark:bg-zinc-950/40 border-zinc-500/20 text-zinc-700 dark:text-zinc-300",
        badge: "bg-zinc-600 text-white",
        gradient: "from-zinc-500/10 via-slate-500/5 to-transparent",
        accent: "border-l-zinc-500",
      };
    case "Emergency Management":
      return {
        icon: AlertTriangle,
        color: "text-crimson-500 text-red-600 dark:text-red-400",
        bg: "bg-red-500/15 dark:bg-red-950/50 border-red-500/30 text-red-700 dark:text-red-300",
        badge: "bg-red-600 text-white",
        gradient: "from-red-600/15 via-orange-600/10 to-transparent",
        accent: "border-l-red-600",
      };
    default:
      return {
        icon: PhoneCall,
        color: "text-indigo-500 dark:text-indigo-400",
        bg: "bg-indigo-500/10 dark:bg-indigo-950/40 border-indigo-500/20 text-indigo-700 dark:text-indigo-300",
        badge: "bg-indigo-500 text-white dark:bg-indigo-600",
        gradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
        accent: "border-l-indigo-500",
      };
  }
}

export default function PhoneDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters (as requested: Location, Name, Number)
  const [nameFilter, setNameFilter] = useState<string>("");
  const [numberFilter, setNumberFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>(
    searchParams.get("locationId") || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<PhoneContact | null>(null);
  const [deletingContact, setDeletingContact] = useState<PhoneContact | null>(null);
  const [viewingContact, setViewingContact] = useState<PhoneContact | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync URL search params with location filter
  useEffect(() => {
    const locParam = searchParams.get("locationId");
    if (locParam && locParam !== locationFilter) {
      setLocationFilter(locParam);
    }
  }, [searchParams]);

  // Load locations from /api/locations
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await listResource<any>("locations");
        const normalized: LocationItem[] = (res || []).map((l: any) => ({
          id: String(l.id || l._id || ""),
          name: String(l.name || "Unnamed Location"),
          city: String(l.city || ""),
          address: String(l.address || ""),
          country: String(l.country || ""),
          type: String(l.type || "site"),
          phone: String(l.phone || l.contactPhone || ""),
        }));
        setLocations(normalized);
      } catch (err) {
        console.error("Failed to load locations:", err);
      }
    }
    void fetchLocations();
  }, []);

  // Fetch phone directory contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ items: PhoneContact[] }>("/api/phone-directory");
      setContacts(res.items || []);
    } catch (err) {
      console.error("Failed to load phone directory contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchContacts();
  }, []);

  // Copy number to clipboard helper
  const handleCopy = (phone: string, id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Seed default emergency templates
  const handleSeedDefaults = async () => {
    try {
      setSaving(true);
      await apiFetch("/api/phone-directory/seed-defaults", { method: "POST" });
      await fetchContacts();
    } catch (err) {
      console.error("Failed to seed defaults:", err);
    } finally {
      setSaving(false);
    }
  };

  // Open Add Dialog
  const openAddModal = (prefillLocationId?: string) => {
    setEditingContact(null);
    setFormError(null);
    if (prefillLocationId && prefillLocationId !== "all") {
      setFormData({
        ...INITIAL_FORM,
        locationId: prefillLocationId,
        isAllLocations: false,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setIsAddOpen(true);
  };

  // Open Edit Dialog
  const openEditModal = (contact: PhoneContact, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingContact(contact);
    setFormError(null);
    setFormData({
      name: contact.name,
      category: contact.category,
      phoneNumber: contact.phoneNumber,
      secondaryPhone: contact.secondaryPhone || "",
      extension: contact.extension || "",
      contactPerson: contact.contactPerson || "",
      email: contact.email || "",
      address: contact.address || "",
      locationId: contact.isAllLocations
        ? "all_locations"
        : String(contact.locationId || (contact.location ? contact.location.id : "") || ""),
      isAllLocations: contact.isAllLocations,
      priority: contact.priority || "standard",
      status: contact.status || "active",
      operatingHours: contact.operatingHours || "24/7",
      notes: contact.notes || "",
    });
    setIsAddOpen(true);
  };

  // Save (Create or Update)
  const handleSaveContact = async () => {
    if (!formData.name.trim()) {
      setFormError("Name / Department is required");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setFormError("Phone Number is required");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const isAll = formData.isAllLocations || formData.locationId === "all_locations";
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        phoneNumber: formData.phoneNumber.trim(),
        secondaryPhone: formData.secondaryPhone.trim(),
        extension: formData.extension.trim(),
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        locationId: isAll ? null : formData.locationId || null,
        isAllLocations: isAll,
        priority: formData.priority,
        status: formData.status,
        operatingHours: formData.operatingHours.trim() || "24/7",
        notes: formData.notes.trim(),
      };

      if (editingContact) {
        await apiFetch(`/api/phone-directory/${editingContact.id || editingContact._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/phone-directory", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setIsAddOpen(false);
      setEditingContact(null);
      await fetchContacts();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDeleteContact = async () => {
    if (!deletingContact) return;
    try {
      setSaving(true);
      await apiFetch(`/api/phone-directory/${deletingContact.id || deletingContact._id}`, {
        method: "DELETE",
      });
      setDeletingContact(null);
      await fetchContacts();
    } catch (err) {
      console.error("Failed to delete contact:", err);
    } finally {
      setSaving(false);
    }
  };

  // Reset all filters
  const handleClearFilters = () => {
    setNameFilter("");
    setNumberFilter("");
    setLocationFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Filter contacts based on: Name, Phone Number, Location, Category, Priority
  const filteredContacts = useMemo(() => {
    return contacts.filter((item) => {
      // 1. Name Filter
      if (nameFilter.trim()) {
        const query = nameFilter.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesContact = (item.contactPerson || "").toLowerCase().includes(query);
        if (!matchesName && !matchesContact) return false;
      }

      // 2. Phone Number Filter
      if (numberFilter.trim()) {
        const query = numberFilter.trim().replace(/[^\d+]/g, "");
        const rawQuery = numberFilter.toLowerCase().trim();
        const mainDigits = (item.phoneNumber || "").replace(/[^\d+]/g, "");
        const secDigits = (item.secondaryPhone || "").replace(/[^\d+]/g, "");
        const ext = (item.extension || "").toLowerCase();

        const matchDigits =
          query.length > 0 && (mainDigits.includes(query) || secDigits.includes(query));
        const matchRaw =
          item.phoneNumber.toLowerCase().includes(rawQuery) ||
          (item.secondaryPhone || "").toLowerCase().includes(rawQuery) ||
          ext.includes(rawQuery);

        if (!matchDigits && !matchRaw) return false;
      }

      // 3. Location Filter
      if (locationFilter !== "all") {
        if (locationFilter === "all_locations" || locationFilter === "global") {
          if (!item.isAllLocations) return false;
        } else {
          // Specific location ID
          const contactLocId = String(
            item.locationId || (item.location ? item.location.id || item.location._id : "")
          );
          const isDirectMatch = contactLocId === locationFilter;
          const isGlobal = item.isAllLocations;
          // Match if attached to this specific location or universal to all
          if (!isDirectMatch && !isGlobal) return false;
        }
      }

      // 4. Category Filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // 5. Priority Filter
      if (priorityFilter !== "all" && item.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [contacts, nameFilter, numberFilter, locationFilter, categoryFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = contacts.length;
    const emergency = contacts.filter((c) => c.priority === "emergency").length;
    const policeFire = contacts.filter(
      (c) => c.category === "Police" || c.category === "Fire Brigade"
    ).length;
    const uniqueLocations = new Set(
      contacts.filter((c) => c.locationId).map((c) => String(c.locationId))
    ).size;
    return { total, emergency, policeFire, uniqueLocations };
  }, [contacts]);

  const hasActiveFilters =
    nameFilter !== "" ||
    numberFilter !== "" ||
    locationFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all";

  return (
    <div className="min-h-screen bg-slate-950/20 dark:bg-background text-foreground p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Phone Directory
              </h1>
              <p className="text-sm text-muted-foreground">
                Emergency services (Fire Brigade, Police, Hospital), utilities & location-linked contacts
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {contacts.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={saving}
              className="border-dashed border-primary/40 hover:border-primary text-xs flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Seed Emergency Templates
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchContacts}
            disabled={loading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => openAddModal(locationFilter !== "all" ? locationFilter : undefined)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Phone Number
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Contacts</p>
              <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Police & Fire</p>
              <p className="text-xl md:text-2xl font-bold text-rose-500">{stats.policeFire}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Emergency Lines</p>
              <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">{stats.emergency}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Locations Covered</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.uniqueLocations} / {locations.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Filter Bar (Location, Name, Number, Category) */}
      <Card className="border-border/60 bg-card/80 backdrop-blur shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold tracking-wide uppercase">
                Search & Filters
              </CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs font-mono px-1.5 py-0">
                  Filters Active
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </Button>
              )}

              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-7 px-2.5 text-xs rounded-md"
                  title="Card View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-7 px-2.5 text-xs rounded-md"
                  title="Table View"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Filter by Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" />
                Filter by Name
              </Label>
              <div className="relative">
                <Input
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="e.g. Police, Fire Brigade, St. Jude..."
                  className="h-9 pl-8 text-xs bg-background/50"
                />
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-3 text-muted-foreground pointer-events-none" />
                {nameFilter && (
                  <button
                    onClick={() => setNameFilter("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Filter by Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" />
                Filter by Phone Number
              </Label>
              <div className="relative">
                <Input
                  value={numberFilter}
                  onChange={(e) => setNumberFilter(e.target.value)}
                  placeholder="e.g. 911, 555-0199, 102..."
                  className="h-9 pl-8 text-xs bg-background/50 font-mono"
                />
                <Phone className="h-3.5 w-3.5 absolute left-2.5 top-3 text-muted-foreground pointer-events-none" />
                {numberFilter && (
                  <button
                    onClick={() => setNumberFilter("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Filter by Location (saved in Locations page) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Filter by Location
              </Label>
              <Select
                value={locationFilter}
                onValueChange={(val) => {
                  setLocationFilter(val);
                  const p = new URLSearchParams(searchParams);
                  if (val === "all") p.delete("locationId");
                  else p.set("locationId", val);
                  setSearchParams(p, { replace: true });
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background/50">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all" className="text-xs font-medium">
                    🌐 All Locations & Global
                  </SelectItem>
                  <SelectItem value="all_locations" className="text-xs font-medium">
                    ⭐ Universal / Company-wide Only
                  </SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id} className="text-xs">
                      📍 {loc.name} {loc.city ? `(${loc.city})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
            <span className="text-xs font-medium text-muted-foreground mr-1">Category:</span>
            <button
              onClick={() => setCategoryFilter("all")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full font-medium transition-all",
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const meta = getCategoryMeta(cat);
              const Icon = meta.icon;
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(isSelected ? "all" : cat)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-full font-medium flex items-center gap-1.5 transition-all border",
                    isSelected
                      ? cn("shadow-sm font-semibold", meta.bg, "border-current")
                      : "bg-background/60 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className={cn("h-3 w-3", meta.color)} />
                  {cat}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact Content: Grid or Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Loading phone directory...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60 bg-muted/10 p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">No contacts found</h3>
            <p className="text-xs text-muted-foreground">
              {hasActiveFilters
                ? "No directory entries match your current filters. Try resetting the filters."
                : "No phone directory entries have been created yet. Add your first emergency or utility contact."}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs">
                  Clear Filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => openAddModal()} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add First Contact
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredContacts.map((contact) => {
              const meta = getCategoryMeta(contact.category);
              const CategoryIcon = meta.icon;
              const isEmergency = contact.priority === "emergency";
              const isCopied = copiedId === (contact.id || contact._id);

              return (
                <motion.div
                  key={contact.id || contact._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card
                    onClick={() => setViewingContact(contact)}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden border border-border/60 bg-card/90 hover:bg-card hover:shadow-lg hover:border-primary/40 transition-all duration-200",
                      meta.accent,
                      "border-l-4"
                    )}
                  >
                    {/* Background glow gradient */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity",
                        meta.gradient
                      )}
                    />

                    <CardContent className="p-4 space-y-3 relative z-10">
                      {/* Card Header: Category & Priority */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                            meta.bg
                          )}
                        >
                          <CategoryIcon className={cn("h-3 w-3", meta.color)} />
                          {contact.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isEmergency && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Emergency
                            </span>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-60 group-hover:opacity-100 hover:bg-muted"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingContact(contact);
                                }}
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => openEditModal(contact, e)}>
                                <Edit2 className="h-3.5 w-3.5 mr-2" />
                                Edit Contact
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingContact(contact);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Contact Name & Liaison */}
                      <div>
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {contact.name}
                        </h3>
                        {contact.contactPerson && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3 text-primary/70" />
                            {contact.contactPerson}
                          </p>
                        )}
                      </div>

                      {/* Primary Phone Box */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg bg-muted/50 p-2.5 flex items-center justify-between border border-border/50 group-hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", meta.bg)}>
                            <Phone className={cn("h-3.5 w-3.5", meta.color)} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono text-sm font-bold tracking-tight text-foreground block truncate">
                              {contact.phoneNumber}
                            </span>
                            {contact.extension && (
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                Ext: {contact.extension}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleCopy(contact.phoneNumber, contact.id || contact._id, e)}
                            className="h-7 w-7 p-0 hover:bg-background"
                            title="Copy Phone Number"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </Button>

                          <a
                            href={`tel:${contact.phoneNumber.replace(/[^\d+]/g, "")}`}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all shadow-sm",
                              isEmergency
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground"
                            )}
                          >
                            <PhoneCall className="h-3 w-3" />
                            Call
                          </a>
                        </div>
                      </div>

                      {/* Attached Location Pill */}
                      <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground border-t border-border/30">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {contact.isAllLocations ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <Globe className="h-3 w-3 shrink-0" />
                              All Locations (Universal)
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (contact.locationId) {
                                  navigate(`/admin/locations?view=${contact.locationId}`);
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[200px]"
                              title="Click to view this location in Locations page"
                            >
                              <MapPin className="h-3 w-3 shrink-0 text-primary" />
                              <span className="truncate">
                                {contact.location?.name || contact.locationName || "Attached Location"}
                              </span>
                            </button>
                          )}
                        </div>

                        {contact.operatingHours && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            {contact.operatingHours}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="border-border/60 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center text-xs">Type</TableHead>
                <TableHead className="text-xs">Service / Contact Name</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs font-mono">Primary Phone</TableHead>
                <TableHead className="text-xs">Attached Location</TableHead>
                <TableHead className="text-xs">Contact Person</TableHead>
                <TableHead className="text-xs">Hours</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => {
                const meta = getCategoryMeta(contact.category);
                const CategoryIcon = meta.icon;
                const isEmergency = contact.priority === "emergency";
                const isCopied = copiedId === (contact.id || contact._id);

                return (
                  <TableRow
                    key={contact.id || contact._id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => setViewingContact(contact)}
                  >
                    <TableCell className="text-center">
                      <div className={cn("h-7 w-7 rounded-lg mx-auto flex items-center justify-center", meta.bg)}>
                        <CategoryIcon className={cn("h-3.5 w-3.5", meta.color)} />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {contact.name}
                        {isEmergency && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                            EMERGENCY
                          </Badge>
                        )}
                      </div>
                      {contact.notes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">{contact.notes}</p>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", meta.bg)}>
                        {contact.category}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                        <span>{contact.phoneNumber}</span>
                        {contact.extension && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            (x{contact.extension})
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {contact.isAllLocations ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <Globe className="h-3 w-3" />
                          All Locations
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-foreground font-medium">
                          <MapPin className="h-3 w-3 text-primary" />
                          {contact.location?.name || contact.locationName || "Specific Site"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {contact.contactPerson || "—"}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground font-mono text-[11px]">
                      {contact.operatingHours || "24/7"}
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(contact.phoneNumber, contact.id || contact._id)}
                          className="h-7 w-7 p-0"
                          title="Copy"
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>

                        <a
                          href={`tel:${contact.phoneNumber.replace(/[^\d+]/g, "")}`}
                          className="h-7 px-2 rounded bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1"
                        >
                          <PhoneCall className="h-3 w-3" />
                          Call
                        </a>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingContact(contact)}>
                              View Full Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(contact)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingContact(contact)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add / Edit Contact Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Phone className="h-4 w-4" />
              </div>
              {editingContact ? "Edit Directory Contact" : "Add Phone Directory Contact"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add emergency services (Police, Fire Brigade, Hospitals) or utilities linked to your saved locations.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3">
              {formError}
            </div>
          )}

          <div className="space-y-4 py-2">
            {/* Section 1: Name and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Name / Department <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. City Fire Brigade Station #4"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val: PhoneCategory) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {CATEGORIES.map((cat) => {
                      const meta = getCategoryMeta(cat);
                      const Icon = meta.icon;
                      return (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          <span className="flex items-center gap-2">
                            <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                            {cat}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section 2: Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">
                  Primary Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="e.g. 911 or (555) 019-9347"
                    className="h-9 pl-8 text-xs font-mono"
                  />
                  <Phone className="h-3.5 w-3.5 absolute left-2.5 top-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Extension</Label>
                <Input
                  value={formData.extension}
                  onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                  placeholder="e.g. 102"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Secondary / Dispatch Phone (Optional)</Label>
              <Input
                value={formData.secondaryPhone}
                onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                placeholder="e.g. (555) 019-9348"
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Section 3: ATTACH TO LOCATION (Key feature requested by user) */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label className="text-xs font-bold text-foreground">
                  Attach to Location (Saved in Location Page)
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Select which location this phone number is assigned to, or make it universal to all company sites.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAllLocations: true, locationId: "all_locations" })}
                  className={cn(
                    "p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all text-xs",
                    formData.isAllLocations || formData.locationId === "all_locations"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/60 bg-background/50 hover:bg-background"
                  )}
                >
                  <Globe className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    <span className="block font-medium">Universal / All Locations</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Applies to all sites (e.g. 911 or corporate dispatch)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isAllLocations: false,
                      locationId:
                        formData.locationId === "all_locations"
                          ? locations[0]?.id || ""
                          : formData.locationId,
                    })
                  }
                  className={cn(
                    "p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all text-xs",
                    !formData.isAllLocations && formData.locationId !== "all_locations"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/60 bg-background/50 hover:bg-background"
                  )}
                >
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                  <div>
                    <span className="block font-medium">Specific Saved Location</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Assigned to a specific facility/office
                    </span>
                  </div>
                </button>
              </div>

              {!formData.isAllLocations && formData.locationId !== "all_locations" && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold">Select Location</Label>
                  <Select
                    value={formData.locationId}
                    onValueChange={(val) => setFormData({ ...formData, locationId: val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue placeholder="Choose a saved location..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id} className="text-xs">
                          <span className="font-semibold">{loc.name}</span>
                          {loc.city && <span className="text-muted-foreground ml-1.5 font-normal">({loc.city})</span>}
                          {loc.address && <span className="text-muted-foreground/60 ml-1 text-[11px]">— {loc.address}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Section 4: Details & Officer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Contact Person / Officer in Charge</Label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Captain R. Gallagher"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Operating Hours</Label>
                <Input
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  placeholder="e.g. 24/7 or Mon-Fri 8am-5pm"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Address / Precinct / Station</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 450 Firehouse Way"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Priority Level</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: "emergency" | "high" | "standard") =>
                    setFormData({ ...formData, priority: val })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency" className="text-xs text-red-500 font-semibold">
                      🚨 Emergency (Police / Fire / Trauma)
                    </SelectItem>
                    <SelectItem value="high" className="text-xs text-amber-500 font-semibold">
                      ⚡ High Priority (Utilities / Security)
                    </SelectItem>
                    <SelectItem value="standard" className="text-xs">
                      📞 Standard (Municipal / Contractors)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes / Access Instructions / Protocols</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Direct station dispatch. For gate code, use #4521. Mention North Warehouse bay."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveContact}
              disabled={saving}
              className="bg-primary text-primary-foreground text-xs"
            >
              {saving ? "Saving..." : editingContact ? "Update Contact" : "Create Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Contact Details Modal */}
      <Dialog open={!!viewingContact} onOpenChange={(open) => !open && setViewingContact(null)}>
        <DialogContent className="max-w-lg">
          {viewingContact && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const meta = getCategoryMeta(viewingContact.category);
                      const Icon = meta.icon;
                      return (
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", meta.bg)}>
                          <Icon className={cn("h-5 w-5", meta.color)} />
                        </div>
                      );
                    })()}
                    <div>
                      <DialogTitle className="text-lg font-bold">{viewingContact.name}</DialogTitle>
                      <p className="text-xs text-muted-foreground">{viewingContact.category}</p>
                    </div>
                  </div>

                  {viewingContact.priority === "emergency" && (
                    <Badge variant="destructive" className="uppercase font-bold tracking-wider text-[10px]">
                      Emergency Line
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Main Dial Box */}
                <div className="rounded-xl bg-muted/60 p-4 border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                      Primary Dial
                    </span>
                    <span className="font-mono text-xl font-extrabold text-foreground tracking-tight">
                      {viewingContact.phoneNumber}
                    </span>
                    {viewingContact.extension && (
                      <span className="text-xs text-muted-foreground font-mono block">
                        Extension: {viewingContact.extension}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(viewingContact.phoneNumber, viewingContact.id || viewingContact._id)}
                      className="h-9 px-3 text-xs"
                    >
                      {copiedId === (viewingContact.id || viewingContact._id) ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          Copy
                        </>
                      )}
                    </Button>

                    <a
                      href={`tel:${viewingContact.phoneNumber.replace(/[^\d+]/g, "")}`}
                      className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5 shadow-md"
                    >
                      <PhoneCall className="h-4 w-4" />
                      Dial Now
                    </a>
                  </div>
                </div>

                {/* Secondary Phone */}
                {viewingContact.secondaryPhone && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/50">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                        Secondary / Dispatch Line
                      </span>
                      <span className="font-mono text-sm font-bold">{viewingContact.secondaryPhone}</span>
                    </div>
                    <a
                      href={`tel:${viewingContact.secondaryPhone.replace(/[^\d+]/g, "")}`}
                      className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                    >
                      <PhoneCall className="h-3 w-3" />
                      Call
                    </a>
                  </div>
                )}

                {/* Attached Location Details */}
                <div className="rounded-lg border border-border/60 p-3 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Attached Location
                    </span>
                    {viewingContact.locationId && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setViewingContact(null);
                          navigate(`/admin/locations?view=${viewingContact.locationId}`);
                        }}
                        className="h-auto p-0 text-xs text-primary font-semibold flex items-center gap-1"
                      >
                        Open in Locations Page
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {viewingContact.isAllLocations ? (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Globe className="h-4 w-4" />
                      <span>Universal to All Facilities and Locations</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-foreground">
                        {viewingContact.location?.name || viewingContact.locationName || "Specific Site"}
                      </p>
                      {viewingContact.location?.city && (
                        <p className="text-muted-foreground text-xs">
                          City: {viewingContact.location.city}
                          {viewingContact.location.address ? ` • ${viewingContact.location.address}` : ""}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2">
                  {viewingContact.contactPerson && (
                    <div className="p-2.5 rounded-lg border border-border/40 bg-muted/20">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                        Contact Person
                      </span>
                      <span className="font-medium text-foreground">{viewingContact.contactPerson}</span>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg border border-border/40 bg-muted/20">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                      Operating Hours
                    </span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {viewingContact.operatingHours || "24/7"}
                    </span>
                  </div>

                  {viewingContact.address && (
                    <div className="p-2.5 rounded-lg border border-border/40 bg-muted/20 col-span-2">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                        Station / Physical Address
                      </span>
                      <span className="font-medium text-foreground">{viewingContact.address}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {viewingContact.notes && (
                  <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                      Protocols & Instructions
                    </span>
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap">{viewingContact.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(viewingContact)}
                  className="text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Edit Contact
                </Button>
                <Button
                  size="sm"
                  onClick={() => setViewingContact(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Directory Contact?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to remove <strong>{deletingContact?.name}</strong> (
              {deletingContact?.phoneNumber}) from the phone directory? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              {saving ? "Deleting..." : "Delete Contact"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
