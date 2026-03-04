import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Input } from "@/components/manger/ui/input";
import { Badge } from "@/components/manger/ui/badge";
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
} from "lucide-react";
import { apiFetch } from "@/lib/manger/api";

interface Vendor {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
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
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "not-approved": "bg-rose-100 text-rose-800 border-rose-200",
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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch =
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.serviceType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation =
        locationFilter === "all" || vendor.location === locationFilter;
      const matchesStatus =
        statusFilter === "all" || vendor.status === statusFilter;
      return matchesSearch && matchesLocation && matchesStatus;
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

  return (
    <div className="space-y-6 p-6">
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
                  placeholder="Search vendors by name, phone, or service type..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="not-approved">Not Approved</SelectItem>
                </SelectContent>
              </Select>
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
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Contact className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{vendor.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{vendor.serviceType}</p>
                        </div>
                      </div>
                      {getStatusBadge(vendor.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{vendor.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{vendor.phone}</span>
                    </div>
                    {vendor.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{vendor.address}</span>
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
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
