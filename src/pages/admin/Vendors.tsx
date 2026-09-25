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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
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
  Phone,
  Mail,
  Building,
  CheckCircle,
  XCircle,
  Globe,
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useToast } from "@/components/admin/ui/use-toast";

interface Vendor {
  _id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  website: string;
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

interface VendorCategory {
  _id: string;
  name: string;
}

export default function Vendors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Dialog states
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    website: "",
    serviceType: "",
    location: "",
    status: "approved" as "approved" | "not-approved",
    notes: "",
  });

  // Fetch vendors, locations, and categories
  const fetchData = async () => {
    try {
      const [vendorsRes, locationsRes, categoriesRes] = await Promise.all([
        apiFetch<{ items: Vendor[] }>("/api/vendors"),
        apiFetch<{ items: Location[] }>("/api/locations"),
        apiFetch<{ items: VendorCategory[] }>("/api/vendor-categories"),
      ]);
      setVendors(vendorsRes?.items || []);
      setLocations(locationsRes?.items || []);
      setCategories(categoriesRes?.items || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const qLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !qLower ||
        vendor.name.toLowerCase().includes(qLower) ||
        vendor.phone.toLowerCase().includes(qLower) ||
        (vendor.email && vendor.email.toLowerCase().includes(qLower)) ||
        (vendor.location && vendor.location.toLowerCase().includes(qLower)) ||
        (vendor.status && vendor.status.toLowerCase().includes(qLower)) ||
        vendor.serviceType.toLowerCase().includes(qLower);
      const matchesLocation =
        locationFilter === "all" || vendor.location === locationFilter;
      const matchesStatus =
        statusFilter === "all" || vendor.status === statusFilter;
      const matchesCategory = 
        categoryFilter === "all" || vendor.serviceType === categoryFilter;
      return matchesSearch && matchesLocation && matchesStatus && matchesCategory;
    });
  }, [vendors, searchQuery, locationFilter, statusFilter, categoryFilter]);

  const approvedCount = vendors.filter((v) => v.status === "approved").length;
  const notApprovedCount = vendors.filter((v) => v.status === "not-approved").length;

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return false;
    }
    if (!formData.phone.trim()) {
      toast({ title: "Phone is required", variant: "destructive" });
      return false;
    }
    if (!formData.serviceType.trim()) {
      toast({ title: "Service type is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      const payload = {
        ...formData,
        location: formData.location === "none-selected" ? "" : formData.location
      };
      const res = await apiFetch<{ item: Vendor }>("/api/vendors", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setVendors([res.item, ...vendors]);
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Vendor added successfully" });
    } catch (error) {
      toast({ title: "Failed to create vendor", description: error instanceof Error ? error.message : "Something went wrong", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedVendor) return;
    if (!validateForm()) return;
    try {
      const payload = {
        ...formData,
        location: formData.location === "none-selected" ? "" : formData.location
      };
      const res = await apiFetch<{ item: Vendor }>(`/api/vendors/${selectedVendor._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setVendors(vendors.map((v) => (v._id === res.item._id ? res.item : v)));
      setIsEditOpen(false);
      setSelectedVendor(null);
      resetForm();
      toast({ title: "Vendor updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update vendor", description: error instanceof Error ? error.message : "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedVendor) return;
    try {
      await apiFetch(`/api/vendors/${selectedVendor._id}`, {
        method: "DELETE",
      });
      setVendors(vendors.filter((v) => v._id !== selectedVendor._id));
      setIsDeleteOpen(false);
      setSelectedVendor(null);
    } catch (error) {
      console.error("Failed to delete vendor:", error);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const res = await apiFetch<{ item: VendorCategory }>("/api/vendor-categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setCategories([...categories, res.item].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData({ ...formData, serviceType: res.item.name });
      setIsNewCategoryOpen(false);
      setNewCategoryName("");
      toast({ title: "Category added successfully" });
    } catch (error) {
      toast({ title: "Failed to add category", description: error instanceof Error ? error.message : "Something went wrong", variant: "destructive" });
    }
  };

  const openView = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsViewOpen(true);
  };

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    if (!viewId) return;
    if (isViewOpen || isEditOpen || isDeleteOpen || isCreateOpen) return;

    const match = vendors.find((v) => String(v._id) === viewId);
    if (!match) return;

    openView(match);

    const next = new URLSearchParams(searchParams);
    next.delete("view");
    setSearchParams(next, { replace: true });
  }, [vendors, searchParams, setSearchParams, isViewOpen, isEditOpen, isDeleteOpen, isCreateOpen]);

  const openEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      phone: vendor.phone,
      email: vendor.email,
      street: vendor.street || "",
      city: vendor.city || "",
      state: vendor.state || "",
      zip: vendor.zip || "",
      website: vendor.website || "",
      serviceType: vendor.serviceType,
      location: vendor.location,
      status: vendor.status,
      notes: vendor.notes,
    });
    setIsEditOpen(true);
  };

  const openDelete = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDeleteOpen(true);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      website: "",
      serviceType: categories[0]?.name || "",
      location: "none-selected",
      status: "approved",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
        <XCircle className="w-3 h-3 mr-1" />
        Not Approved
      </Badge>
    );
  };

  const formatWebsite = (url: string) => {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <>
      <div className="pl-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vendor Rolodex</h1>
            <p className="text-muted-foreground">
              Manage approved and not-approved vendors by location and category
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsNewCategoryOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Not Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{notApprovedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
                  variant={statusFilter === "all" && categoryFilter === "all" && locationFilter === "all" ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter("all");
                    setCategoryFilter("all");
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

        {/* Vendors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Rolodex List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No vendors found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow 
                      key={vendor._id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openView(vendor)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium hover:text-primary transition-colors">{vendor.name}</p>
                          {vendor.website && (
                            <a 
                              href={formatWebsite(vendor.website)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="w-3 h-3" /> {vendor.website}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted/50">
                          {vendor.serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{vendor.location || "—"}</span>
                          </div>
                          {[vendor.street, vendor.city, vendor.state, vendor.zip].filter(Boolean).length > 0 && (
                            <p className="text-xs text-muted-foreground font-mono truncate max-w-[220px]" title={[vendor.street, vendor.city, vendor.state, vendor.zip].filter(Boolean).join(", ")}>
                              {[vendor.street, vendor.city, vendor.state, vendor.zip].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                          {vendor.phone ? (
                            <a 
                              href={`tel:${vendor.phone}`} 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs border border-emerald-500/20 transition-all"
                              title="Click to Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{vendor.phone}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                          {vendor.email && (
                            <a 
                              href={`mailto:${vendor.email}`} 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-xs border border-blue-500/20 transition-all"
                              title="Click to Send Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[140px]">{vendor.email}</span>
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(vendor)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Info
                            </DropdownMenuItem>
                            {vendor.phone && (
                              <DropdownMenuItem asChild>
                                <a href={`tel:${vendor.phone}`} className="text-emerald-600 cursor-pointer">
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call Vendor
                                </a>
                              </DropdownMenuItem>
                            )}
                            {vendor.email && (
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${vendor.email}`} className="text-blue-600 cursor-pointer">
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Email
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openEdit(vendor)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDelete(vendor)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Vendor</DialogTitle>
              <DialogDescription>
                Add a new vendor to the Rolodex
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Vendor name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="e.g., www.plumbingexperts.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Service Category *</Label>
                <Input
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  placeholder="e.g., Electrical, Plumbing, HVAC"
                />
              </div>

              <div className="space-y-2">
                <Label>Location / City / Site</Label>
                <div className="relative">
                  <Input
                    value={formData.location === "none-selected" ? "" : formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Type custom location or select below..."
                    list="vendor-locations-list"
                  />
                  <datalist id="vendor-locations-list">
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "approved" | "not-approved") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="not-approved">Not Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 border rounded-lg p-3 bg-muted/20">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Road/Street Address</Label>
                  <Input
                    className="h-8 text-sm"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input
                    className="h-8 text-sm"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">State</Label>
                  <Input
                    className="h-8 text-sm"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Zip Code</Label>
                  <Input
                    className="h-8 text-sm"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="Zip"
                  />
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Add Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Category Dialog */}
        <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new service category for vendors.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Electrical"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewCategoryOpen(false)}>Cancel</Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
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
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Website</p>
                    {selectedVendor.website ? (
                      <a 
                        href={formatWebsite(selectedVendor.website)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium flex items-center gap-1 text-primary hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        {selectedVendor.website}
                      </a>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium flex items-start gap-1">
                      <Building className="w-3 h-3 mt-0.5" />
                      <span>
                        {selectedVendor.street || ""}<br />
                        {[selectedVendor.city, selectedVendor.state, selectedVendor.zip].filter(Boolean).join(", ")}
                        {(!selectedVendor.street && !selectedVendor.city && !selectedVendor.state && !selectedVendor.zip) && "—"}
                      </span>
                    </p>
                  </div>
                  {selectedVendor.notes && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Notes</p>
                      <p className="font-medium bg-muted/30 p-2 rounded">{selectedVendor.notes}</p>
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

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>
                Update vendor information in the Rolodex
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Service Category *</Label>
                <Input
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  placeholder="e.g., Electrical, Plumbing, HVAC"
                />
              </div>
              <div className="space-y-2">
                <Label>Location / City / Site</Label>
                <div className="relative">
                  <Input
                    value={formData.location === "none-selected" ? "" : formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Type custom location or select below..."
                    list="vendor-locations-edit-list"
                  />
                  <datalist id="vendor-locations-edit-list">
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc.name} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "approved" | "not-approved") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="not-approved">Not Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 border rounded-lg p-3 bg-muted/20">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Road/Street Address</Label>
                  <Input
                    className="h-8 text-sm"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input
                    className="h-8 text-sm"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">State</Label>
                  <Input
                    className="h-8 text-sm"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Zip Code</Label>
                  <Input
                    className="h-8 text-sm"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Vendor</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedVendor?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
