import { useEffect, useMemo, useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { useSearchParams } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Car,
  Calendar,
  Gauge,
  AlertCircle,
  User,
  AlertTriangle,
  Wrench,
  Clock,
  Camera,
  FileText,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { createResource, deleteResource, listResource, updateResource, getResource, toProxiedUrl, apiFetch } from "@/lib/admin/apiClient";
import DropboxFilePicker, { type DropboxSelectedFile, formatBytes, DropboxIcon } from "@/components/admin/DropboxFilePicker";
import { getAuthState } from "@/lib/auth";
import { ROLE_GROUPS } from "@/constants/roles";
import { Pagination } from "@/components/Pagination";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface Vehicle {
  id: string;
  frontendId: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  vin: string;
  mileage: string;
  status: "active" | "maintenance" | "inactive";
  lastInspection: string;
  nextInspection: string;
  assignedTo: string;
  insuranceInfo?: string;
  documents?: { fileName: string; dataUrl: string }[];
  tagPhotoFileName?: string;
  tagPhotoDataUrl?: string;
  requiresInspection?: boolean;
  needs?: {
    id: string;
    taskName: string;
    assignee: string;
    dueDate: string;
    completed: boolean;
    parts?: { name: string; cost: number }[];
  }[];
}

interface Employee {
  id: string;
  name: string;
  initials: string;
  email: string;
  status: "active" | "inactive" | "on-leave";
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee";
  status: "active" | "inactive" | "pending";
}

// Enhanced status classes with beautiful gradients
const statusClasses = {
  active: "bg-gradient-to-r from-success/20 to-success/10 text-success border-success/20 shadow-sm",
  maintenance: "bg-gradient-to-r from-warning/20 to-warning/10 text-warning border-warning/20 shadow-sm",
  inactive: "bg-gradient-to-r from-muted to-muted/50 text-muted-foreground border-muted-foreground/20 shadow-sm",
};

const pieColors = ["#22c55e", "#f59e0b", "#94a3b8", "#ef4444", "#3b82f6"]; 

const getInitials = (name: string) => {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const toDateOnly = (value: string) => {
  const v = String(value || "").trim();
  if (!v) return "";
  const idx = v.indexOf("T");
  return idx >= 0 ? v.slice(0, idx) : v;
};

type BackendVehicle = Partial<Vehicle> & {
  _id?: string;
  name?: string;
  type?: string;
  frontendId?: string;
};

function normalizeVehicle(v: BackendVehicle): Vehicle {
  const id = String(v.id || v._id || "").trim();
  const frontendId = String(v.frontendId || "").trim();
  const makeRaw = String(v.make || "").trim();
  const modelRaw = String(v.model || "").trim();
  const yearRaw = String(v.year || "").trim();
  const nameRaw = String(v.name || "").trim();

  // If API returns manager-style `name`, use it as the visible label (store in `make` so UI shows it)
  const make = makeRaw || nameRaw;

  return {
    id,
    frontendId,
    make,
    model: modelRaw,
    year: yearRaw,
    licensePlate: String(v.licensePlate || "").trim(),
    vin: String(v.vin || "").trim(),
    mileage: String(v.mileage || "").trim(),
    status: (String(v.status || "active") as Vehicle["status"]) || "active",
    lastInspection: toDateOnly(String(v.lastInspection || "").trim()),
    nextInspection: toDateOnly(String(v.nextInspection || "").trim()),
    assignedTo: String(v.assignedTo || "-").trim() || "-",
    insuranceInfo: String(v.insuranceInfo || "").trim(),
    documents: Array.isArray(v.documents) ? v.documents : [],
    tagPhotoFileName: String(v.tagPhotoFileName || "").trim() || undefined,
    tagPhotoDataUrl: String(v.tagPhotoDataUrl || "").trim() || undefined,
    requiresInspection: v.requiresInspection !== false,
    needs: v.needs || [],
  };
}

function isImageFile(file: File) {
  const t = String(file.type || "").toLowerCase();
  return t.startsWith("image/");
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Invalid image"));
    i.src = dataUrl;
  });

  const maxW = 1600;
  const maxH = 1600;
  const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);

  const quality = 0.75;
  const mime = "image/jpeg";
  return canvas.toDataURL(mime, quality);
}

function parseISODate(date: string) {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(date: string) {
  const d = parseISODate(date);
  if (!d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = d.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

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
} as const;

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

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 17,
    },
  },
};

const LazyVehiclePhoto = ({ vehicleId, model, className }: { vehicleId: string, model: string, className?: string }) => {
  const { data } = useQuery({
    queryKey: ["vehicle-photo", vehicleId],
    queryFn: async () => {
      return apiFetch<{ photo: string, fileName: string }>(`/api/vehicles/${vehicleId}/photo`);
    },
    staleTime: 5 * 60 * 1000,
  });

  const photoSrc = data?.photo ? (toProxiedUrl(data.photo) || data.photo) : null;

  if (photoSrc) {
    return <img src={photoSrc} alt={model} className={`object-cover ${className}`} />;
  }
  
  return (
    <div className={`bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 ${className}`}>
      <Car className="h-1/2 w-1/2 text-primary opacity-50" />
    </div>
  );
};

