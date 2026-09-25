import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Input } from "@/components/manger/ui/input";
import { Badge } from "@/components/manger/ui/badge";
import { Button } from "@/components/manger/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/manger/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/manger/ui/select";
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Building,
  CheckCircle,
  XCircle,
  Users,
  Contact,
  Globe,
  Eye,
} from "lucide-react";
import { apiFetch } from "@/lib/manger/api";

interface Vendor {
  _id: string;
  name: string;
  phone: string;
  email: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  address?: string;
  serviceType: string;
  location: string;
  status: "approved" | "not-approved";
  notes: string;
  createdAt: string;
}

interface Location {
  _id: string;
  name: string;
}

const statusStyles = {
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  "not-approved": "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function Vendors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // View modal state
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsRes, locationsRes] = await Promise.all([
          apiFetch<{ items: Vendor[] }>("/api/vendors"),
          apiFetch<{ items: Location[] }>("/api/locations"),
        ]);
        setVendors(vendorsRes.items || []);
        setLocations(locationsRes.items || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openView = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsViewOpen(true);
  };

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    if (!viewId) return;
    if (loading) return;

    const match = vendors.find((v) => String(v._id) === viewId);
    if (!match) return;

    openView(match);

    const next = new URLSearchParams(searchParams);
    next.delete("view");
    setSearchParams(next, { replace: true });
  }, [vendors, loading, searchParams, setSearchParams]);

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesLocation =
        locationFilter === "all" || vendor.location === locationFilter;
      const matchesStatusFilter =
        statusFilter === "all" || vendor.status === statusFilter;

      if (!matchesLocation || !matchesStatusFilter) return false;

      const isApproved = vendor.status === "approved";
      const isNameMatch = q !== "" && (
        vendor.name.toLowerCase() === q ||
        vendor.name.toLowerCase().startsWith(q) ||
        (vendor.name.toLowerCase().includes(q) && !vendor.serviceType.toLowerCase().includes(q))
      );
      const isGeneralSearchMatch =
        q !== "" &&
        (vendor.name.toLowerCase().includes(q) ||
          vendor.phone.toLowerCase().includes(q) ||
          vendor.serviceType.toLowerCase().includes(q));

      // If user explicitly selected "not-approved" status filter, allow standard matching
      if (statusFilter === "not-approved") {
        return q === "" || isGeneralSearchMatch;
      }

      // If vendor is not-approved:
      // DO NOT show in default/empty listing (unless statusFilter was set to not-approved)
      // DO NOT match on phone or serviceType search. ONLY match if query matches vendor.name.
      if (!isApproved) {
        return isNameMatch;
      }

      // Approved vendor: match search query or show in default listing
      return q === "" || isGeneralSearchMatch;
    });
  }, [vendors, searchQuery, locationFilter, statusFilter]);

  const approvedCount = vendors.filter((v) => v.status === "approved").length;
  const notApprovedCount = vendors.filter((v) => v.status === "not-approved").length;

  const getStatusBadge = (status: string) => {
    if (status === "approved") {
      return (
        <Badge className={`${statusStyles[status]} flex items-center gap-1`}>
          <CheckCircle className="w-3 h-3" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge className={`${statusStyles[status]} flex items-center gap-1`}>
        <XCircle className="w-3 h-3" />
        Not Approved
      </Badge>
    );
  };

  const formatWebsite = (url?: string) => {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <div className="pl-6 space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Contact className="w-6 h-6 text-primary" />
            Vendor Directory
          </h1>
          <p className="text-muted-foreground">
            View approved and not-approved vendors by location
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{vendors.length}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{approvedCount}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rose-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Not Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-600">{notApprovedCount}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors by name, phone, service type, location, status..."
                  className="pl-10 text-xs sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Quick Filter Chips (Replaces Mobile-Buggy Dropdowns) */}
              <div className="overflow-x-auto no-scrollbar py-1 flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant={statusFilter === "all" && locationFilter === "all" ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter("all");
                    setLocationFilter("all");
                  }}
                  className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
                >
                  All Vendors
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "approved" ? "default" : "outline"}
                  onClick={() => setStatusFilter(statusFilter === "approved" ? "all" : "approved")}
                  className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
                >
                  Approved
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "not-approved" ? "default" : "outline"}
                  onClick={() => setStatusFilter(statusFilter === "not-approved" ? "all" : "not-approved")}
                  className="h-8 text-xs font-semibold rounded-full px-3 shrink-0 text-destructive"
                >
                  Not Approved
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vendor Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12 text-muted-foreground"
            >
              Loading vendors...
            </motion.div>
          ) : filteredVendors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12 text-muted-foreground"
            >
              <Contact className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No vendors found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </motion.div>
          ) : (
            filteredVendors.map((vendor) => (
              <motion.div
                key={vendor._id}
                variants={itemVariants}
                layout
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <Card 
                  className="h-full cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-between"
                  onClick={() => openView(vendor)}
                >
                  <div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Contact className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg hover:text-primary transition-colors">{vendor.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{vendor.serviceType}</p>
                          </div>
                        </div>
                        {getStatusBadge(vendor.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{vendor.location || "No Location"}</span>
                      </div>
                      
                      {vendor.phone && (
                        <div className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
                          <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <a
                            href={`tel:${vendor.phone}`}
                            className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                            title="Click to Call"
                          >
                            {vendor.phone}
                          </a>
                        </div>
                      )}

                      {vendor.email && (
                        <div className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
                          <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <a
                            href={`mailto:${vendor.email}`}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate"
                            title="Click to Send Email"
                          >
                            {vendor.email}
                          </a>
                        </div>
                      )}

                      {(vendor.address || vendor.street) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {vendor.address || [vendor.street, vendor.city, vendor.state].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}

                      {vendor.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {vendor.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* 1-Click Action Footer */}
                  <div className="px-6 pb-4 pt-2 border-t flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {vendor.phone && (
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                          <a href={`tel:${vendor.phone}`}>
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                        </Button>
                      )}
                      {vendor.email && (
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-blue-600 border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950/40">
                          <a href={`mailto:${vendor.email}`}>
                            <Mail className="w-3.5 h-3.5" /> Email
                          </a>
                        </Button>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                      onClick={() => openView(vendor)}
                    >
                      <Eye className="w-3.5 h-3.5" /> View Info
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Vendor Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-xl font-bold">{selectedVendor.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedVendor.serviceType}</p>
                </div>
                {getStatusBadge(selectedVendor.status)}
              </div>

              {/* 1-Click Call & Email buttons */}
              <div className="flex flex-wrap gap-2 py-1">
                {selectedVendor.phone && (
                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm">
                    <a href={`tel:${selectedVendor.phone}`}>
                      <Phone className="w-4 h-4" />
                      Call ({selectedVendor.phone})
                    </a>
                  </Button>
                )}
                {selectedVendor.email && (
                  <Button asChild size="sm" variant="outline" className="border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold gap-1.5">
                    <a href={`mailto:${selectedVendor.email}`}>
                      <Mail className="w-4 h-4" />
                      Send Email
                    </a>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Service Category</p>
                  <Badge variant="secondary" className="mt-0.5">{selectedVendor.serviceType}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Location</p>
                  <p className="font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {selectedVendor.location || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Phone</p>
                  {selectedVendor.phone ? (
                    <a href={`tel:${selectedVendor.phone}`} className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedVendor.phone}
                    </a>
                  ) : (
                    <p className="font-medium mt-0.5">—</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Email</p>
                  {selectedVendor.email ? (
                    <a href={`mailto:${selectedVendor.email}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{selectedVendor.email}</span>
                    </a>
                  ) : (
                    <p className="font-medium mt-0.5">—</p>
                  )}
                </div>
                {selectedVendor.website && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs font-medium">Website</p>
                    <a 
                      href={formatWebsite(selectedVendor.website)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium flex items-center gap-1 text-primary hover:underline mt-0.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {selectedVendor.website}
                    </a>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs font-medium">Address</p>
                  <p className="font-medium flex items-start gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
                    <span>
                      {selectedVendor.address || selectedVendor.street || ""}
                      {selectedVendor.city && `, ${selectedVendor.city}`}
                      {selectedVendor.state && `, ${selectedVendor.state}`}
                      {selectedVendor.zip && ` ${selectedVendor.zip}`}
                      {(!selectedVendor.address && !selectedVendor.street && !selectedVendor.city) && "—"}
                    </span>
                  </p>
                </div>
                {selectedVendor.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs font-medium mb-1">Notes</p>
                    <p className="font-medium bg-muted/30 p-2.5 rounded-lg border text-sm">{selectedVendor.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
