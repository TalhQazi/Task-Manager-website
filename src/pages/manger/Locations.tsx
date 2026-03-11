import { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Badge } from "@/components/manger/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/manger/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/manger/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/manger/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/manger/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/manger/ui/alert-dialog";
import { toast } from "@/components/manger/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Plus,
  Search,
  MapPin,
  Users,
  Building2,
  Phone,
  MoreHorizontal,
  Clock,
  Map,
  Navigation,
  Image as ImageIcon,
  X,
  Save,
} from "lucide-react";
import { cn } from "@/lib/manger/utils";
import { apiFetch } from "@/lib/manger/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Location {
  id: string;
  name: string;
  type: "office" | "warehouse" | "facility" | "site";
  address: string;
  city: string;
  phone: string;
  manager: string;
  employeeCount: number;
  status: "active" | "inactive";
  operatingHours: string;
  photoDataUrl?: string;
  photoFileName?: string;
}

type LocationApi = Omit<Location, "id"> & {
  _id: string;
};

function normalizeLocation(l: LocationApi): Location {
  return {
    id: l._id,
    name: l.name,
    type: l.type,
    address: l.address,
    city: l.city,
    phone: l.phone,
    manager: l.manager,
    employeeCount: l.employeeCount,
    status: l.status,
    operatingHours: l.operatingHours,
    photoDataUrl: (l as unknown as { photoDataUrl?: string }).photoDataUrl,
    photoFileName: (l as unknown as { photoFileName?: string }).photoFileName,
  };
}

const typeStyles = {
  office: "bg-primary/10 text-primary",
  warehouse: "bg-warning/10 text-warning",
  facility: "bg-info/10 text-info",
  site: "bg-success/10 text-success",
};

const typeIcons = {
  office: Building2,
  warehouse: Building2,
  facility: Building2,
  site: MapPin,
};

const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["office", "warehouse", "facility", "site"]),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  status: z.enum(["active", "inactive"]),
  contactName: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
  tasksCount: z.coerce.number().optional().default(0),
  photoDataUrl: z.string().optional().default(""),
  photoFileName: z.string().optional().default(""),
});

type CreateLocationValues = z.infer<typeof createLocationSchema>;

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
};

const statsCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  }),
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
};

const searchVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
      delay: 0.3,
    },
  },
};

const locationCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.1 + 0.4,
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  }),
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: "0 20px 40px -15px rgba(0,0,0,0.2)",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 30,
    transition: { duration: 0.2 },
  },
};

const iconVariants: Variants = {
  hover: {
    rotate: 15,
    scale: 1.1,
    transition: { type: "spring" as const, stiffness: 400, damping: 20 },
  },
};