const Vehicles = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editVehicleOpen, setEditVehicleOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newNeedTaskName, setNewNeedTaskName] = useState("");
  const [newNeedAssignee, setNewNeedAssignee] = useState("");
  const [newNeedDueDate, setNewNeedDueDate] = useState("");
  const [isUpdatingNeed, setIsUpdatingNeed] = useState(false);
  const [activeRowPartsNeedId, setActiveRowPartsNeedId] = useState<string | null>(null);

  const handleAddNeed = async () => {
    if (!selectedVehicle || !newNeedTaskName.trim()) return;
    try {
      setIsUpdatingNeed(true);
      const newNeed = {
        id: `NEED-${Date.now()}`,
        taskName: newNeedTaskName.trim(),
        assignee: newNeedAssignee,
        dueDate: newNeedDueDate,
        completed: false,
      };
      
      const updatedNeeds = [...(selectedVehicle.needs || []), newNeed];
      
      const res = await updateResource<Vehicle>("vehicles", selectedVehicle.id, {
        needs: updatedNeeds
      });
      
      const updatedVehicle = res?.item || res;
      if (updatedVehicle) {
        setSelectedVehicle(updatedVehicle);
        setNewNeedTaskName("");
        setNewNeedAssignee("");
        setNewNeedDueDate("");
      }
      refreshVehicles();
    } catch (e) {
      console.error("Failed to add need", e);
    } finally {
      setIsUpdatingNeed(false);
    }
  };

  const handleUpdateNeedsForVehicle = async (vehicle: Vehicle, updatedNeeds: any[]) => {
    try {
      const res = await updateResource<Vehicle>("vehicles", vehicle.id, {
        needs: updatedNeeds
      });
      const updatedVehicle = res?.item || res;
      if (selectedVehicle && selectedVehicle.id === vehicle.id) {
        setSelectedVehicle(updatedVehicle);
      }
      refreshVehicles();
    } catch (e) {
      console.error("Failed to update needs for vehicle", e);
    }
  };

  const handleToggleNeed = async (needId: string) => {
    if (!selectedVehicle) return;
    try {
      const updatedNeeds = (selectedVehicle.needs || []).map(n =>
        n.id === needId ? { ...n, completed: !n.completed } : n
      );
      
      const res = await updateResource<Vehicle>("vehicles", selectedVehicle.id, {
        needs: updatedNeeds
      });
      
      const updatedVehicle = res?.item || res;
      if (updatedVehicle) {
        setSelectedVehicle(updatedVehicle);
      }
      refreshVehicles();
    } catch (e) {
      console.error("Failed to toggle need", e);
    }
  };

  const handleDeleteNeed = async (needId: string) => {
    if (!selectedVehicle) return;
    try {
      const updatedNeeds = (selectedVehicle.needs || []).filter(n => n.id !== needId);
      
      const res = await updateResource<Vehicle>("vehicles", selectedVehicle.id, {
        needs: updatedNeeds
      });
      
      const updatedVehicle = res?.item || res;
      if (updatedVehicle) {
        setSelectedVehicle(updatedVehicle);
      }
      refreshVehicles();
    } catch (e) {
      console.error("Failed to delete need", e);
    }
  };

  const handleAddNeedForVehicle = async (vehicle: Vehicle, taskName: string, assignee: string, dueDate: string) => {
    if (!taskName.trim()) return;
    try {
      const newNeed = {
        id: `NEED-${Date.now()}`,
        taskName: taskName.trim(),
        assignee,
        dueDate,
        completed: false,
      };
      
      const updatedNeeds = [...(vehicle.needs || []), newNeed];
      
      const res = await updateResource<Vehicle>("vehicles", vehicle.id, {
        needs: updatedNeeds
      });
      
      const updatedVehicle = res?.item || res;
      if (selectedVehicle && selectedVehicle.id === vehicle.id) {
        setSelectedVehicle(updatedVehicle);
      }
      refreshVehicles();
    } catch (e) {
      console.error("Failed to add need for vehicle", e);
    }
  };

  const handleToggleNeedForVehicle = async (vehicle: Vehicle, needId: string) => {
    try {
      const updatedNeeds = (vehicle.needs || []).map(n =>
        n.id === needId ? { ...n, completed: !n.completed } : n
      );
      
      const res = await updateResource<Vehicle>("vehicles", vehicle.id, {
        needs: updatedNeeds
      });
      
      const updatedVehicle = res?.item || res;
      if (selectedVehicle && selectedVehicle.id === vehicle.id) {
        setSelectedVehicle(updatedVehicle);
      }
      refreshVehicles();
    } catch (e) {
      console.error("Failed to toggle need for vehicle", e);
    }
  };

  const handleDeleteNeedForVehicle = async (vehicle: Vehicle, needId: string) => {
    try {
      const updatedNeeds = (vehicle.needs || []).filter(n => n.id !== needId);
      
      const res = await updateResource<Vehicle>("vehicles", vehicle.id, {
        needs: updatedNeeds
      });
      
      const updatedVehicle = res?.item || res;
      if (selectedVehicle && selectedVehicle.id === vehicle.id) {
        setSelectedVehicle(updatedVehicle);
      }
      refreshVehicles();
    } catch (e) {
      console.error("Failed to delete need for vehicle", e);
    }
  };

  const [apiError, setApiError] = useState<string | null>(null);
  const [hoveredVehicle, setHoveredVehicle] = useState<string | null>(null);
  const [expandedVehicles, setExpandedVehicles] = useState<Record<string, boolean>>({});
  const [activeView, setActiveView] = useState<"fleet" | "needs">("fleet");
  const [expandedNeedsView, setExpandedNeedsView] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isVehicleDropboxPickerOpen, setIsVehicleDropboxPickerOpen] = useState(false);
  const [vehicleDropboxDocs, setVehicleDropboxDocs] = useState<DropboxSelectedFile[]>([]);
  const currentRole = getAuthState().role || "";
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 25;
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    vin: "",
    mileage: "",
    status: "active" as Vehicle["status"],
    lastInspection: "",
    nextInspection: "",
    assignedTo: "",
    insuranceInfo: "",
    documents: [] as { fileName: string; dataUrl: string }[],
    tagPhotoFileName: "",
    tagPhotoDataUrl: "",
    requiresInspection: true,
  });

  const [tagPhotoFile, setTagPhotoFile] = useState<File | null>(null);
  const [editTagPhotoFile, setEditTagPhotoFile] = useState<File | null>(null);

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const getVehicleTagPhotoSrc = (v?: Partial<Vehicle> | null) => {
    if (!v) return null;
    const dataUrl = String(v.tagPhotoDataUrl || "").trim();
    if (dataUrl) return toProxiedUrl(dataUrl) || dataUrl;
    const fileName = String(v.tagPhotoFileName || "").trim();
    if (!fileName) return null;
    if (fileName.startsWith("data:")) return fileName;
    if (fileName.startsWith("http://") || fileName.startsWith("https://")) return toProxiedUrl(fileName) || fileName;
    if (fileName.startsWith("/")) return fileName;
    return null;
  };

  const queryClient = useQueryClient();

  // Fetch employees and users in parallel once
  const { data: allAssignees = [] } = useQuery({
    queryKey: ["vehicle-assignees"],
    queryFn: async () => {
      const [employeeList, userList] = await Promise.all([
        listResource<Employee>("employees").catch(() => []),
        listResource<User>("users").catch(() => []),
      ]);

      const allEmployees: Employee[] = Array.isArray(employeeList) 
        ? (employeeList as Employee[]).filter((e: Employee) => e.status === "active")
        : [];

      if (Array.isArray(userList)) {
        const employeeUsers: Employee[] = (userList as User[])
          .filter((u: User) => u.role === "employee" && (u.status === "active" || u.status === "pending"))
          .map((u: User) => ({
            id: u.id,
            name: u.name,
            initials: getInitials(u.name),
            email: u.email,
            status: "active" as const,
          }));
        
        employeeUsers.forEach((eu: Employee) => {
          if (!allEmployees.some((e: Employee) => e.email === eu.email)) {
            allEmployees.push(eu);
          }
        });
      }
      return allEmployees;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (allAssignees.length > 0) {
      setEmployees(allAssignees);
    }
  }, [allAssignees]);

  // Fetch vehicles with TanStack Query
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", currentPage, searchQuery],
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // 1 minute
    queryFn: async () => {
      const res = await listResource<BackendVehicle>("vehicles", { 
        page: currentPage, 
        limit: PAGE_SIZE,
        search: searchQuery 
      });
      
      let items: BackendVehicle[] = [];
      let total = 1;

      if (res && typeof res === "object" && "items" in res) {
        items = res.items as BackendVehicle[];
        total = res.pagination?.totalPages || 1;
      } else if (Array.isArray(res)) {
        items = res;
      }

      return {
        items: items,
        totalPages: total
      };
    },
  });

  const rawVehiclesList = vehiclesQuery.data?.items || [];
  const vehiclesList = useMemo(() => {
    return rawVehiclesList.map(normalizeVehicle);
  }, [rawVehiclesList, employees]);
  const totalPagesCount = vehiclesQuery.data?.totalPages || 1;
  const loading = vehiclesQuery.isLoading;

  useEffect(() => {
    if (vehiclesQuery.error) {
      setApiError(vehiclesQuery.error instanceof Error ? vehiclesQuery.error.message : "Failed to load vehicles");
    }
  }, [vehiclesQuery.error]);

  useEffect(() => {
    setTotalPages(totalPagesCount);
  }, [totalPagesCount]);

  const refreshVehicles = () => {
    void vehiclesQuery.refetch();
  };


  const [formError, setFormError] = useState<string | null>(null);

  const handleVehiclePhotoSelected = async (f: File | null) => {
    setTagPhotoFile(f);
    if (!f) {
      setFormData((p) => ({ ...p, tagPhotoFileName: "", tagPhotoDataUrl: "" }));
      return;
    }

    if (!isImageFile(f)) {
      setFormError("Please select a valid image file");
      setTagPhotoFile(null);
      setFormData((p) => ({ ...p, tagPhotoFileName: "", tagPhotoDataUrl: "" }));
      return;
    }

    if (f.size > MAX_IMAGE_BYTES) {
      setFormError("Image size is too large. Max 10MB");
      setTagPhotoFile(null);
      setFormData((p) => ({ ...p, tagPhotoFileName: "", tagPhotoDataUrl: "" }));
      return;
    }

    try {
      setFormError(null);
      const url = await compressImageToDataUrl(f);
      setFormData((p) => ({ ...p, tagPhotoFileName: f.name, tagPhotoDataUrl: url }));
    } catch {
      setFormError("Failed to process image. Please try a different file");
      setTagPhotoFile(null);
      setFormData((p) => ({ ...p, tagPhotoFileName: "", tagPhotoDataUrl: "" }));
    }
  };

  const handleAddVehicle = async () => {
    // Validation with user-friendly error messages
    if (!formData.make || !formData.model || !formData.year || !formData.licensePlate) {
      const missingFields = [];
      if (!formData.make) missingFields.push("Make");
      if (!formData.model) missingFields.push("Model");
      if (!formData.year) missingFields.push("Year");
      if (!formData.licensePlate) missingFields.push("License Plate");
      setFormError(`Please fill in the required fields: ${missingFields.join(", ")}`);
      return;
    }
    setFormError(null);
    try {
      setApiError(null);
      setIsAdding(true);

      let tagPhotoDataUrl = String(formData.tagPhotoDataUrl || "").trim();
      if (!tagPhotoDataUrl && tagPhotoFile) {
        tagPhotoDataUrl = await compressImageToDataUrl(tagPhotoFile);
      }

      const newVehiclePayload = {
        make: formData.make,
        model: formData.model,
        year: formData.year,
        licensePlate: formData.licensePlate,
        vin: formData.vin,
        mileage: formData.mileage,
        status: formData.status,
        lastInspection: formData.lastInspection,
        nextInspection: formData.nextInspection,
        assignedTo: formData.assignedTo || "-",
        insuranceInfo: formData.insuranceInfo,
        documents: formData.documents,
        tagPhotoFileName: formData.tagPhotoFileName || "",
        tagPhotoDataUrl,
        requiresInspection: formData.requiresInspection,
      };
      await createResource("vehicles", newVehiclePayload);
      await refreshVehicles();
      setAddVehicleOpen(false);
      setFormError(null);
      setFormData({
        make: "",
        model: "",
        year: "",
        licensePlate: "",
        vin: "",
        mileage: "",
        status: "active",
        lastInspection: "",
        nextInspection: "",
        assignedTo: "",
        insuranceInfo: "",
        documents: [],
        tagPhotoFileName: "",
        tagPhotoDataUrl: "",
        requiresInspection: true,
      });
      setTagPhotoFile(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to add vehicle");
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewDetails = async (vehicle: Vehicle) => {
    try {
      setApiError(null);
      // Fetch full vehicle to get tagPhotoDataUrl
      const fullVehicle = await getResource<BackendVehicle>("vehicles", vehicle.id);
      setSelectedVehicle(normalizeVehicle(fullVehicle));
      setViewDetailsOpen(true);
    } catch (e) {
      setApiError("Failed to fetch vehicle details");
      setSelectedVehicle(vehicle); // Fallback to list data
      setViewDetailsOpen(true);
    }
  };

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    if (!viewId) return;
    if (viewDetailsOpen || editVehicleOpen || removeConfirmOpen || addVehicleOpen) return;

    const match = vehiclesList.find((v) => String(v.id) === viewId);
    if (!match) return;

    handleViewDetails(match);

    const next = new URLSearchParams(searchParams);
    next.delete("view");
    setSearchParams(next, { replace: true });
  }, [
    vehiclesList,
    searchParams,
    setSearchParams,
    viewDetailsOpen,
    editVehicleOpen,
    removeConfirmOpen,
    addVehicleOpen,
  ]);

  const handleEditVehicle = async (vehicle: Vehicle) => {
    try {
      setApiError(null);
      // Fetch full vehicle to get tagPhotoDataUrl
      const fullVehicle = await getResource<BackendVehicle>("vehicles", vehicle.id);
      const normalized = normalizeVehicle(fullVehicle);
      setSelectedVehicle(normalized);
      setEditTagPhotoFile(null);
      setEditFormData({
        make: normalized.make,
        model: normalized.model,
        year: normalized.year,
        licensePlate: normalized.licensePlate,
        vin: normalized.vin,
        mileage: normalized.mileage,
        status: normalized.status,
        lastInspection: normalized.lastInspection,
        nextInspection: normalized.nextInspection,
        assignedTo: normalized.assignedTo,
        insuranceInfo: normalized.insuranceInfo || "",
        documents: normalized.documents || [],
        tagPhotoFileName: normalized.tagPhotoFileName || "",
        tagPhotoDataUrl: normalized.tagPhotoDataUrl || "",
        requiresInspection: normalized.requiresInspection !== false,
      });
      setEditVehicleOpen(true);
    } catch (e) {
      setApiError("Failed to fetch vehicle details for editing");
      // Fallback
      setSelectedVehicle(vehicle);
      setEditTagPhotoFile(null);
      setEditFormData({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin,
        mileage: vehicle.mileage,
        status: vehicle.status,
        lastInspection: vehicle.lastInspection,
        nextInspection: vehicle.nextInspection,
        assignedTo: vehicle.assignedTo,
        insuranceInfo: vehicle.insuranceInfo || "",
        documents: vehicle.documents || [],
        tagPhotoFileName: vehicle.tagPhotoFileName || "",
        tagPhotoDataUrl: vehicle.tagPhotoDataUrl || "",
        requiresInspection: vehicle.requiresInspection !== false,
      });
      setEditVehicleOpen(true);
    }
  };

  const [editFormData, setEditFormData] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    vin: "",
    mileage: "",
    status: "active" as Vehicle["status"],
    lastInspection: "",
    nextInspection: "",
    assignedTo: "",
    insuranceInfo: "",
    documents: [] as { fileName: string; dataUrl: string }[],
    tagPhotoFileName: "",
    tagPhotoDataUrl: "",
    requiresInspection: true,
  });

  const [editFormError, setEditFormError] = useState<string | null>(null);

  const saveEditVehicle = async () => {
    if (!selectedVehicle) return;
    // Validation with user-friendly error messages
    if (!editFormData.make || !editFormData.model || !editFormData.year || !editFormData.licensePlate) {
      const missingFields = [];
      if (!editFormData.make) missingFields.push("Make");
      if (!editFormData.model) missingFields.push("Model");
      if (!editFormData.year) missingFields.push("Year");
      if (!editFormData.licensePlate) missingFields.push("License Plate");
      setEditFormError(`Please fill in the required fields: ${missingFields.join(", ")}`);
      return;
    }
    setEditFormError(null);
    try {
      setIsSaving(true);
      setApiError(null);
      let tagPhotoDataUrl = String(editFormData.tagPhotoDataUrl || "").trim();
      if (editTagPhotoFile) {
        try { tagPhotoDataUrl = await compressImageToDataUrl(editTagPhotoFile); } catch { tagPhotoDataUrl = ""; }
      }
      await updateResource<Vehicle>("vehicles", selectedVehicle.id, {
        ...selectedVehicle,
        make: editFormData.make,
        model: editFormData.model,
        year: editFormData.year,
        licensePlate: editFormData.licensePlate,
        vin: editFormData.vin,
        mileage: editFormData.mileage,
        status: editFormData.status,
        lastInspection: editFormData.lastInspection,
        nextInspection: editFormData.nextInspection,
        assignedTo: editFormData.assignedTo || "-",
        insuranceInfo: editFormData.insuranceInfo,
        documents: editFormData.documents,
        tagPhotoFileName: editFormData.tagPhotoFileName || "",
        tagPhotoDataUrl,
        requiresInspection: editFormData.requiresInspection,
      });
      await refreshVehicles();
      setEditVehicleOpen(false);
      setSelectedVehicle(null);
      setEditFormError(null);
      setEditTagPhotoFile(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update vehicle");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveConfirm = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setRemoveConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!selectedVehicle) return;
    try {
      setApiError(null);
      await deleteResource("vehicles", selectedVehicle.id);
      await refreshVehicles();
      setRemoveConfirmOpen(false);
      setSelectedVehicle(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to remove vehicle");
    }
  };

  const filteredVehicles = vehiclesList;

  const vehiclesStatusData = useMemo(() => {
    const map: Record<string, number> = { active: 0, maintenance: 0, inactive: 0, available: 0 };
    for (const v of vehiclesList) map[v.status] = (map[v.status] ?? 0) + 1;
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [vehiclesList]);

  const inspectionsDueCount = useMemo(() => {
    const DUE_SOON_DAYS = 30;
    return vehiclesList.filter((v) => {
      const d = daysUntil(v.nextInspection);
      if (d === null) return false;
      return d <= DUE_SOON_DAYS;
    }).length;
  }, [vehiclesList]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active':
        return <Car className="h-3 w-3" />;
      case 'maintenance':
        return <Wrench className="h-3 w-3" />;
      case 'inactive':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
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
          transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
        >
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Car className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </motion.div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Vehicle Management
                </h1>
              </div>
              <p className="text-xs sm:text-sm md:text-sm text-muted-foreground max-w-3xl">
                Track fleet vehicles, inspections, and maintenance schedules.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary transition-all shadow-sm"
                />
              </div>
            <Dialog open={addVehicleOpen} onOpenChange={setAddVehicleOpen}>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white w-full sm:w-auto mt-2 sm:mt-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="sm:hidden">Add</span>
                    <span className="hidden sm:inline">Add Vehicle</span>
                  </Button>
                </motion.div>
              </DialogTrigger>
              
              <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="space-y-1.5 sm:space-y-2">
                  <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Add Vehicle
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Create a new vehicle record and add it to your fleet
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 py-2 min-h-0">
                  <motion.form 
                    className="space-y-4 sm:space-y-5" 
                    onSubmit={(e) => { e.preventDefault(); handleAddVehicle(); }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                  {/* Form Validation Error */}
                  <AnimatePresence>
                    {formError && (
                      <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        transition={{ type: "spring" as const, stiffness: 500, damping: 30 }}
                        className="rounded-lg bg-destructive/10 p-3 sm:p-4 border border-destructive/20"
                      >
                        <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {formError}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Make, Model, Year */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">Make *</label>
                      <input
                        type="text"
                        value={formData.make}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Ford"
                        required
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">Model *</label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="F-150"
                        required
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">Year *</label>
                      <input
                        type="text"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="2024"
                        required
                      />
                    </div>
                  </div>

                  {/* License Plate & VIN */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">License Plate *</label>
                      <input
                        type="text"
                        value={formData.licensePlate}
                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="ABC-1234"
                        required
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">VIN</label>
                      <input
                        type="text"
                        value={formData.vin}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="1FTEW1EP5NFA12345"
                      />
                    </div>
                  </div>

                  {/* Mileage, Assigned To, Status */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">Mileage</label>
                      <input
                        type="text"
                        value={formData.mileage}
                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="25,430 mi"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">Assigned To</label>
                      <select
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-white h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="">Select assignee</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.name}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                      {employees.length === 0 && (
                        <p className="text-xs text-warning mt-1">No employees found.</p>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as Vehicle["status"] })
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-white h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Inspection Dates */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">Last Inspection</label>
                      <input
                        type="date"
                        value={formData.lastInspection}
                        onChange={(e) => setFormData({ ...formData, lastInspection: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">Next Inspection</label>
                      <input
                        type="date"
                        value={formData.nextInspection}
                        onChange={(e) => setFormData({ ...formData, nextInspection: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="requires-inspection-add"
                      checked={formData.requiresInspection}
                      onChange={(e) => setFormData({ ...formData, requiresInspection: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="requires-inspection-add" className="text-sm font-medium">
                      Requires Regular Inspections
                    </label>
                  </div>

                  {/* Insurance Info */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Insurance Information</label>
                    <Input
                      value={formData.insuranceInfo}
                      onChange={(e) => setFormData({ ...formData, insuranceInfo: e.target.value })}
                      placeholder="Policy #, Provider, Expiration"
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                   {/* Document Upload */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Vehicle Documents</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.documents.map((doc, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1">
                          {doc.fileName}
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, documents: formData.documents.filter((_, i) => i !== idx) })}
                            className="text-destructive hover:text-destructive/80"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      {vehicleDropboxDocs.map((dbf, idx) => (
                        <Badge key={`dbx-${idx}`} variant="secondary" className="flex items-center gap-1.5 py-1 bg-blue-500/10 text-blue-700 border-blue-200">
                          <DropboxIcon size={10} />
                          {dbf.file_name}
                          {dbf.file_size > 0 && <span className="text-[10px] opacity-70">{formatBytes(dbf.file_size)}</span>}
                          <button
                            type="button"
                            onClick={() => setVehicleDropboxDocs((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-destructive hover:text-destructive/80"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 border-dashed"
                        onClick={() => document.getElementById("vehicle-doc-input")?.click()}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Document
                      </Button>
                      {ROLE_GROUPS.DROPBOX_ALLOWED.includes(currentRole) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 border-dashed flex items-center justify-center gap-2"
                          onClick={() => setIsVehicleDropboxPickerOpen(true)}
                        >
                          <DropboxIcon size={14} /> Dropbox
                        </Button>
                      )}
                    </div>
                    <input
                      id="vehicle-doc-input"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        const newDocs = await Promise.all(
                          files.map(async (f) => ({
                            fileName: f.name,
                            dataUrl: await readFileAsDataUrl(f),
                          }))
                        );
                        setFormData({ ...formData, documents: [...formData.documents, ...newDocs] });
                      }}
                    />
                  </div>

                  {/* Vehicle Photo Upload */}
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">Vehicle Photo</label>
                      <motion.div
                        className="w-full rounded-lg border px-3 py-3 text-sm sm:text-base bg-gradient-to-br from-muted/20 to-muted/5 hover:from-muted/30 hover:to-muted/10 transition-all cursor-pointer"
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files?.[0];
                          void handleVehiclePhotoSelected(f || null);
                        }}
                        onClick={() => {
                          const el = document.getElementById("vehicle-photo-input") as HTMLInputElement | null;
                          el?.click();
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            const el = document.getElementById("vehicle-photo-input") as HTMLInputElement | null;
                            el?.click();
                          }
                        }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">
                              {tagPhotoFile ? tagPhotoFile.name : formData.tagPhotoFileName || "Click to choose or drag & drop"}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              Max 10MB
                            </p>
                          </div>
                          <Camera className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <input
                          id="vehicle-photo-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            void handleVehiclePhotoSelected(f);
                          }}
                        />
                      </motion.div>
                    </div>
                    {formData.tagPhotoDataUrl && (
                      <div className="mt-2">
                        <img src={formData.tagPhotoDataUrl} alt="Vehicle preview" className="h-20 w-20 object-contain rounded-lg border" />
                      </div>
                    )}
                    </div>
                  </motion.form>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto"
                  >
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setAddVehicleOpen(false)}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto"
                  >
                    <Button 
                      type="button"
                      onClick={handleAddVehicle}
                      disabled={isAdding}
                      className="bg-gradient-to-r from-primary to-primary/80 text-white w-full sm:w-auto order-1 sm:order-2 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isAdding ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                          Add Vehicle
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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

        {/* Summary Cards - Animated Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start"
        >
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm w-full">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg font-semibold">Vehicles by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] sm:h-[280px] md:h-[300px] px-2 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <Pie
                    data={vehiclesStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={35}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ name, percent, value }) => value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""}
                    labelLine={false}
                  >
                    {vehiclesStatusData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <motion.div className="grid grid-cols-2 gap-3 sm:gap-4" variants={containerVariants}>
            {[
              { label: "Total Vehicles", value: vehiclesList.length, icon: Car, color: "primary" },
              { label: "Active", value: vehiclesList.filter((v) => v.status === "active").length, icon: Car, color: "success" },
              { label: "In Maintenance", value: vehiclesList.filter((v) => v.status === "maintenance").length, icon: Wrench, color: "warning" },
              { label: "Inspections Due", value: inspectionsDueCount, icon: Calendar, color: "destructive" },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={itemVariants}
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
              >
                <Card className={`shadow-lg border-0 bg-gradient-to-br from-${item.color}/10 to-${item.color}/5 backdrop-blur-sm overflow-hidden`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <motion.div
                        className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-${item.color}/10 flex items-center justify-center flex-shrink-0`}
                        whileHover={{ rotate: 10 }}
                        transition={{ type: "spring" as const, stiffness: 300, damping: 10 }}
                      >
                        <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${item.color}`} />
                      </motion.div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.label}</p>
                        <p className="text-xl sm:text-2xl font-bold">{item.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Vehicles Card */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-muted/20 flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Fleet Vehicles
                {filteredVehicles.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                    {filteredVehicles.length} vehicles
                  </Badge>
                )}
              </CardTitle>

              {/* View Toggle */}
              <div className="flex bg-muted/60 p-1 rounded-lg border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveView("fleet")}
                  className={`px-3 py-1.5 rounded-md transition-all ${activeView === "fleet" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Fleet List
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("needs")}
                  className={`px-3 py-1.5 rounded-md transition-all ${activeView === "needs" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Vehicle Needs
                </button>
              </div>
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
              ) : activeView === "fleet" ? (
                <>
                  {/* Mobile View - Cards */}
                  <div className="block sm:hidden space-y-3 p-4">
                    <AnimatePresence>
                      {filteredVehicles.map((vehicle, index) => (
                        <motion.div
                          key={vehicle.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          onHoverStart={() => setHoveredVehicle(vehicle.id)}
                          onHoverEnd={() => setHoveredVehicle(null)}
                          className="bg-gradient-to-br from-card to-card/50 rounded-xl border p-4 space-y-3 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {/* Header with Photo and Actions */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring" as const, stiffness: 300, damping: 10 }}
                              >
                                <LazyVehiclePhoto 
                                  vehicleId={vehicle.id} 
                                  model={vehicle.model} 
                                  className="h-10 w-10 rounded-lg ring-2 ring-primary/20" 
                                />
                              </motion.div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate flex items-center gap-2">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                  {hoveredVehicle === vehicle.id && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="inline-block w-1.5 h-1.5 bg-primary rounded-full"
                                    />
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">{vehicle.licensePlate}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(vehicle)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditVehicle(vehicle)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Vehicle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRemoveConfirm(vehicle)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Status Badge */}
                          <div className="flex justify-start">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge className={`${statusClasses[vehicle.status]} text-xs flex items-center gap-1`} variant="secondary">
                                {getStatusIcon(vehicle.status)}
                                {vehicle.status}
                              </Badge>
                            </motion.div>
                          </div>

                          {/* License Plate & VIN */}
                          <div className="grid grid-cols-2 gap-2">
                            <motion.div whileHover={{ x: 5 }}>
                              <p className="text-xs text-muted-foreground">License Plate</p>
                              <p className="text-sm font-mono truncate">{vehicle.licensePlate}</p>
                            </motion.div>
                            {vehicle.vin && (
                              <motion.div whileHover={{ x: 5 }}>
                                <p className="text-xs text-muted-foreground">VIN</p>
                                <p className="text-xs truncate">{vehicle.vin.slice(-6)}</p>
                              </motion.div>
                            )}
                          </div>

                          {/* Mileage & Assigned To */}
                          <div className="grid grid-cols-2 gap-2">
                            <motion.div 
                              className="flex items-center gap-1"
                              whileHover={{ x: 5 }}
                            >
                              <Gauge className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm">{vehicle.mileage || "—"}</span>
                            </motion.div>
                            <motion.div 
                              className="flex items-center gap-1"
                              whileHover={{ x: 5 }}
                            >
                              <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate">{vehicle.assignedTo}</span>
                            </motion.div>
                          </div>

                          {vehicle.requiresInspection && (
                            <motion.div 
                              className="pt-2 border-t"
                              whileHover={{ x: 5 }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-muted-foreground">Next Inspection</p>
                                  <p className="text-sm">{toDateOnly(vehicle.nextInspection) || "—"}</p>
                                </div>
                                {(() => {
                                  const d = daysUntil(vehicle.nextInspection);
                                  if (d === null) return null;
                                  if (d < 0) {
                                    return (
                                      <Badge variant="secondary" className="bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive text-xs">
                                        Overdue
                                      </Badge>
                                    );
                                  }
                                  if (d <= 30) {
                                    return (
                                      <Badge variant="secondary" className="bg-gradient-to-r from-warning/20 to-warning/10 text-warning text-xs">
                                        Due in {d}d
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </motion.div>
                          )}

                          <VehicleNeedsSection
                            vehicle={vehicle}
                            employees={employees}
                            onAddNeed={handleAddNeedForVehicle}
                            onToggleNeed={handleToggleNeedForVehicle}
                            onDeleteNeed={handleDeleteNeedForVehicle}
                            onUpdateNeeds={handleUpdateNeedsForVehicle}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {filteredVehicles.length === 0 && (
                      <motion.div 
                        className="text-center py-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex justify-center mb-3">
                          <motion.div 
                            className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Car className="h-6 w-6 text-muted-foreground" />
                          </motion.div>
                        </div>
                        <p className="text-sm text-muted-foreground">No vehicles found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try adjusting your search or add a new vehicle
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Tablet/Desktop View - Table */}
                  <div className="hidden sm:block w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs md:text-sm whitespace-nowrap px-4 py-3">Vehicle</TableHead>
                          <TableHead className="text-xs md:text-sm whitespace-nowrap px-4 py-3">Asset ID</TableHead>
                          <TableHead className="text-xs md:text-sm whitespace-nowrap px-4 py-3">License Plate</TableHead>
                          <TableHead className="text-xs md:text-sm whitespace-nowrap px-4 py-3">Mileage</TableHead>
                          <TableHead className="text-xs md:text-sm whitespace-nowrap px-4 py-3">Assigned To</TableHead>
                          <TableHead className="text-xs md:text-sm whitespace-nowrap px-4 py-3">Status</TableHead>
                          <TableHead className="text-xs md:text-sm whitespace-nowrap px-4 py-3">Next Inspection</TableHead>
                          <TableHead className="text-right text-xs md:text-sm px-4 py-3">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredVehicles.map((vehicle, index) => (
                            <Fragment key={vehicle.id}>
                              <motion.tr
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ 
                                  scale: 1.01,
                                  backgroundColor: "rgba(59, 130, 246, 0.05)",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                }}
                                onHoverStart={() => setHoveredVehicle(vehicle.id)}
                                onHoverEnd={() => setHoveredVehicle(null)}
                                className="cursor-pointer transition-all duration-300"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedVehicles(prev => ({ ...prev, [vehicle.id]: !prev[vehicle.id] }));
                                      }}
                                      className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                                      title="Toggle Needs Checklist"
                                    >
                                      <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${expandedVehicles[vehicle.id] ? "rotate-180" : ""}`} />
                                    </button>
                                    <motion.div
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      transition={{ type: "spring" as const, stiffness: 300, damping: 10 }}
                                    >
                                      <LazyVehiclePhoto 
                                        vehicleId={vehicle.id} 
                                        model={vehicle.model} 
                                        className="h-9 w-9 md:h-10 md:w-10 rounded-lg ring-2 ring-primary/20" 
                                      />
                                    </motion.div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm md:text-sm whitespace-nowrap flex items-center gap-2">
                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                        {hoveredVehicle === vehicle.id && (
                                          <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="inline-block w-1.5 h-1.5 bg-primary rounded-full"
                                          />
                                        )}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{vehicle.licensePlate}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm md:text-sm">
                                  {vehicle.frontendId}
                                </TableCell>
                                <TableCell className="font-mono text-sm md:text-sm">
                                  {vehicle.licensePlate}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5 text-sm md:text-sm">
                                    <Gauge className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span>{vehicle.mileage || "—"}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm md:text-sm whitespace-nowrap">
                                  {vehicle.assignedTo}
                                </TableCell>
                                <TableCell>
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Badge className={`${statusClasses[vehicle.status]} text-xs md:text-sm flex items-center gap-1 w-fit`} variant="secondary">
                                      {getStatusIcon(vehicle.status)}
                                      {vehicle.status}
                                    </Badge>
                                  </motion.div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  <div className="flex flex-col gap-1">
                                    {vehicle.requiresInspection ? (
                                      <>
                                        <span className="text-sm md:text-sm">{toDateOnly(vehicle.nextInspection) || "—"}</span>
                                        {(() => {
                                          const d = daysUntil(vehicle.nextInspection);
                                          if (d === null) return null;
                                          if (d < 0) {
                                            return (
                                              <Badge variant="secondary" className="bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive text-xs w-fit">
                                                Overdue
                                              </Badge>
                                            );
                                          }
                                          if (d <= 30) {
                                            return (
                                              <Badge variant="secondary" className="bg-gradient-to-r from-warning/20 to-warning/10 text-warning text-xs w-fit">
                                                Due in {d} days
                                              </Badge>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic">No inspection required</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </motion.div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewDetails(vehicle)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditVehicle(vehicle)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Vehicle
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleRemoveConfirm(vehicle)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </motion.tr>
                              {expandedVehicles[vehicle.id] && (
                                <TableRow className="bg-muted/10 hover:bg-muted/15 border-t-0">
                                  <TableCell colSpan={8} className="p-4 pl-14">
                                    <VehicleNeedsSection
                                      vehicle={vehicle}
                                      employees={employees}
                                      onAddNeed={handleAddNeedForVehicle}
                                      onToggleNeed={handleToggleNeedForVehicle}
                                      onDeleteNeed={handleDeleteNeedForVehicle}
                                      onUpdateNeeds={handleUpdateNeedsForVehicle}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="space-y-4 p-4 sm:p-0">
                  <div className="border border-border/60 rounded-xl overflow-hidden bg-card divide-y divide-border/60">
                    {filteredVehicles.map(vehicle => {
                      const vehicleNeeds = vehicle.needs || [];
                      const isExpanded = expandedNeedsView[vehicle.id];
                      
                      return (
                        <div key={vehicle.id} className="transition-all">
                          {/* Vehicle Header Row */}
                          <div 
                            onClick={() => setExpandedNeedsView(prev => ({ ...prev, [vehicle.id]: !prev[vehicle.id] }))}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 select-none">
                              <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
                              <span className="font-semibold text-sm sm:text-base text-foreground">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </span>
                              <span className="text-xs text-muted-foreground">({vehicle.licensePlate})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 h-6">
                                {vehicleNeeds.filter(n => !n.completed).length} Pending
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Needs Sub-list */}
                          {isExpanded && (
                            <div className="bg-muted/10 px-4 py-3 space-y-3 border-t border-border/40">
                              {/* Headers */}
                              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground border-b border-border/40 pb-2 px-2">
                                <div className="col-span-6 sm:col-span-7">Task name</div>
                                <div className="col-span-3 sm:col-span-3">Assignee</div>
                                <div className="col-span-3 sm:col-span-2">Due date</div>
                              </div>
                                                    {/* List items */}
                      <div className="space-y-1.5">
                        {vehicleNeeds.length > 0 ? (
                          vehicleNeeds.map(need => (
                            <div key={need.id} className="space-y-1.5">
                              <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-background border border-border/40 hover:bg-muted/20 transition-colors text-xs sm:text-sm">
                                {/* Task checkbox & name */}
                                <div className="col-span-6 sm:col-span-7 flex items-center gap-2.5 min-w-0">
                                  <input 
                                    type="checkbox"
                                    checked={need.completed}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      void handleToggleNeedForVehicle(vehicle, need.id);
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span className={`font-medium truncate block ${need.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                      {need.taskName}
                                    </span>
                                    {need.parts && need.parts.length > 0 && (
                                      <span className="text-[10px] text-primary font-semibold block mt-0.5">
                                        Parts: {need.parts.map(p => `${p.name} ($${(Number(p.cost) || 0).toFixed(2)})`).join(", ")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Assignee */}
                                <div className="col-span-3 sm:col-span-3 min-w-0">
                                  {need.assignee ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium truncate">
                                      <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold">
                                        {getInitials(need.assignee)}
                                      </span>
                                      <span className="hidden sm:inline">{need.assignee}</span>
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </div>
                                
                                {/* Due Date & delete actions */}
                                <div className="col-span-3 sm:col-span-2 flex items-center justify-between min-w-0">
                                  <span className="text-xs text-muted-foreground truncate">{need.dueDate || "—"}</span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveRowPartsNeedId(activeRowPartsNeedId === need.id ? null : need.id);
                                      }}
                                      className={`h-6 w-6 text-muted-foreground rounded-md hover:bg-primary/10 hover:text-primary ${activeRowPartsNeedId === need.id ? "bg-primary/10 text-primary" : ""}`}
                                    >
                                      <Wrench className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void handleDeleteNeedForVehicle(vehicle, need.id);
                                      }}
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Row parts editor */}
                              {activeRowPartsNeedId === need.id && (
                                <div className="ml-8 p-3 bg-muted/40 rounded-lg border border-border/40 space-y-2 text-xs">
                                  <div className="flex justify-between items-center font-semibold text-muted-foreground text-[10px] uppercase">
                                    <span>Parts Required</span>
                                    <span className="text-primary font-bold">Total: ${need.parts?.reduce((sum, p) => sum + (Number(p.cost) || 0), 0).toFixed(2) || "0.00"}</span>
                                  </div>
                                  {need.parts && need.parts.length > 0 ? (
                                    <div className="space-y-1">
                                      {need.parts.map((part, pIdx) => (
                                        <div key={pIdx} className="flex justify-between items-center bg-background px-2 py-1 rounded border border-border/40">
                                          <span className="font-medium">{part.name}</span>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground font-semibold">${(Number(part.cost) || 0).toFixed(2)}</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = (vehicle.needs || []).map(n => {
                                                  if (n.id === need.id) {
                                                    return { ...n, parts: (n.parts || []).filter((_, i) => i !== pIdx) };
                                                  }
                                                  return n;
                                                });
                                                void handleUpdateNeedsForVehicle(vehicle, updated);
                                              }}
                                              className="text-muted-foreground hover:text-destructive transition-colors font-bold text-sm"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-muted-foreground italic">No parts added yet.</p>
                                  )}
                                  <div className="flex gap-2 pt-2 border-t border-border/40">
                                    <input
                                      type="text"
                                      placeholder="Part name"
                                      id={`row-part-name-input-${need.id}`}
                                      className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs outline-none"
                                    />
                                    <input
                                      type="number"
                                      placeholder="Cost"
                                      id={`row-part-cost-input-${need.id}`}
                                      className="w-20 rounded border border-input bg-background px-2 py-1 text-xs outline-none"
                                    />
                                    <Button
                                      type="button"
                                      onClick={() => {
                                        const nameEl = document.getElementById(`row-part-name-input-${need.id}`) as HTMLInputElement;
                                        const costEl = document.getElementById(`row-part-cost-input-${need.id}`) as HTMLInputElement;
                                        if (nameEl && nameEl.value.trim()) {
                                          const costNum = parseFloat(costEl.value) || 0;
                                          const updated = (vehicle.needs || []).map(n => {
                                            if (n.id === need.id) {
                                              return { ...n, parts: [...(n.parts || []), { name: nameEl.value.trim(), cost: costNum }] };
                                            }
                                            return n;
                                          });
                                          void handleUpdateNeedsForVehicle(vehicle, updated);
                                          nameEl.value = "";
                                          costEl.value = "";
                                        }
                                      }}
                                      className="h-7 px-2.5 text-xs font-bold"
                                    >
                                      Add Part
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic py-2 text-center">No needs listed for this vehicle.</p>
                        )}
                      </div>
                              
                              {/* Inline Quick Add Row */}
                              <div className="pt-3 border-t border-border/40 bg-card/40 p-3 rounded-xl border border-border/40">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add task need</p>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                  <div className="flex-1 min-w-0">
                                    <input 
                                      type="text"
                                      placeholder="e.g. Tire alignment, Coolant level check..."
                                      id={`admin-needs-task-input-${vehicle.id}`}
                                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs sm:text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all h-8 sm:h-9"
                                    />
                                  </div>
                                  <div className="w-full sm:w-40 flex-shrink-0">
                                    <select 
                                      id={`admin-needs-assignee-input-${vehicle.id}`}
                                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs sm:text-sm outline-none h-8 sm:h-9"
                                    >
                                      <option value="">Assign Person...</option>
                                      {employees.map(emp => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="w-full sm:w-32 flex-shrink-0">
                                    <input 
                                      type="date"
                                      id={`admin-needs-date-input-${vehicle.id}`}
                                      className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs sm:text-sm outline-none h-8 sm:h-9"
                                    />
                                  </div>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const taskVal = (document.getElementById(`admin-needs-task-input-${vehicle.id}`) as HTMLInputElement)?.value;
                                      const assigneeVal = (document.getElementById(`admin-needs-assignee-input-${vehicle.id}`) as HTMLSelectElement)?.value;
                                      const dateVal = (document.getElementById(`admin-needs-date-input-${vehicle.id}`) as HTMLInputElement)?.value;
                                      if (taskVal) {
                                        handleAddNeedForVehicle(vehicle, taskVal, assigneeVal, dateVal);
                                        // Clear inputs
                                        (document.getElementById(`admin-needs-task-input-${vehicle.id}`) as HTMLInputElement).value = "";
                                        (document.getElementById(`admin-needs-assignee-input-${vehicle.id}`) as HTMLSelectElement).value = "";
                                        (document.getElementById(`admin-needs-date-input-${vehicle.id}`) as HTMLInputElement).value = "";
                                      }
                                    }}
                                    className="h-8 sm:h-9 px-3 text-xs w-full sm:w-auto"
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* View Details Dialog - Animated */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Vehicle Details
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="flex-1 overflow-y-auto pr-2 py-2 min-h-0">
              <motion.div 
                className="space-y-4 sm:space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
              {/* Vehicle Photo Display */}
              {(() => {
                const photoSrc = getVehicleTagPhotoSrc(selectedVehicle);
                return photoSrc ? (
                  <motion.div 
                    className="flex justify-center"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <img 
                      src={photoSrc} 
                      alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                      className="h-32 w-32 object-cover rounded-xl border-2 ring-2 ring-primary/20 shadow-lg"
                    />
                  </motion.div>
                ) : null;
              })()}

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                      <Car className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                  </motion.div>
                  <div>
                    <p className="text-base sm:text-lg font-semibold break-words">
                      {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{selectedVehicle.licensePlate}</p>
                  </div>
                </div>
                <Badge className={`${statusClasses[selectedVehicle.status]} text-xs sm:text-sm self-start sm:self-center flex items-center gap-1`} variant="secondary">
                  {getStatusIcon(selectedVehicle.status)}
                  {selectedVehicle.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <motion.div 
                  className="space-y-1.5"
                  whileHover={{ x: 5 }}
                >
                  <label className="text-xs sm:text-sm font-medium">License Plate</label>
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono bg-gradient-to-br from-muted/30 to-muted/10 p-2 rounded-lg">
                    {selectedVehicle.licensePlate}
                  </p>
                </motion.div>
                
                <motion.div 
                  className="space-y-1.5"
                  whileHover={{ x: 5 }}
                >
                  <label className="text-xs sm:text-sm font-medium">VIN</label>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all bg-gradient-to-br from-muted/30 to-muted/10 p-2 rounded-lg">
                    {selectedVehicle.vin || "—"}
                  </p>
                </motion.div>
                
                <motion.div 
                  className="space-y-1.5"
                  whileHover={{ x: 5 }}
                >
                  <label className="text-xs sm:text-sm font-medium">Mileage</label>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{selectedVehicle.mileage || "—"}</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="space-y-1.5"
                  whileHover={{ x: 5 }}
                >
                  <label className="text-xs sm:text-sm font-medium">Assigned To</label>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{selectedVehicle.assignedTo || "—"}</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="space-y-1.5"
                  whileHover={{ x: 5 }}
                >
                  <label className="text-xs sm:text-sm font-medium">Insurance Information</label>
                  <p className="text-xs sm:text-sm text-muted-foreground bg-gradient-to-br from-muted/30 to-muted/10 p-2 rounded-lg">
                    {selectedVehicle.insuranceInfo || "—"}
                  </p>
                </motion.div>

                <motion.div 
                  className="space-y-1.5 sm:col-span-2"
                  whileHover={{ x: 5 }}
                >
                  <label className="text-xs sm:text-sm font-medium">Documents</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedVehicle.documents && selectedVehicle.documents.length > 0 ? (
                      selectedVehicle.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.dataUrl}
                          download={doc.fileName}
                          className="flex items-center gap-2 text-xs sm:text-sm p-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          {doc.fileName}
                        </a>
                      ))
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">No documents uploaded</p>
                    )}
                  </div>
                </motion.div>

                {/* Vehicle Needs Checklist Section */}
                <div className="space-y-3 border-t pt-4 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Vehicle Needs & Maintenance Tasks
                    </label>
                    <Badge variant="secondary" className="text-xs">
                      {(selectedVehicle.needs || []).filter(n => !n.completed).length} Pending
                    </Badge>
                  </div>

                  {/* Needs List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(selectedVehicle.needs || []).length > 0 ? (
                      (selectedVehicle.needs || []).map((need) => (
                        <div 
                          key={need.id} 
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-muted/40 hover:bg-muted/30 transition-all text-xs sm:text-sm animate-fadeIn"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={need.completed}
                              onChange={() => handleToggleNeed(need.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`font-medium break-words ${need.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {need.taskName}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-0.5">
                                {need.assignee && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <User className="h-2.5 w-2.5" />
                                    Assignee: <span className="text-primary/85 font-bold">{need.assignee}</span>
                                  </span>
                                )}
                                {need.dueDate && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-2.5 w-2.5" />
                                    Due: {need.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNeed(need.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0 ml-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-2">No needs or maintenance items listed for this vehicle.</p>
                    )}
                  </div>

                  {/* Add Need Form */}
                  <div className="bg-muted/10 p-3 rounded-xl border border-muted/25 space-y-2 mt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Maintenance / Task Need</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="What needs to be done? e.g. Coolant smell, Battery"
                          value={newNeedTaskName}
                          onChange={(e) => setNewNeedTaskName(e.target.value)}
                          className="w-full rounded-lg border px-3 py-1.5 text-xs sm:text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all h-8 sm:h-9"
                        />
                      </div>
                      <div className="w-full sm:w-40 flex-shrink-0">
                        <select
                          value={newNeedAssignee}
                          onChange={(e) => setNewNeedAssignee(e.target.value)}
                          className="w-full rounded-lg border px-2 py-1.5 text-xs sm:text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all h-8 sm:h-9"
                        >
                          <option value="">Assign Person...</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-32 flex-shrink-0">
                        <input
                          type="date"
                          value={newNeedDueDate}
                          onChange={(e) => setNewNeedDueDate(e.target.value)}
                          className="w-full rounded-lg border px-2 py-1 text-xs sm:text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all h-8 sm:h-9"
                        />
                      </div>
                      <Button
                        onClick={handleAddNeed}
                        disabled={isUpdatingNeed || !newNeedTaskName.trim()}
                        className="w-full sm:w-auto h-8 sm:h-9 px-3 gap-1 text-xs font-semibold shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
          <DialogFooter className="mt-4 sm:mt-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => setViewDetailsOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog - Animated */}
      <Dialog open={editVehicleOpen} onOpenChange={setEditVehicleOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Edit Vehicle
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update vehicle information and save changes
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="flex-1 overflow-y-auto pr-2 py-2 min-h-0">
              <motion.form 
                className="space-y-4 sm:space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
              {/* Form Validation Error */}
              <AnimatePresence>
                {editFormError && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="rounded-lg bg-destructive/10 p-3 sm:p-4 border border-destructive/20"
                  >
                    <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {editFormError}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Make, Model, Year */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Make *</label>
                  <input
                    type="text"
                    value={editFormData.make}
                    onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Model *</label>
                  <input
                    type="text"
                    value={editFormData.model}
                    onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Year *</label>
                  <input
                    type="text"
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* License Plate & VIN */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">License Plate *</label>
                  <input
                    type="text"
                    value={editFormData.licensePlate}
                    onChange={(e) => setEditFormData({ ...editFormData, licensePlate: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">VIN</label>
                  <input
                    type="text"
                    value={editFormData.vin}
                    onChange={(e) => setEditFormData({ ...editFormData, vin: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Mileage, Assigned To, Status */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Mileage</label>
                  <input
                    type="text"
                    value={editFormData.mileage}
                    onChange={(e) => setEditFormData({ ...editFormData, mileage: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Assigned To</label>
                  <select
                    value={editFormData.assignedTo}
                    onChange={(e) => setEditFormData({ ...editFormData, assignedTo: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-white h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="">Select assignee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value as Vehicle["status"] })
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base bg-white h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Inspection Dates */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Last Inspection</label>
                  <input
                    type="date"
                    value={editFormData.lastInspection}
                    onChange={(e) => setEditFormData({ ...editFormData, lastInspection: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Next Inspection</label>
                  <input
                    type="date"
                    value={editFormData.nextInspection}
                    onChange={(e) => setEditFormData({ ...editFormData, nextInspection: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base h-9 sm:h-10 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="requires-inspection-edit"
                  checked={editFormData.requiresInspection}
                  onChange={(e) => setEditFormData({ ...editFormData, requiresInspection: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="requires-inspection-edit" className="text-sm font-medium">
                  Requires Regular Inspections
                </label>
              </div>

              {/* Vehicle Photo Upload */}
              <div className="flex flex-col gap-3">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Vehicle Photo</label>
                  {(() => {
                    const currentPhoto = editTagPhotoFile 
                      ? URL.createObjectURL(editTagPhotoFile)
                      : getVehicleTagPhotoSrc(selectedVehicle);
                    return currentPhoto ? (
                      <div className="mb-2">
                        <img src={currentPhoto} alt="Current vehicle" className="h-20 w-20 object-cover rounded-lg border" />
                      </div>
                    ) : null;
                  })()}
                  <motion.div
                    className="w-full rounded-lg border px-3 py-3 text-sm sm:text-base bg-gradient-to-br from-muted/20 to-muted/5 hover:from-muted/30 hover:to-muted/10 transition-all cursor-pointer"
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) {
                        setEditTagPhotoFile(f);
                        void compressImageToDataUrl(f).then((url) => setEditFormData((p) => ({ ...p, tagPhotoFileName: f.name, tagPhotoDataUrl: url })));
                      }
                    }}
                    onClick={() => {
                      const el = document.getElementById("edit-vehicle-photo-input") as HTMLInputElement | null;
                      el?.click();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        const el = document.getElementById("edit-vehicle-photo-input") as HTMLInputElement | null;
                        el?.click();
                      }
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">
                          {editTagPhotoFile ? editTagPhotoFile.name : editFormData.tagPhotoFileName || "Click to choose or drag & drop"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Max 10MB
                        </p>
                      </div>
                      <Camera className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <input
                      id="edit-vehicle-photo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setEditTagPhotoFile(f);
                        if (f) void compressImageToDataUrl(f).then((url) => setEditFormData((p) => ({ ...p, tagPhotoFileName: f.name, tagPhotoDataUrl: url })));
                      }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.form>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button 
                variant="outline" 
                onClick={() => setEditVehicleOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button 
                onClick={saveEditVehicle} 
                disabled={isSaving}
                className="bg-gradient-to-r from-primary to-primary/80 text-white w-full sm:w-auto order-1 sm:order-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog - Animated */}
      <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg text-destructive">
              Remove Vehicle
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              This vehicle will be permanently removed from the fleet list. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVehicle && (
            <motion.div 
              className="rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5 p-3 sm:p-4 text-xs sm:text-sm mt-2 space-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="font-medium break-words">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </p>
              <p className="text-muted-foreground break-words">{selectedVehicle.id}</p>
              <p className="text-muted-foreground text-xs">{selectedVehicle.licensePlate}</p>
            </motion.div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button 
                variant="outline" 
                onClick={() => setRemoveConfirmOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button 
                variant="destructive" 
                onClick={confirmRemove}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                Remove
              </Button>
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

      {/* Dropbox File Picker Modal */}
      <DropboxFilePicker
        open={isVehicleDropboxPickerOpen}
        onOpenChange={setIsVehicleDropboxPickerOpen}
        onSelect={(files) => setVehicleDropboxDocs((prev) => [...prev, ...files])}
        multiple={true}
      />
    </>
  );
};

const VehicleNeedsSection = ({ 
  vehicle, 
  employees,
  onAddNeed,
  onToggleNeed,
  onDeleteNeed,
  onUpdateNeeds
}: {
  vehicle: Vehicle;
  employees: Employee[];
  onAddNeed: (vehicle: Vehicle, taskName: string, assignee: string, dueDate: string) => Promise<void>;
  onToggleNeed: (vehicle: Vehicle, needId: string) => Promise<void>;
  onDeleteNeed: (vehicle: Vehicle, needId: string) => Promise<void>;
  onUpdateNeeds: (vehicle: Vehicle, updatedNeeds: any[]) => Promise<void>;
}) => {
  const pendingCount = (vehicle.needs || []).filter(n => !n.completed).length;
  const [expanded, setExpanded] = useState(pendingCount > 0);
  const [taskName, setTaskName] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parts management states
  const [activePartsNeedId, setActivePartsNeedId] = useState<string | null>(null);
  const [partName, setPartName] = useState("");
  const [partCost, setPartCost] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddNeed(vehicle, taskName.trim(), assignee, dueDate);
      setTaskName("");
      setAssignee("");
      setDueDate("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPart = async (needId: string) => {
    if (!partName.trim()) return;
    const costNum = parseFloat(partCost) || 0;
    const updatedNeeds = (vehicle.needs || []).map(n => {
      if (n.id === needId) {
        const existingParts = n.parts || [];
        return {
          ...n,
          parts: [...existingParts, { name: partName.trim(), cost: costNum }]
        };
      }
      return n;
    });
    await onUpdateNeeds(vehicle, updatedNeeds);
    setPartName("");
    setPartCost("");
  };

  const handleDeletePart = async (needId: string, partIndex: number) => {
    const updatedNeeds = (vehicle.needs || []).map(n => {
      if (n.id === needId) {
        const existingParts = n.parts || [];
        return {
          ...n,
          parts: existingParts.filter((_, idx) => idx !== partIndex)
        };
      }
      return n;
    });
    await onUpdateNeeds(vehicle, updatedNeeds);
  };

  return (
    <div className="border-t border-border/60 pt-3 mt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-primary" />
          Needs & Tasks
          {(vehicle.needs || []).length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 scale-90">
              {pendingCount} pending
            </Badge>
          )}
        </span>
        <span className="text-[10px]">{expanded ? "Hide" : "Show"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-fadeIn">
          {/* Needs List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {(vehicle.needs || []).length > 0 ? (
              (vehicle.needs || []).map((need) => {
                const partsList = need.parts || [];
                const partsTotal = partsList.reduce((sum, p) => sum + (Number(p.cost) || 0), 0);
                const isPartsOpen = activePartsNeedId === need.id;

                return (
                  <div key={need.id} className="space-y-1.5">
                    <div 
                      className="flex items-center justify-between p-1.5 rounded-lg bg-muted/20 border border-muted/40 hover:bg-muted/30 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={need.completed}
                          onChange={() => onToggleNeed(vehicle, need.id)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary accent-primary cursor-pointer flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium break-words ${need.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {need.taskName}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-0.5 text-[9px] text-muted-foreground">
                            {need.assignee && (
                              <span className="flex items-center gap-0.5">
                                <User className="h-2 w-2" />
                                {need.assignee}
                              </span>
                            )}
                            {need.dueDate && (
                              <span className="flex items-center gap-0.5">
                                <Calendar className="h-2 w-2" />
                                {need.dueDate}
                              </span>
                            )}
                            {partsList.length > 0 && (
                              <span className="text-primary font-semibold">
                                Parts: {partsList.length} (${partsTotal.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setActivePartsNeedId(isPartsOpen ? null : need.id)}
                          className={`h-6 w-6 text-muted-foreground rounded-md hover:bg-primary/10 hover:text-primary ${isPartsOpen ? "bg-primary/10 text-primary" : ""}`}
                          title="Manage Parts"
                        >
                          <Wrench className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteNeed(vehicle, need.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Inline Parts Editor */}
                    {isPartsOpen && (
                      <div className="ml-4 p-2 bg-muted/40 rounded-lg border border-muted/50 space-y-2 text-xs">
                        <div className="flex justify-between items-center font-semibold text-muted-foreground text-[10px] uppercase">
                          <span>Parts Required</span>
                          <span className="text-primary font-bold">Total: ${partsTotal.toFixed(2)}</span>
                        </div>
                        {partsList.length > 0 ? (
                          <div className="space-y-1">
                            {partsList.map((part, pIdx) => (
                              <div key={pIdx} className="flex justify-between items-center bg-background px-2 py-1 rounded border border-border/40">
                                <span className="font-medium">{part.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-muted-foreground font-semibold">${(Number(part.cost) || 0).toFixed(2)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePart(need.id, pIdx)}
                                    className="text-muted-foreground hover:text-destructive transition-colors font-bold text-sm"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">No parts added yet.</p>
                        )}
                        <div className="flex gap-1.5 pt-1.5 border-t border-border/40">
                          <input
                            type="text"
                            placeholder="Part name"
                            value={partName}
                            onChange={(e) => setPartName(e.target.value)}
                            className="flex-1 rounded border border-input bg-background px-1.5 py-0.5 text-[10px] outline-none"
                          />
                          <input
                            type="number"
                            placeholder="Cost"
                            value={partCost}
                            onChange={(e) => setPartCost(e.target.value)}
                            className="w-16 rounded border border-input bg-background px-1.5 py-0.5 text-[10px] outline-none"
                          />
                          <Button
                            type="button"
                            onClick={() => handleAddPart(need.id)}
                            disabled={!partName.trim()}
                            className="h-5 px-1.5 text-[9px] font-bold"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-muted-foreground italic py-1">No needs listed for this vehicle.</p>
            )}
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAdd} className="space-y-1.5 pt-2 border-t border-border/40">
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="New need... e.g. Align tires"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div className="flex gap-1.5 items-center">
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-1.5 py-1 text-[11px] outline-none"
              >
                <option value="">Assignee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-24 rounded-md border border-input bg-background px-1.5 py-1 text-[11px] outline-none"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !taskName.trim()}
                className="h-6 px-2 text-[10px]"
              >
                Add
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
