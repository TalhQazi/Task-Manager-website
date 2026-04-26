import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";

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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { createResource, deleteResource, listResource, updateResource } from "@/lib/admin/apiClient";
import AssetLibraryPicker from "@/components/admin/AssetLibraryPicker";

// World countries list
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
  "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea North", "Korea South", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
  "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru",
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan",
  "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

interface Company {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  status: "active" | "inactive" | "suspended";
  settings?: {
    timezone?: string;
    dateFormat?: string;
    currency?: string;
  };
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Enhanced status classes with beautiful gradients
const statusClasses = {
  active: "bg-gradient-to-r from-success/20 to-success/10 text-success border-success/20 shadow-sm",
  inactive: "bg-gradient-to-r from-muted to-muted/50 text-muted-foreground border-muted-foreground/20 shadow-sm",
  suspended: "bg-gradient-to-r from-warning/20 to-warning/10 text-warning border-warning/20 shadow-sm",
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const Companies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);

  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [viewCompanyOpen, setViewCompanyOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [editPickerOpen, setEditPickerOpen] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [addFormData, setAddFormData] = useState({
    name: "",
    description: "",
    status: "active" as Company["status"],
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    email: "",
    phone: "",
    website: "",
    logo: "",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "active" as Company["status"],
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    email: "",
    phone: "",
    website: "",
    logo: "",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const list = await listResource<Company>("companies");
        if (!mounted) return;
        setCompaniesList(list);
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load companies");
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

  const refreshCompanies = async () => {
    const list = await listResource<Company>("companies");
    setCompaniesList(list);
  };

  const handleAddCompany = async () => {
    try {
      setApiError(null);
      setIsAdding(true);

      const newCompany = {
        name: addFormData.name.trim(),
        description: addFormData.description.trim(),
        status: addFormData.status,
        logo: addFormData.logo,
        address: {
          street: addFormData.street.trim(),
          city: addFormData.city.trim(),
          state: addFormData.state.trim(),
          zipCode: addFormData.zipCode.trim(),
          country: addFormData.country.trim(),
        },
        contact: {
          email: addFormData.email.trim(),
          phone: addFormData.phone.trim(),
          website: addFormData.website.trim(),
        },
        settings: {
          timezone: addFormData.timezone,
          dateFormat: addFormData.dateFormat,
          currency: addFormData.currency,
        },
      };

      await createResource<Company>("companies", newCompany);
      await refreshCompanies();
      setAddCompanyOpen(false);
      resetAddForm();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to create company");
    } finally {
      setIsAdding(false);
    }
  };

  const resetAddForm = () => {
    setAddFormData({
      name: "",
      description: "",
      status: "active",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      email: "",
      phone: "",
      website: "",
      logo: "",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      currency: "USD",
    });
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setViewCompanyOpen(true);
  };

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    if (!viewId) return;
    if (viewCompanyOpen || editCompanyOpen || deleteConfirmOpen || addCompanyOpen) return;

    const match = companiesList.find((c) => String(c.id) === viewId);
    if (!match) return;

    handleViewCompany(match);

    const next = new URLSearchParams(searchParams);
    next.delete("view");
    setSearchParams(next, { replace: true });
  }, [
    companiesList,
    searchParams,
    setSearchParams,
    viewCompanyOpen,
    editCompanyOpen,
    deleteConfirmOpen,
    addCompanyOpen,
  ]);

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditFormData({
      name: company.name,
      code: company.code,
      description: company.description || "",
      status: company.status,
      street: company.address?.street || "",
      city: company.address?.city || "",
      state: company.address?.state || "",
      zipCode: company.address?.zipCode || "",
      country: company.address?.country || "",
      email: company.contact?.email || "",
      phone: company.contact?.phone || "",
      website: company.contact?.website || "",
      logo: company.logo || "",
      timezone: company.settings?.timezone || "UTC",
      dateFormat: company.settings?.dateFormat || "MM/DD/YYYY",
      currency: company.settings?.currency || "USD",
    });
    setEditCompanyOpen(true);
  };