const buttonVariants: Variants = {
  hover: {
    scale: 1.05,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
  tap: {
    scale: 0.95,
  },
};

const mapPinVariants: Variants = {
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

export default function Locations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const res = await apiFetch<{ items: LocationApi[] }>("/api/locations");
      return res.items.map(normalizeLocation);
    },
  });

  const locations = locationsQuery.data ?? [];

  const createLocationMutation = useMutation({
    mutationFn: async (payload: Omit<Location, "id">) => {
      const res = await apiFetch<{ item: LocationApi }>("/api/locations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return normalizeLocation(res.item);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CreateLocationValues }) => {
      const res = await apiFetch<{ item: LocationApi }>(`/api/locations/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return normalizeLocation(res.item);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch<{ ok: true }>(`/api/locations/${id}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  const form = useForm<CreateLocationValues>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      name: "",
      type: "office",
      address: "",
      city: "",
      status: "active",
      contactName: "",
      contactPhone: "",
      tasksCount: 0,
      photoDataUrl: "",
      photoFileName: "",
    },
  });

  const editForm = useForm<CreateLocationValues>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      name: "",
      type: "office",
      address: "",
      city: "",
      status: "active",
      contactName: "",
      contactPhone: "",
      tasksCount: 0,
      photoDataUrl: "",
      photoFileName: "",
    },
  });

  const onCreateLocation = (values: CreateLocationValues) => {
    const payload: Omit<Location, "id"> = {
      name: values.name,
      type: values.type,
      address: values.address,
      city: values.city,
      phone: values.contactPhone || "",
      manager: values.contactName || "",
      employeeCount: Number.isFinite(values.tasksCount) ? values.tasksCount : 0,
      status: values.status,
      operatingHours: "",
      photoDataUrl: values.photoDataUrl || undefined,
      photoFileName: values.photoFileName || undefined,
    };

    createLocationMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false);
        form.reset();
        toast({
          title: "Location added",
          description: "New location has been added.",
        });
      },
      onError: (err) => {
        toast({
          title: "Failed to add location",
          description: err instanceof Error ? err.message : "Something went wrong",
        });
      },
    });
  };

  const openView = (location: Location) => {
    setSelectedLocation(location);
    setIsViewOpen(true);
  };

  const openEdit = (location: Location) => {
    setSelectedLocation(location);
    editForm.reset({
      name: location.name,
      type: location.type,
      address: location.address,
      city: location.city,
      status: location.status,
      contactName: location.manager || "",
      contactPhone: location.phone || "",
      tasksCount: Number.isFinite(location.employeeCount) ? location.employeeCount : 0,
      photoDataUrl: location.photoDataUrl || "",
      photoFileName: location.photoFileName || "",
    });
    setIsEditOpen(true);
  };

  const openDelete = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteOpen(true);
  };

  const onEditLocation = (values: CreateLocationValues) => {
    if (!selectedLocation) return;

    updateLocationMutation.mutate(
      { id: selectedLocation.id, payload: values },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          toast({
            title: "Location updated",
            description: "Location has been updated.",
          });
        },
        onError: (err) => {
          toast({
            title: "Failed to update location",
            description: err instanceof Error ? err.message : "Something went wrong",
          });
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!selectedLocation) return;
    const toDelete = selectedLocation;

    deleteLocationMutation.mutate(toDelete.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedLocation(null);
        toast({
          title: "Location deleted",
          description: "Location has been removed.",
        });
      },
      onError: (err) => {
        toast({
          title: "Failed to delete location",
          description: err instanceof Error ? err.message : "Something went wrong",
        });
      },
    });
  };

  const filteredLocations = useMemo(() => {
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.city.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [locations, searchQuery]);

  const typeCounts = useMemo(() => {
    return {
      office: locations.filter((l) => l.type === "office").length,
      warehouse: locations.filter((l) => l.type === "warehouse").length,
      facility: locations.filter((l) => l.type === "facility").length,
      site: locations.filter((l) => l.type === "site").length,
    };
  }, [locations]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={headerVariants} className="flex items-center justify-between">
        <div className="page-header mb-0">
          <motion.h1 
            className="page-title"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            Locations Management
          </motion.h1>
          <motion.p 
            className="page-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Manage all business locations and sites
          </motion.p>
        </div>
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Location
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
          }
        }}
      >
        {Object.entries(typeStyles).map(([type, style], index) => {
          const count = typeCounts[type as keyof typeof typeCounts] ?? 0;
          const Icon = typeIcons[type as keyof typeof typeIcons];
          return (
            <motion.div
              key={type}
              custom={index}
              variants={statsCardVariants}
              whileHover="hover"
              className="stat-card bg-card rounded-xl border border-border shadow-card p-4"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className={cn("p-2 rounded-lg", style)}
                  whileHover="hover"
                  variants={iconVariants}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {type}s
                  </p>
                  <motion.p 
                    className="text-2xl font-bold text-foreground"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 20,
                      delay: index * 0.1 + 0.3 
                    }}
                  >
                    {count}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div 
        variants={searchVariants}
        className="relative max-w-md"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search locations..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </motion.div>

      {/* Locations Grid */}
      <motion.div 
        className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: 0.4,
            },
          },
        }}
      >
        {locationsQuery.isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 text-sm text-muted-foreground flex items-center justify-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
            />
            Loading locations...
          </motion.div>
        ) : locationsQuery.isError ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 text-sm text-destructive"
          >
            {locationsQuery.error instanceof Error
              ? locationsQuery.error.message
              : "Failed to load locations"}
          </motion.div>
        ) : filteredLocations.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 text-primary flex items-center justify-center"
            >
              <Map className="w-8 h-8" />
            </motion.div>
            <h3 className="text-lg font-medium text-foreground mb-2">No locations found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search" : "Get started by adding your first location"}
            </p>
            {!searchQuery && (
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Location
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredLocations.map((location, index) => {
                const TypeIcon = typeIcons[location.type];
                return (
                  <motion.div
                    key={location.id}
                    custom={index}
                    variants={locationCardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover="hover"
                    layout
                    className={cn(
                      "bg-card rounded-xl border border-border shadow-card overflow-hidden",
                      location.status === "inactive" && "opacity-60"
                    )}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover="hover"
                            variants={iconVariants}
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              typeStyles[location.type]
                            )}
                          >
                            <TypeIcon className="w-6 h-6" />
                          </motion.div>
                          <div>
                            <motion.h3 
                              className="font-semibold text-foreground"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.5 }}
                            >
                              {location.name}
                            </motion.h3>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.55 }}
                            >
                              <Badge
                                variant="secondary"
                                className={cn("capitalize mt-1", typeStyles[location.type])}
                              >
                                {location.type}
                              </Badge>
                            </motion.div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                              aria-label="Location actions"
                            >
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </motion.button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(location)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(location)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDelete(location)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <motion.div 
                        className="space-y-3 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.6 }}
                      >
                        <motion.div 
                          className="flex items-start gap-2 text-muted-foreground"
                          whileHover="hover"
                          variants={iconVariants}
                        >
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p>{location.address}</p>
                            <p>{location.city}</p>
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex items-center gap-2 text-muted-foreground"
                          whileHover="hover"
                          variants={iconVariants}
                        >
                          <Phone className="w-4 h-4" />
                          <span>{location.phone}</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center gap-2 text-muted-foreground"
                          whileHover="hover"
                          variants={iconVariants}
                        >
                          <Clock className="w-4 h-4" />
                          <span>{location.operatingHours}</span>
                        </motion.div>
                      </motion.div>

                      <motion.div 
                        className="flex items-center justify-between mt-4 pt-4 border-t border-border"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.7 }}
                      >
                        <motion.div 
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Users className="w-4 h-4" />
                          <span>{location.employeeCount} employees</span>
                        </motion.div>
                        <motion.span
                          animate={location.status === "active" ? {
                            scale: [1, 1.05, 1],
                            transition: { duration: 2, repeat: Infinity }
                          } : {}}
                          className={cn(
                            "text-xs font-medium capitalize flex items-center gap-1.5",
                            location.status === "active"
                              ? "text-success"
                              : "text-muted-foreground"
                          )}
                        >
                          <motion.span
                            animate={location.status === "active" ? "pulse" : {}}
                            variants={mapPinVariants}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              location.status === "active"
                                ? "bg-success"
                                : "bg-muted-foreground"
                            )}
                          />
                          {location.status}
                        </motion.span>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Stats Summary */}
      {filteredLocations.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex justify-between items-center text-sm text-muted-foreground"
        >
          <span>Showing {filteredLocations.length} of {locations.length} locations</span>
          <motion.div 
            className="flex items-center gap-2"
            animate={{ 
              scale: [1, 1.02, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <Navigation className="w-4 h-4 text-primary" />
            <span>Total employees: {locations.reduce((acc, loc) => acc + loc.employeeCount, 0)}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Dialogs with animations */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Add Location
              </DialogTitle>
              <DialogDescription>Add a new business location.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateLocation)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Warehouse B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="office">Office</SelectItem>
                            <SelectItem value="warehouse">Warehouse</SelectItem>
                            <SelectItem value="facility">Facility</SelectItem>
                            <SelectItem value="site">Site</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. New York, NY 10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tasksCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employees</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2 sm:col-span-2">
                    <FormLabel>Location Photo</FormLabel>
                    <div className="flex flex-col gap-2">
                      {form.watch("photoDataUrl") ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                          <img
                            src={form.watch("photoDataUrl")}
                            alt="Location preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              form.setValue("photoDataUrl", "");
                              form.setValue("photoFileName", "");
                            }}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="w-full rounded-lg border border-dashed border-muted-foreground/25 px-3 py-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            const input = document.getElementById("location-photo-upload") as HTMLInputElement | null;
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
                              form.setValue("photoDataUrl", String(reader.result || ""));
                              form.setValue("photoFileName", file.name);
                            };
                            reader.readAsDataURL(file);
                          }
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto"
                  >
                    <Button type="submit" className="gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </motion.div>
                </DialogFooter>
              </form>
            </Form>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialogs with animations */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Edit Location
              </DialogTitle>
              <DialogDescription>Edit location details.</DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditLocation)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Warehouse B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="office">Office</SelectItem>
                            <SelectItem value="warehouse">Warehouse</SelectItem>
                            <SelectItem value="facility">Facility</SelectItem>
                            <SelectItem value="site">Site</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. New York, NY 10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="tasksCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employees</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2 sm:col-span-2">
                    <FormLabel>Location Photo</FormLabel>
                    <div className="flex flex-col gap-2">
                      {editForm.watch("photoDataUrl") ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                          <img
                            src={editForm.watch("photoDataUrl")}
                            alt="Location preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              editForm.setValue("photoDataUrl", "");
                              editForm.setValue("photoFileName", "");
                            }}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="w-full rounded-lg border border-dashed border-muted-foreground/25 px-3 py-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            const input = document.getElementById("edit-location-photo-upload") as HTMLInputElement | null;
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
                              editForm.setValue("photoDataUrl", String(reader.result || ""));
                              editForm.setValue("photoFileName", file.name);
                            };
                            reader.readAsDataURL(file);
                          }
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto"
                  >
                    <Button type="submit" className="gap-2 w-full sm:w-auto">
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                  </motion.div>
                </DialogFooter>
              </form>
            </Form>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialogs with animations */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete location?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the location.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <AlertDialogAction onClick={confirmDelete} className="w-full sm:w-auto">Delete</AlertDialogAction>
              </motion.div>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}