  const saveEditCompany = async () => {
    if (!selectedCompany) return;
    if (!editFormData.name) return;

    try {
      setApiError(null);
      await updateResource<Company>("companies", selectedCompany.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        status: editFormData.status,
        logo: editFormData.logo,
        address: {
          street: editFormData.street.trim(),
          city: editFormData.city.trim(),
          state: editFormData.state.trim(),
          zipCode: editFormData.zipCode.trim(),
          country: editFormData.country.trim(),
        },
        contact: {
          email: editFormData.email.trim(),
          phone: editFormData.phone.trim(),
          website: editFormData.website.trim(),
        },
        settings: {
          timezone: editFormData.timezone,
          dateFormat: editFormData.dateFormat,
          currency: editFormData.currency,
        },
      });

      await refreshCompanies();
      setEditCompanyOpen(false);
      setSelectedCompany(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update company");
    }
  };

  const handleDeleteConfirm = (company: Company) => {
    setSelectedCompany(company);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCompany) return;
    try {
      setApiError(null);
      await deleteResource("companies", selectedCompany.id);
      await refreshCompanies();
      setDeleteConfirmOpen(false);
      setSelectedCompany(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to delete company");
    }
  };

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditFormData({ ...editFormData, logo: reader.result as string });
        } else {
          setAddFormData({ ...addFormData, logo: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData({ ...editFormData, logo: "" });
    } else {
      setAddFormData({ ...addFormData, logo: "" });
    }
  };

  const filteredCompanies = useMemo(() => {
    return companiesList
      .filter((company) => {
        const matchesSearch =
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.contact?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || company.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companiesList, searchQuery, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Building2 className="h-3 w-3" />;
      case "inactive":
        return <Building2 className="h-3 w-3" />;
      case "suspended":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Helper function to generate prefix from company name (always 3-4 characters)
  const generatePrefix = (name: string) => {
    if (!name || typeof name !== "string") return "XXX";
    
    // Remove special characters and split by spaces
    const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, "");
    const words = cleanName.trim().split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) return "XXX";
    
    // If single word, take first 3 letters (or all if less than 3)
    if (words.length === 1) {
      const word = words[0];
      // Get first 3 letters, including numbers if present
      let prefix = "";
      for (let i = 0; i < Math.min(3, word.length); i++) {
        prefix += word.charAt(i).toUpperCase();
      }
      return prefix || "XXX";
    }
    
    // For multiple words, take first letter of first 3 words
    const prefix = words
      .slice(0, 3)
      .map(word => word.charAt(0).toUpperCase())
      .join("");
    
    return prefix || "XXX";
  };

  // Get next sequence number based on existing companies
  const getNextSequence = () => {
    if (companiesList.length === 0) return 1;
    const maxSequence = Math.max(...companiesList.map(c => (c as any).sequence || 0));
    return maxSequence + 1;
  };

  return (
    <>
      <motion.div
        className="pl-12 space-y-4 sm:space-y-5 md:space-y-6 pr-2 sm:pr-0 pb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header with animated gradient */}
        <motion.div
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-6"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </motion.div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Companies
                </h1>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
                Manage your organizations, companies, and business entities with ease.
              </p>
            </div>

            {/* Add Company Dialog */}
            <Dialog
              open={addCompanyOpen}
              onOpenChange={(next) => {
                setAddCompanyOpen(next);
                if (!next) resetAddForm();
              }}
            >
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white w-full sm:w-auto mt-2 sm:mt-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="sm:hidden">Add</span>
                    <span className="hidden sm:inline">Add Company</span>
                  </Button>
                </motion.div>
              </DialogTrigger>

              <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-1.5 sm:space-y-2">
                  <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Add New Company
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Create a new company profile and add it to the directory
                  </DialogDescription>
                </DialogHeader>

                <motion.div
                  className="space-y-4 sm:space-y-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Company Name *</label>
                    <input
                      type="text"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                      placeholder="e.g., TaskFlow Inc."
                      className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>

                  {/* Auto-generated Code Preview */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 text-muted-foreground">
                      Company Code <span className="text-xs text-primary">(Auto-generated)</span>
                    </label>
                    <input
                      type="text"
                      value={addFormData.name ? `${generatePrefix(addFormData.name)}-${String(getNextSequence()).padStart(3, "0")}` : ""}
                      disabled
                      placeholder="Will be generated automatically"
                      className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-muted/50 text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Code is automatically generated based on company name
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Description</label>
                    <textarea
                      value={addFormData.description}
                      onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                      placeholder="Brief description of the company"
                      rows={3}
                      className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                    <select
                      value={addFormData.status}
                      onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value as Company["status"] })}
                      className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Address</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={addFormData.country}
                        onChange={(e) => setAddFormData({ ...addFormData, country: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="">Select Country</option>
                        {COUNTRIES.map((country) => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={addFormData.city}
                        onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                        placeholder="City"
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Contact Information</h4>
                    <input
                      type="email"
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      placeholder="Email Address"
                      className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <input
                      type="tel"
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                      placeholder="Phone Number"
                      className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <input
                      type="url"
                      value={addFormData.website}
                      onChange={(e) => setAddFormData({ ...addFormData, website: e.target.value })}
                      placeholder="Website URL"
                      className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    
                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">Company Logo</label>
                      {addFormData.logo ? (
                        <div className="relative inline-block">
                          <img src={addFormData.logo} alt="Company Logo" className="h-20 w-20 object-cover rounded-lg border" />
                          <button
                            type="button"
                            onClick={() => removeLogo(false)}
                            className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg cursor-pointer hover:bg-primary/20 transition-all">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">Upload Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLogoUpload(e, false)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setAddPickerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-lg hover:bg-indigo-500/20 transition-all text-sm font-medium"
                          >
                            <ImageIcon className="h-4 w-4" /> Pick from Library
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddCompanyOpen(false);
                        resetAddForm();
                      }}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <Button
                      onClick={handleAddCompany}
                      disabled={!addFormData.name || isAdding}
                      className="bg-gradient-to-r from-primary to-primary/80 text-white w-full sm:w-auto order-1 sm:order-2 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60"
                    >
                      {isAdding ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                      )}
                      {isAdding ? "Adding..." : "Add Company"}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* API Error Message */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="rounded-lg bg-destructive/10 p-3 sm:p-4 border border-destructive/20"
            >
              <p className="text-xs sm:text-sm text-destructive break-words flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {apiError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" variants={containerVariants}>
          {[
            { label: "Total Companies", value: companiesList.length, icon: Building2, color: "primary" },
            { label: "Active", value: companiesList.filter((c) => c.status === "active").length, icon: Building2, color: "success" },
            { label: "Inactive", value: companiesList.filter((c) => c.status === "inactive").length, icon: Building2, color: "muted" },
            { label: "Suspended", value: companiesList.filter((c) => c.status === "suspended").length, icon: AlertTriangle, color: "warning" },
          ].map((item) => (
            <motion.div key={item.label} variants={itemVariants} whileHover="hover" whileTap={{ scale: 0.98 }}>
              <Card className={`shadow-lg border-0 bg-gradient-to-br from-${item.color}/10 to-${item.color}/5 backdrop-blur-sm overflow-hidden`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <motion.div
                      className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-${item.color}/10 flex items-center justify-center flex-shrink-0`}
                      whileHover={{ rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${item.color}`} />
                    </motion.div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.label}</p>
                      <p className="text-lg sm:text-xl font-bold">{item.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, code, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base rounded-lg border-0 bg-muted/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-xs sm:text-sm rounded-lg border-0 bg-muted/50 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Companies List */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-muted/20">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Companies
                {filteredCompanies.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                    {filteredCompanies.length} total
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-8 sm:py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="block sm:hidden space-y-3 p-4">
                    <AnimatePresence>
                      {filteredCompanies.map((company, index) => (
                        <motion.div
                          key={company.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          onHoverStart={() => setHoveredCompany(company.id)}
                          onHoverEnd={() => setHoveredCompany(null)}
                          className="bg-gradient-to-br from-card to-card/50 rounded-xl border p-4 space-y-3 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300, damping: 10 }}>
                                <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-primary/20">
                                  {company.logo ? (
                                    <AvatarImage src={company.logo} alt={company.name} className="object-cover" />
                                  ) : null}
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xs">
                                    {company.code?.slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              </motion.div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate flex items-center gap-2">
                                  {company.name}
                                  {hoveredCompany === company.id && (
                                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block w-1.5 h-1.5 bg-primary rounded-full" />
                                  )}
                                </p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewCompany(company)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Company
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteConfirm(company)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex justify-start">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Badge className={`${statusClasses[company.status]} text-xs flex items-center gap-1`} variant="secondary">
                                {getStatusIcon(company.status)}
                                {company.status}
                              </Badge>
                            </motion.div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {company.contact?.email && (
                              <motion.div whileHover={{ x: 5 }} className="col-span-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-xs truncate">{company.contact.email}</span>
                                </div>
                              </motion.div>
                            )}
                            {company.contact?.phone && (
                              <motion.div whileHover={{ x: 5 }}>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-xs truncate">{company.contact.phone}</span>
                                </div>
                              </motion.div>
                            )}
                            {company.address?.city && (
                              <motion.div whileHover={{ x: 5 }}>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-xs truncate">{company.address.city}</span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {filteredCompanies.length === 0 && (
                      <motion.div className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex justify-center mb-3">
                          <motion.div
                            className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </motion.div>
                        </div>
                        <p className="text-sm text-muted-foreground">No companies found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or add a new company</p>
                      </motion.div>
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden sm:block w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs md:text-sm">Company</TableHead>
                          <TableHead className="text-xs md:text-sm">Code</TableHead>
                          <TableHead className="text-xs md:text-sm">Contact</TableHead>
                          <TableHead className="text-xs md:text-sm">Location</TableHead>
                          <TableHead className="text-xs md:text-sm">Status</TableHead>
                          <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredCompanies.map((company, index) => (
                            <motion.tr
                              key={company.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 1.01, backgroundColor: "rgba(59, 130, 246, 0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                              onHoverStart={() => setHoveredCompany(company.id)}
                              onHoverEnd={() => setHoveredCompany(null)}
                              className="cursor-pointer transition-all duration-300"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300, damping: 10 }}>
                                    <Avatar className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 ring-2 ring-primary/20">
                                      {company.logo ? (
                                        <AvatarImage src={company.logo} alt={company.name} className="object-cover" />
                                      ) : null}
                                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xs md:text-sm">
                                        {company.code?.slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </motion.div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm md:text-base truncate flex items-center gap-2">
                                      {company.name}
                                      {hoveredCompany === company.id && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block w-1.5 h-1.5 bg-primary rounded-full" />}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm md:text-base">{company.code}</p>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 min-w-0">
                                  {company.contact?.email && (
                                    <motion.div className="flex items-center gap-1.5 text-xs md:text-sm" whileHover={{ x: 5 }}>
                                      <Mail className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground flex-shrink-0" />
                                      <span className="text-muted-foreground truncate max-w-[150px] lg:max-w-[200px]">{company.contact.email}</span>
                                    </motion.div>
                                  )}
                                  {company.contact?.phone && (
                                    <motion.div className="flex items-center gap-1.5 text-xs md:text-sm" whileHover={{ x: 5 }}>
                                      <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground flex-shrink-0" />
                                      <span className="text-muted-foreground truncate max-w-[150px] lg:max-w-[200px]">{company.contact.phone}</span>
                                    </motion.div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-sm">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="text-muted-foreground truncate max-w-[150px] lg:max-w-[200px]">
                                    {[company.address?.city, company.address?.state, company.address?.country].filter(Boolean).join(", ") || "—"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                  <Badge className={`${statusClasses[company.status]} text-xs md:text-sm flex items-center gap-1`} variant="secondary">
                                    {getStatusIcon(company.status)}
                                    {company.status}
                                  </Badge>
                                </motion.div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </motion.div>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewCompany(company)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Company
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteConfirm(company)} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* View Company Dialog */}
      <Dialog open={viewCompanyOpen} onOpenChange={setViewCompanyOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Company Details
            </DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <motion.div className="space-y-4 sm:space-y-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3">
                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300, damping: 10 }}>
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 ring-2 ring-primary/20">
                      {selectedCompany.logo ? (
                        <AvatarImage src={selectedCompany.logo} alt={selectedCompany.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-sm sm:text-base">
                        {selectedCompany.code?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <div>
                    <p className="text-base sm:text-lg font-semibold break-words">{selectedCompany.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{selectedCompany.code}</p>
                  </div>
                </div>
                <Badge className={`${statusClasses[selectedCompany.status]} text-xs sm:text-sm self-start sm:self-center flex items-center gap-1`} variant="secondary">
                  {getStatusIcon(selectedCompany.status)}
                  {selectedCompany.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {selectedCompany.description && (
                  <motion.div className="sm:col-span-2 space-y-1.5" whileHover={{ x: 5 }}>
                    <label className="text-xs sm:text-sm font-medium">Description</label>
                    <p className="text-xs sm:text-sm text-muted-foreground bg-gradient-to-br from-muted/30 to-muted/10 p-2 rounded-lg">{selectedCompany.description}</p>
                  </motion.div>
                )}
                {selectedCompany.contact?.email && (
                  <motion.div className="space-y-1.5" whileHover={{ x: 5 }}>
                    <label className="text-xs sm:text-sm font-medium">Email</label>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{selectedCompany.contact.email}</span>
                    </div>
                  </motion.div>
                )}
                {selectedCompany.contact?.phone && (
                  <motion.div className="space-y-1.5" whileHover={{ x: 5 }}>
                    <label className="text-xs sm:text-sm font-medium">Phone</label>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{selectedCompany.contact.phone}</span>
                    </div>
                  </motion.div>
                )}
                 {selectedCompany.contact?.website && (
                  <motion.div className="space-y-1.5" whileHover={{ x: 5 }}>
                    <label className="text-sm font-medium">Website</label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <a 
                        href={selectedCompany.contact.website.startsWith("http") ? selectedCompany.contact.website : `https://${selectedCompany.contact.website}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {selectedCompany.contact.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </motion.div>
                )}
                {(selectedCompany.address?.street || selectedCompany.address?.city) && (
                  <motion.div className="sm:col-span-2 space-y-1.5" whileHover={{ x: 5 }}>
                    <label className="text-xs sm:text-sm font-medium">Address</label>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                      <span>
                        {[selectedCompany.address?.street, selectedCompany.address?.city, selectedCompany.address?.state, selectedCompany.address?.zipCode, selectedCompany.address?.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
          <DialogFooter className="mt-4 sm:mt-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => setViewCompanyOpen(false)} className="w-full sm:w-auto">Close</Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Edit Company</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Update company information and save changes</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <motion.div className="space-y-4 sm:space-y-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {/* Name & Code */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Company Code</label>
                  <input
                    type="text"
                    value={editFormData.code}
                    disabled
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-muted/50 text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Auto-generated and cannot be changed</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Company["status"] })}
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Address</h4>
                <input
                  type="text"
                  value={editFormData.street}
                  onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                  placeholder="Street Address"
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    placeholder="City"
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <input
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    placeholder="State"
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editFormData.zipCode}
                    onChange={(e) => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                    placeholder="Zip Code"
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <select
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Contact Information</h4>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Email Address"
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="Phone Number"
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  type="url"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                  placeholder="Website URL"
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all"
                />
                
                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Company Logo</label>
                  {editFormData.logo ? (
                    <div className="relative inline-block">
                      <img src={editFormData.logo} alt="Company Logo" className="h-20 w-20 object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => removeLogo(true)}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg cursor-pointer hover:bg-primary/20 transition-all">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoUpload(e, true)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditPickerOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-lg hover:bg-indigo-500/20 transition-all text-sm font-medium"
                      >
                        <ImageIcon className="h-4 w-4" /> Pick from Library
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Button variant="outline" onClick={() => setEditCompanyOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Button onClick={saveEditCompany} className="bg-gradient-to-r from-primary to-primary/80 text-white w-full sm:w-auto order-1 sm:order-2 shadow-lg hover:shadow-xl transition-all duration-300">Save Changes</Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg text-destructive">Delete Company</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">This action cannot be undone. The company will be permanently removed from the system.</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <motion.div
              className="rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5 p-3 sm:p-4 text-xs sm:text-sm mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="font-medium break-words">{selectedCompany.name}</p>
              <p className="text-muted-foreground text-xs sm:text-sm break-words mt-1">{selectedCompany.code}</p>
            </motion.div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Button variant="destructive" onClick={confirmDelete} className="w-full sm:w-auto order-1 sm:order-2">Delete</Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add global styles for grid pattern */}
      <style>{`
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.05)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
      `}</style>

      {/* Asset Library Picker for Add */}
      <AssetLibraryPicker
        open={addPickerOpen}
        onOpenChange={setAddPickerOpen}
        onSelect={(url) => setAddFormData({ ...addFormData, logo: url })}
      />

      {/* Asset Library Picker for Edit */}
      <AssetLibraryPicker
        open={editPickerOpen}
        onOpenChange={setEditPickerOpen}
        onSelect={(url) => setEditFormData({ ...editFormData, logo: url })}
      />
    </>
  );
};

export default Companies;
