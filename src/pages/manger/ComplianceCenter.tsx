import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Textarea } from "@/components/manger/ui/textarea";
import { Progress } from "@/components/manger/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/manger/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/manger/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/manger/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/manger/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/manger/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manger/ui/avatar";
import { apiFetch } from "@/lib/manger/api";
import { getAuthState } from "@/lib/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { EmployeeFileWorkspace } from "@/components/admin/employees/EmployeeFileWorkspace";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  User,
  Clock,
  ArrowRight,
  ArrowLeft,
  Upload,
  Download,
  ExternalLink,
  FileText,
  Check,
  Lock,
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  Calendar,
  AlertCircle,
  MapPin,
  Users,
  Smartphone,
  CreditCard,
  Fingerprint,
  Mail,
  Phone,
  FileCheck2,
  FileSignature,
  Globe,
  SlidersHorizontal,
  CheckSquare,
} from "lucide-react";

export interface EmployeeComplianceItem {
  status: "missing" | "pending" | "verified" | "na";
  fileUrl?: string;
  value?: string;
  caseNumber?: string;
  docCount?: number;
  updatedBy?: string;
  updatedAt?: string;
  notes?: string;
}

export interface EmployeeComplianceChecklist {
  drivLic: EmployeeComplianceItem;
  ssCard: EmployeeComplianceItem;
  email: EmployeeComplianceItem;
  phoneNumber: EmployeeComplianceItem;
  signedDocs: EmployeeComplianceItem;
  eVerify: EmployeeComplianceItem;
  downloadedApps: EmployeeComplianceItem;
}

export interface EmployeeComplianceRecord {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: string;
  avatarUrl?: string;
  complianceChecklist: EmployeeComplianceChecklist;
  verifiedCount: number;
  totalRequired: number;
  score: number;
  isCompliant: boolean;
}

export interface EmployeeComplianceSummary {
  total: number;
  compliantCount: number;
  actionRequiredCount: number;
  avgScore: number;
}

interface Website {
  _id: string;
  siteName: string;
  url: string;
  websiteType: "active" | "future";
  platform?: string;
  hostingProvider?: string;
  status: "Live" | "Maintenance" | "Development" | "Offline";
  owner?: string;
  notes?: string;
  launchDate?: string;
  originalPurchaseDate?: string;
  expirationDate?: string;
  businessUnit: string;
  environment: string;
  leadDeveloper?: string;
  complianceTemplate?: string;
  readinessScore: number;
  overrideReason?: string;
  createdAt: string;
  updatedAt: string;
  humanVerification?: string;
  largeHeaderImage?: string;
  contactInfoSection?: string;
  adaCompliance?: string;
  faq?: string;
  contactUsPage?: string;
  privacyPolicy?: string;
  seo?: string;
  siteMap?: string;
  stripeIntegration?: string;
  bugReportButton?: string;
  googleMaps?: string;
  appleMaps?: string;
  infoEmailSetup?: string;
  nathanEmailSetup?: string;
  // Social Media Compliance
  youtubeCompliance?: string;
  rumbleCompliance?: string;
  libertySocialCompliance?: string;
  facebookCompliance?: string;
  xCompliance?: string;
  instagramCompliance?: string;
  tikTokCompliance?: string;
  yelpCompliance?: string;
  truthSocialCompliance?: string;
  threadsCompliance?: string;
  locations?: any[];
}

interface ChecklistItem {
  _id: string;
  websiteId: string;
  category: string;
  title: string;
  description: string;
  requiresEvidence: boolean;
  status: "pending" | "in-progress" | "blocked" | "completed" | "na";
  notes?: string;
  evidenceUrl?: string;
  evidenceFile?: string; // base64 representation
  blockedReason?: string;
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistHistory {
  _id: string;
  websiteId: string;
  itemId?: string;
  action: string;
  previousState?: string;
  newState?: string;
  notes?: string;
  userId: string;
  username: string;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: string;
}

interface ChecklistTemplate {
  _id: string;
  name: string;
  key: string;
  categories: {
    name: string;
    items: {
      title: string;
      description: string;
      requiresEvidence: boolean;
    }[];
  }[];
}

interface LeaderboardItem {
  username: string;
  count: number;
}

interface ComplianceReport {
  totalWebsites: number;
  avgScore: number;
  statusBreakdown: {
    red: number;
    yellow: number;
    green: number;
  };
  buPerformance: {
    name: string;
    avgScore: number;
    count: number;
  }[];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRadian = (angle: number) => (Math.PI / 180) * angle;
  const distance = (a: number, b: number) => (Math.PI / 180) * (a - b);
  const RADIUS_OF_EARTH_IN_MILES = 3958.8;

  const dLat = distance(lat2, lat1);
  const dLon = distance(lon2, lon1);

  lat1 = toRadian(lat1);
  lat2 = toRadian(lat2);

  const a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return RADIUS_OF_EARTH_IN_MILES * c;
}

function WebsiteLocationsMap({ locations, isMetallic }: { locations: any[]; isMetallic: boolean }) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDistances, setLocationDistances] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.warn("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  if (!locations || locations.length === 0) return null;

  return (
    <Card className={`p-4 border mb-4 ${isMetallic ? "bg-black/30 border-[#ffd27a]/15 text-white" : "bg-card border-border"}`}>
      <h3 className="font-bold text-sm text-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-blue-500" />
        Business Locations Map
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => {
          const query = encodeURIComponent(`${loc.address || ""} ${loc.city || ""}`);
          return (
            <div key={loc._id} className={`overflow-hidden rounded-lg border flex flex-col ${isMetallic ? "border-zinc-800" : "border-muted"}`}>
              <div className="p-3 bg-muted/20 flex flex-col gap-1">
                <span className="font-bold text-sm text-foreground flex items-center justify-between">
                  {loc.name}
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${query}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-[#00C6FF] hover:underline flex items-center gap-1"
                  >
                    Drive Here <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
                <span className="text-xs text-muted-foreground">{loc.address}, {loc.city} {loc.country}</span>
                {userLocation && (
                  <span className="text-[10px] text-green-500 flex items-center gap-1 mt-1 font-semibold">
                    <MapPin className="h-3 w-3" /> Location services active
                  </span>
                )}
              </div>
              <iframe
                title={`Map for ${loc.name}`}
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function ComplianceCenter() {
  const { uiTheme } = useTheme();
  const isMetallic = uiTheme.theme === "metallic-elite";
  const auth = getAuthState();
  const isAdmin = auth.role === "admin" || auth.role === "super-admin";

  // Data state
  const [websites, setWebsites] = useState<Website[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [report, setReport] = useState<ComplianceReport | null>(null);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters state
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all"); // all, red, yellow, green
  const [envFilter, setEnvFilter] = useState("all");
  const [buFilter, setBuFilter] = useState("all");

  // Selected website / drawer state
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [siteHistory, setSiteHistory] = useState<ChecklistHistory[]>([]);
  const [globalAuditLogs, setGlobalAuditLogs] = useState<(ChecklistHistory & { siteName?: string })[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Router navigation
  const navigate = useNavigate();

  // Mode: "employees" | "websites" (Defaulting to employees as requested)
  const [complianceCenterMode, setComplianceCenterMode] = useState<"employees" | "websites">("employees");

  // Employee Compliance State
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeComplianceRecord[]>([]);
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeComplianceSummary | null>(null);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empStatusFilter, setEmpStatusFilter] = useState<"all" | "compliant" | "action_required">("all");
  const [empDeptFilter, setEmpDeptFilter] = useState("all");

  // Linked Employee File Workspace state
  const [activeFileEmployeeId, setActiveFileEmployeeId] = useState<string | null>(null);

  // Edit employee compliance checklist dialog state
  const [selectedEmpForEdit, setSelectedEmpForEdit] = useState<EmployeeComplianceRecord | null>(null);
  const [empChecklistDraft, setEmpChecklistDraft] = useState<EmployeeComplianceChecklist | null>(null);
  const [savingEmpCompliance, setSavingEmpCompliance] = useState(false);

  const loadEmployeeCompliance = async () => {
    setEmpLoading(true);
    try {
      const res = await apiFetch<{ items: EmployeeComplianceRecord[]; summary: EmployeeComplianceSummary }>("/api/employees/compliance");
      if (res && res.items) {
        setEmployeeRecords(res.items);
        setEmployeeSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to load employee compliance data:", err);
    } finally {
      setEmpLoading(false);
    }
  };

  const saveEmployeeComplianceChecklist = async () => {
    if (!selectedEmpForEdit || !empChecklistDraft) return;
    setSavingEmpCompliance(true);
    try {
      await apiFetch(`/api/employees/${selectedEmpForEdit._id}/compliance`, {
        method: "PUT",
        body: JSON.stringify({ checklist: empChecklistDraft }),
      });
      toast.success(`Compliance checklist updated for ${selectedEmpForEdit.name}`);
      setSelectedEmpForEdit(null);
      setEmpChecklistDraft(null);
      await loadEmployeeCompliance();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update compliance checklist");
    } finally {
      setSavingEmpCompliance(false);
    }
  };

  // Override dialog state
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState("");
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  // Create website dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSite, setNewSite] = useState({
    siteName: "",
    url: "",
    websiteType: "active" as "active" | "future",
    platform: "",
    hostingProvider: "",
    status: "Development" as "Live" | "Maintenance" | "Development" | "Offline",
    owner: "",
    notes: "",
    launchDate: "",
    originalPurchaseDate: "",
    expirationDate: "",
    businessUnit: "Marketing",
    environment: "Production",
    leadDeveloper: "",
    complianceTemplate: "",
  });

  // Edit item state
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [itemStatus, setItemStatus] = useState<ChecklistItem["status"]>("pending");
  const [itemNotes, setItemNotes] = useState("");
  const [itemEvidenceUrl, setItemEvidenceUrl] = useState("");
  const [itemEvidenceFile, setItemEvidenceFile] = useState(""); // base64
  const [itemBlockedReason, setItemBlockedReason] = useState("");

  // Load everything
  const loadData = async () => {
    setLoading(true);
    try {
      // Parallel fetch employee compliance
      void loadEmployeeCompliance();

      // Fetch websites (active + future)
      const activeRes = await apiFetch<{ items: Website[] }>("/api/websites/active");
      const futureRes = await apiFetch<{ items: Website[] }>("/api/websites/future");
      const combined = [...(activeRes.items || []), ...(futureRes.items || [])];
      setWebsites(combined);

      // Fetch templates
      const templatesRes = await apiFetch<{ items: ChecklistTemplate[] }>("/api/websites/templates");
      setTemplates(templatesRes.items || []);

      // Fetch leaderboard
      const leaderboardRes = await apiFetch<{ items: LeaderboardItem[] }>("/api/websites/compliance/leaderboard");
      setLeaderboard(leaderboardRes.items || []);

      // Fetch reports
      const reportsRes = await apiFetch<{ item: ComplianceReport }>("/api/websites/compliance/reports");
      setReport(reportsRes.item || null);

      // Fetch global audit logs across all websites
      const auditRes = await apiFetch<{ items: (ChecklistHistory & { siteName?: string })[] }>("/api/websites/compliance/audit-logs");
      setGlobalAuditLogs(auditRes.items || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load compliance data. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filtered websites
  const filteredWebsites = useMemo(() => {
    return websites.filter((site) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        site.siteName.toLowerCase().includes(q) ||
        site.url.toLowerCase().includes(q) ||
        (site.platform && site.platform.toLowerCase().includes(q)) ||
        (site.leadDeveloper && site.leadDeveloper.toLowerCase().includes(q));

      const matchesEnv = envFilter === "all" || site.environment === envFilter;
      const matchesBu = buFilter === "all" || site.businessUnit === buFilter;

      let matchesScore = true;
      if (scoreFilter === "green") matchesScore = site.readinessScore === 100;
      else if (scoreFilter === "yellow") matchesScore = site.readinessScore >= 80 && site.readinessScore < 100;
      else if (scoreFilter === "red") matchesScore = site.readinessScore < 80;

      return matchesSearch && matchesEnv && matchesBu && matchesScore;
    });
  }, [websites, search, envFilter, buFilter, scoreFilter]);

  const filteredEmployees = useMemo(() => {
    return employeeRecords.filter((emp) => {
      const q = empSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.phone && emp.phone.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q)) ||
        (emp.role && emp.role.toLowerCase().includes(q));

      const matchesStatus =
        empStatusFilter === "all" ||
        (empStatusFilter === "compliant" && emp.isCompliant) ||
        (empStatusFilter === "action_required" && !emp.isCompliant);

      const matchesDept = empDeptFilter === "all" || emp.department === empDeptFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [employeeRecords, empSearch, empStatusFilter, empDeptFilter]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(employeeRecords.map((e) => e.department).filter(Boolean))).sort();
  }, [employeeRecords]);

  // Open Drawer and fetch compliance items + history
  const openComplianceDrawer = async (site: Website) => {
    setSelectedWebsite(site);
    setIsDrawerOpen(true);
    setActionLoading(true);
    try {
      const complianceRes = await apiFetch<{ items: ChecklistItem[] }>("/api/websites/" + site._id + "/compliance");
      setChecklistItems(complianceRes.items || []);

      const historyRes = await apiFetch<{ items: ChecklistHistory[] }>("/api/websites/" + site._id + "/history");
      setSiteHistory(historyRes.items || []);
    } catch (err) {
      toast.error("Failed to load site compliance checklist.");
    } finally {
      setActionLoading(false);
    }
  };

  // Close Drawer
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedWebsite(null);
    setChecklistItems([]);
    setSiteHistory([]);
    setEditingItem(null);
  };

  // Save specific checklist item updates
  const saveChecklistItem = async (item: ChecklistItem) => {
    if (!selectedWebsite) return;
    
    // Validate evidence requirements
    if (
      itemStatus === "completed" &&
      item.requiresEvidence &&
      !itemEvidenceUrl &&
      !itemEvidenceFile &&
      !item.evidenceUrl &&
      !item.evidenceFile
    ) {
      toast.error("Evidence (Screenshot, log file or URL) is required to complete this item.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiFetch<{ item: ChecklistItem; readinessScore: number }>(
        `/api/websites/${selectedWebsite._id}/compliance/${item._id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            status: itemStatus,
            notes: itemNotes,
            evidenceUrl: itemEvidenceUrl,
            evidenceFile: itemEvidenceFile || undefined,
            blockedReason: itemStatus === "blocked" ? itemBlockedReason : "",
          }),
        }
      );

      toast.success(`Updated status for "${item.title}"`);
      
      // Update local checklist item state
      setChecklistItems((prev) =>
        prev.map((i) => (i._id === item._id ? res.item : i))
      );

      // Update selected website score
      setSelectedWebsite((prev) =>
        prev ? { ...prev, readinessScore: res.readinessScore } : null
      );

      // Refresh list to update score in main screen
      setWebsites((prev) =>
        prev.map((w) => (w._id === selectedWebsite._id ? { ...w, readinessScore: res.readinessScore } : w))
      );

      // Reload site history
      const historyRes = await apiFetch<{ items: ChecklistHistory[] }>("/api/websites/" + selectedWebsite._id + "/history");
      setSiteHistory(historyRes.items || []);
      setEditingItem(null);

      // Refresh leaderboard / statistics
      void loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update checklist item.");
    } finally {
      setActionLoading(false);
    }
  };

  // Math Puzzle Human Verification dialog state
  const [isMathPuzzleOpen, setIsMathPuzzleOpen] = useState(false);
  const [mathNum1, setMathNum1] = useState(7);
  const [mathNum2, setMathNum2] = useState(5);
  const [mathInput, setMathInput] = useState("");
  const [mathPuzzleError, setMathPuzzleError] = useState<string | null>(null);

  const openMathPuzzle = () => {
    const n1 = Math.floor(Math.random() * 15) + 5;
    const n2 = Math.floor(Math.random() * 15) + 3;
    setMathNum1(n1);
    setMathNum2(n2);
    setMathInput("");
    setMathPuzzleError(null);
    setIsMathPuzzleOpen(true);
  };

  const handleVerifyMathPuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    const expected = mathNum1 + mathNum2;
    if (parseInt(mathInput.trim(), 10) !== expected) {
      setMathPuzzleError(`Incorrect answer (${mathInput}). Try again: What is ${mathNum1} + ${mathNum2}?`);
      return;
    }

    setIsMathPuzzleOpen(false);
    toast.success("Human verification math puzzle solved!");
    await executeToggleCoreReq("humanVerification", "green");
  };

  const executeToggleCoreReq = async (key: string, status: string) => {
    if (!selectedWebsite) return;
    setActionLoading(true);
    try {
      const res = await apiFetch<{ item: Website }>(`/api/websites/${selectedWebsite._id}`, {
        method: "PUT",
        body: JSON.stringify({
          [key]: status
        }),
      });
      
      toast.success("Updated compliance requirement status successfully.");
      setSelectedWebsite(res.item);
      setWebsites((prev) =>
        prev.map((w) => (w._id === selectedWebsite._id ? res.item : w))
      );

      const complianceRes = await apiFetch<{ items: ChecklistItem[] }>("/api/websites/" + selectedWebsite._id + "/compliance");
      setChecklistItems(complianceRes.items || []);

      const historyRes = await apiFetch<{ items: ChecklistHistory[] }>("/api/websites/" + selectedWebsite._id + "/history");
      setSiteHistory(historyRes.items || []);

      void loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update requirement status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCoreReq = async (key: string, status: string) => {
    if (key === "humanVerification" && status === "green") {
      openMathPuzzle();
      return;
    }
    await executeToggleCoreReq(key, status);
  };

  // Submit Admin Override
  const submitOverride = async () => {
    if (!selectedWebsite) return;
    if (!overrideReason) {
      toast.error("Override reason is required.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiFetch<{ item: Website }>(`/api/websites/${selectedWebsite._id}/override`, {
        method: "PUT",
        body: JSON.stringify({
          readinessScore: overrideScore !== "" ? Number(overrideScore) : undefined,
          status: overrideStatus || undefined,
          overrideReason,
        }),
      });

      toast.success("Admin parameters overridden successfully.");
      setSelectedWebsite(res.item);
      setOverrideReason("");
      setOverrideScore("");
      setOverrideStatus("");
      setIsOverrideOpen(false);

      // Update website list
      setWebsites((prev) =>
        prev.map((w) => (w._id === selectedWebsite._id ? res.item : w))
      );

      // Reload history
      const historyRes = await apiFetch<{ items: ChecklistHistory[] }>("/api/websites/" + selectedWebsite._id + "/history");
      setSiteHistory(historyRes.items || []);
      
      // Refresh reports
      void loadData();
    } catch (err: any) {
      toast.error(err.message || "Override failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle file select & base64 conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setItemEvidenceFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Add website launch record
  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.siteName || !newSite.url) {
      toast.error("Site name and URL are required.");
      return;
    }

    setActionLoading(true);
    try {
      await apiFetch("/api/websites", {
        method: "POST",
        body: JSON.stringify(newSite),
      });

      toast.success("Registered website launch project successfully.");
      setIsCreateOpen(false);
      
      // Reset state
      setNewSite({
        siteName: "",
        url: "",
        websiteType: "active",
        platform: "",
        hostingProvider: "",
        status: "Development",
        owner: "",
        notes: "",
        launchDate: "",
        originalPurchaseDate: "",
        expirationDate: "",
        businessUnit: "Marketing",
        environment: "Production",
        leadDeveloper: "",
        complianceTemplate: "",
      });

      // Reload
      void loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create site launch record.");
    } finally {
      setActionLoading(false);
    }
  };

  // Render rivets for metallic layout design
  const renderRivets = () => {
    if (!isMetallic) return null;
    return (
      <>
        <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#1b1c1d] border-t border-white/20 border-b border-black/40 shadow-inner" />
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#1b1c1d] border-t border-white/20 border-b border-black/40 shadow-inner" />
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-[#1b1c1d] border-t border-white/20 border-b border-black/40 shadow-inner" />
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-[#1b1c1d] border-t border-white/20 border-b border-black/40 shadow-inner" />
      </>
    );
  };

  // Format launch date countdown
  const getCountdownDays = (dateStr?: string) => {
    if (!dateStr) return null;
    const launch = new Date(dateStr);
    const now = new Date();
    launch.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = launch.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Score Badge
  const getScoreBadge = (score: number) => {
    if (score === 100) return <Badge className="bg-green-600 border border-green-500/30 text-white font-bold shadow-md shadow-green-500/10">100% Green</Badge>;
    if (score >= 80) return <Badge className="bg-amber-600 border border-amber-500/30 text-white font-bold shadow-md shadow-amber-500/10">{score}% Yellow</Badge>;
    return <Badge variant="destructive" className="font-bold shadow-md shadow-red-500/10">{score}% Red</Badge>;
  };

  // Items grouped by category
  const groupedChecklistItems = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    checklistItems.forEach((item) => {
      const cat = item.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [checklistItems]);

  // Helper for rendering 7 core compliance requirement status badges
  const renderReqPill = (shortLabel: string, fullLabel: string, item?: EmployeeComplianceItem) => {
    const status = item?.status || "missing";
    if (status === "verified") {
      return (
        <span
          title={`${fullLabel}: Verified`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap shadow-xs"
        >
          <Check className="h-2.5 w-2.5 shrink-0" />
          {shortLabel}
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span
          title={`${fullLabel}: Pending Verification`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap shadow-xs"
        >
          <Clock className="h-2.5 w-2.5 shrink-0" />
          {shortLabel}
        </span>
      );
    }
    if (status === "na") {
      return (
        <span
          title={`${fullLabel}: Not Applicable`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border whitespace-nowrap"
        >
          {shortLabel} N/A
        </span>
      );
    }
    return (
      <span
        title={`${fullLabel}: Missing / Incomplete`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 whitespace-nowrap shadow-xs"
      >
        <XCircle className="h-2.5 w-2.5 shrink-0" />
        {shortLabel}
      </span>
    );
  };

  if (activeFileEmployeeId) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveFileEmployeeId(null)}
            className="flex items-center gap-2 font-semibold w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Compliance Center
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Employee File Workspace Mode
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(isAdmin ? `/admin/employees?id=${activeFileEmployeeId}` : `/manager/employees?id=${activeFileEmployeeId}`)}
              className="text-xs text-primary flex items-center gap-1"
            >
              Open in Employee Directory
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <EmployeeFileWorkspace
          employeeId={activeFileEmployeeId}
          onBack={() => setActiveFileEmployeeId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Mode Navigation Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-muted/40 border border-border/80 shadow-sm">
        <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setComplianceCenterMode("employees")}
            className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              complianceCenterMode === "employees"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.01]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Employee Compliance Center</span>
            {employeeSummary && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-extrabold ${
                complianceCenterMode === "employees" ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
              }`}>
                {employeeSummary.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setComplianceCenterMode("websites")}
            className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              complianceCenterMode === "websites"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.01]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Website Compliance Center</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-extrabold ${
              complianceCenterMode === "websites" ? "bg-white/20 text-white" : "bg-muted-foreground/20 text-foreground"
            }`}>
              {websites.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end px-2">
          {complianceCenterMode === "employees" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadEmployeeCompliance()}
              disabled={empLoading}
              className="text-xs font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${empLoading ? "animate-spin" : ""}`} />
              Refresh Employee Compliance
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadData()}
              disabled={loading}
              className="text-xs font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Websites
            </Button>
          )}
        </div>
      </div>

      {/* ================= EMPLOYEE COMPLIANCE CENTER ================= */}
      {complianceCenterMode === "employees" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  Employee Compliance Center
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Track workforce compliance across all 7 essential criteria: Driver's License, SS Card, Email, Phone, Signed Docs, E-Verify, and Downloaded Apps. Directly linked to Employee File Workspace.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(isAdmin ? "/admin/employees" : "/manager/employees")}
                className="font-semibold text-xs flex items-center gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                Employee Directory
                <ExternalLink className="h-3 w-3 opacity-70" />
              </Button>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Monitored</p>
                  <p className="text-2xl sm:text-3xl font-black mt-1 text-foreground">
                    {employeeSummary?.total ?? employeeRecords.length}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Active company workforce</span>
              </div>
            </Card>

            <Card className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">100% Fully Compliant</p>
                  <p className="text-2xl sm:text-3xl font-black mt-1 text-emerald-500">
                    {employeeSummary?.compliantCount ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>All 7 criteria verified</span>
              </div>
            </Card>

            <Card className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action Required</p>
                  <p className="text-2xl sm:text-3xl font-black mt-1 text-amber-500">
                    {employeeSummary?.actionRequiredCount ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Missing or unverified documents</span>
              </div>
            </Card>

            <Card className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workforce Health</p>
                  <p className="text-2xl sm:text-3xl font-black mt-1 text-primary">
                    {employeeSummary?.avgScore ?? 0}%
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Progress value={employeeSummary?.avgScore ?? 0} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground text-right">Average completion rate</p>
              </div>
            </Card>
          </div>

          {/* 7 Core Checklist Requirements Overview Banner */}
          <Card className="p-4 rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold tracking-tight">The 7 Mandatory Employee Compliance Standards</h3>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">Linked to the Employee File Workspace</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              <div className="p-2.5 rounded-xl border border-border/70 bg-muted/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <CreditCard className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Driv Lic</span>
                </div>
                <p className="text-[10px] text-muted-foreground">State driver's license or photo ID</p>
              </div>

              <div className="p-2.5 rounded-xl border border-border/70 bg-muted/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Fingerprint className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>SS Card</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Social Security card document</p>
              </div>

              <div className="p-2.5 rounded-xl border border-border/70 bg-muted/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Mail className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Email</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Confirmed working email</p>
              </div>

              <div className="p-2.5 rounded-xl border border-border/70 bg-muted/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Phone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Phone Number</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Direct contact phone on file</p>
              </div>

              <div className="p-2.5 rounded-xl border border-border/70 bg-muted/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <FileSignature className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span>Signed Docs</span>
                </div>
                <p className="text-[10px] text-muted-foreground">W-4, I-9, Handbook, Policy forms</p>
              </div>

              <div className="p-2.5 rounded-xl border border-border/70 bg-muted/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <FileCheck2 className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  <span>E-Verify</span>
                </div>
                <p className="text-[10px] text-muted-foreground">DHS Employment eligibility confirmed</p>
              </div>

              <div className="p-2.5 rounded-xl border border-border/70 bg-muted/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Smartphone className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span>Req Apps</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Downloaded required mobile apps</p>
              </div>
            </div>
          </Card>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee by name, email, phone, role, department..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="pl-9 text-xs sm:text-sm h-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={empStatusFilter} onValueChange={(val: any) => setEmpStatusFilter(val)}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="compliant">100% Compliant</SelectItem>
                  <SelectItem value="action_required">Action Required</SelectItem>
                </SelectContent>
              </Select>

              <Select value={empDeptFilter} onValueChange={(val: any) => setEmpDeptFilter(val)}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Employee Compliance Table */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs">Employee</TableHead>
                    <TableHead className="font-bold text-xs text-center">Compliance Status</TableHead>
                    <TableHead className="font-bold text-xs text-center">Driver's License</TableHead>
                    <TableHead className="font-bold text-xs text-center">SS Card</TableHead>
                    <TableHead className="font-bold text-xs text-center">Email</TableHead>
                    <TableHead className="font-bold text-xs text-center">Phone</TableHead>
                    <TableHead className="font-bold text-xs text-center">Signed Docs</TableHead>
                    <TableHead className="font-bold text-xs text-center">E-Verify</TableHead>
                    <TableHead className="font-bold text-xs text-center">Req Apps</TableHead>
                    <TableHead className="font-bold text-xs text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading employee compliance records...
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                        <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                        <p className="font-semibold text-foreground">No employee compliance records match your filters</p>
                        <p className="text-xs mt-1">Try adjusting your search query or department filter</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const chk = emp.complianceChecklist;
                      return (
                        <TableRow key={emp._id} className="hover:bg-muted/30 transition-colors">
                          {/* Employee Info */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border shrink-0">
                                <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                  {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-foreground truncate">{emp.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  <span className="truncate">{emp.role || "Employee"}</span>
                                  {emp.department && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {emp.department}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Compliance Score */}
                          <TableCell className="text-center py-3">
                            <div className="inline-flex flex-col items-center gap-1">
                              {emp.isCompliant ? (
                                <Badge className="bg-emerald-600 border border-emerald-500/30 text-white font-bold text-[11px] shadow-xs">
                                  100% Compliant
                                </Badge>
                              ) : emp.score >= 70 ? (
                                <Badge className="bg-amber-600 border border-amber-500/30 text-white font-bold text-[11px] shadow-xs">
                                  {emp.score}% In Progress
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="font-bold text-[11px] shadow-xs">
                                  {emp.score}% Incomplete
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {emp.verifiedCount} of {emp.totalRequired} verified
                              </span>
                            </div>
                          </TableCell>

                          {/* 1. Driver's License */}
                          <TableCell className="text-center py-3">
                            {renderReqPill("DL", "Driver's License", chk?.drivLic)}
                          </TableCell>

                          {/* 2. SS Card */}
                          <TableCell className="text-center py-3">
                            {renderReqPill("SSN", "SS Card", chk?.ssCard)}
                          </TableCell>

                          {/* 3. Email */}
                          <TableCell className="text-center py-3">
                            {renderReqPill("Email", "Email", chk?.email)}
                          </TableCell>

                          {/* 4. Phone Number */}
                          <TableCell className="text-center py-3">
                            {renderReqPill("Phone", "Phone Number", chk?.phoneNumber)}
                          </TableCell>

                          {/* 5. Signed Docs */}
                          <TableCell className="text-center py-3">
                            {renderReqPill(
                              chk?.signedDocs?.docCount ? `${chk.signedDocs.docCount} Docs` : "Docs",
                              "Signed Documents",
                              chk?.signedDocs
                            )}
                          </TableCell>

                          {/* 6. E-Verify */}
                          <TableCell className="text-center py-3">
                            {renderReqPill("E-Verify", "E-Verify", chk?.eVerify)}
                          </TableCell>

                          {/* 7. Downloaded Required Apps */}
                          <TableCell className="text-center py-3">
                            {renderReqPill("Apps", "Downloaded Required Apps", chk?.downloadedApps)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right py-3 pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Primary: View Employee File (Workspace module) */}
                              <Button
                                size="sm"
                                onClick={() => setActiveFileEmployeeId(emp._id)}
                                className="h-8 px-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 shadow-xs"
                                title="Open Employee File Workspace module directly"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Employee File</span>
                              </Button>

                              {/* Secondary: Audit checklist */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmpForEdit(emp);
                                  setEmpChecklistDraft(JSON.parse(JSON.stringify(emp.complianceChecklist)));
                                }}
                                className="h-8 px-2 text-xs font-semibold"
                                title="Audit & update compliance checklist items"
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                              </Button>

                              {/* Quick jump to Directory */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(isAdmin ? `/admin/employees?id=${emp._id}` : `/manager/employees?id=${emp._id}`)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Open in Directory"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* ================= WEBSITE COMPLIANCE CENTER ================= */}
      {complianceCenterMode === "websites" && (
        <div className="space-y-6">
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse" />
                Website Compliance Center
              </h1>
              <p className="text-sm text-muted-foreground">
                Track website deployment readiness, execute checklist templates, audit launch tasks, and view accountability logs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadData()}
                disabled={loading}
                className={isMetallic ? "bg-zinc-800 border-[#ffd27a]/30 text-white hover:bg-zinc-700" : ""}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className={isMetallic ? "bg-gradient-to-r from-[#ffd27a] to-[#d8a537] text-black font-bold border border-[#ffd27a] hover:from-[#ffe09e]" : ""}
              >
                <Plus className="h-4 w-4 mr-2" />
                Register Site Launch
              </Button>
            </div>
          </div>

      {/* Summary Analytics Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Active Websites KPI Card */}
          <Card className={`relative overflow-hidden ${isMetallic ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" : "bg-card border border-border shadow-sm"}`}>
            {renderRivets()}
            <CardHeader className="pb-2">
              <CardDescription className={isMetallic ? "text-zinc-400 font-bold" : ""}>Active Websites</CardDescription>
              <CardTitle className="text-3xl font-black text-[#00C6FF]">
                {websites.filter(w => w.websiteType === "active" || w.status === "Live").length} <span className="text-xs text-muted-foreground font-normal">active</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                <ShieldCheck className="h-4 w-4" />
                <span>{websites.length} total monitored</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Live & monitored production sites.
              </p>
            </CardContent>
          </Card>

          {/* Average Readiness Score Card */}
          <Card className={`relative overflow-hidden ${isMetallic ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" : "bg-card border border-border shadow-sm"}`}>
            {renderRivets()}
            <CardHeader className="pb-2">
              <CardDescription className={isMetallic ? "text-zinc-400 font-bold" : ""}>Average Readiness Score</CardDescription>
              <CardTitle className={`text-3xl font-black ${isMetallic ? "text-[#ffd27a]" : "text-primary"}`}>
                {report.avgScore}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={report.avgScore} 
                className="h-2" 
                style={{ 
                  backgroundColor: isMetallic ? "rgba(0,0,0,0.4)" : undefined,
                }}
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                Across {report.totalWebsites} monitored launch paths.
              </p>
            </CardContent>
          </Card>

          {/* Green Scorecards */}
          <Card className={`relative overflow-hidden ${isMetallic ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" : "bg-card border border-border shadow-sm"}`}>
            {renderRivets()}
            <CardHeader className="pb-2">
              <CardDescription className={isMetallic ? "text-zinc-400 font-bold" : ""}>Green (100% Safe)</CardDescription>
              <CardTitle className="text-3xl font-black text-green-500">
                {report.statusBreakdown.green} <span className="text-xs text-muted-foreground font-normal">sites</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.min(5, report.statusBreakdown.green) }).map((_, i) => (
                  <div key={i} className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                100% compliant with standard policies.
              </p>
            </CardContent>
          </Card>

          {/* Yellow scorecards */}
          <Card className={`relative overflow-hidden ${isMetallic ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" : "bg-card border border-border shadow-sm"}`}>
            {renderRivets()}
            <CardHeader className="pb-2">
              <CardDescription className={isMetallic ? "text-zinc-400 font-bold" : ""}>Yellow (80%-99%)</CardDescription>
              <CardTitle className="text-3xl font-black text-amber-500">
                {report.statusBreakdown.yellow} <span className="text-xs text-muted-foreground font-normal">sites</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.min(5, report.statusBreakdown.yellow) }).map((_, i) => (
                  <div key={i} className="h-3 w-3 rounded-full bg-amber-500" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Approaching launch readiness, checklist pending.
              </p>
            </CardContent>
          </Card>

          {/* Red status alerts */}
          <Card className={`relative overflow-hidden ${isMetallic ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" : "bg-card border border-border shadow-sm"}`}>
            {renderRivets()}
            <CardHeader className="pb-2">
              <CardDescription className={isMetallic ? "text-zinc-400 font-bold" : ""}>Red (Blocked/Early)</CardDescription>
              <CardTitle className="text-3xl font-black text-red-500">
                {report.statusBreakdown.red} <span className="text-xs text-muted-foreground font-normal">sites</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.min(5, report.statusBreakdown.red) }).map((_, i) => (
                  <div key={i} className="h-3 w-3 rounded-full bg-red-500 animate-bounce" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Requires direct focus and QA check before launch.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Content Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Filters Box */}
        <div className="xl:col-span-1 space-y-6">
          <Card className={`relative ${isMetallic ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" : "bg-card border border-border shadow-sm"}`}>
            {renderRivets()}
            <CardHeader>
              <CardTitle className={isMetallic ? "text-[#ffd27a] font-bold" : ""}>Filters</CardTitle>
              <CardDescription>Refine website scorecards list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Site name, developer, domain..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Readiness Status</label>
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Scores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="green">Green (100%)</SelectItem>
                    <SelectItem value="yellow">Yellow (80% - 99%)</SelectItem>
                    <SelectItem value="red">Red (0% - 79%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Environment</label>
                <Select value={envFilter} onValueChange={setEnvFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Environments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Environments</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Staging">Staging</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Business Unit</label>
                <Select value={buFilter} onValueChange={setBuFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Employee Contribution Leaderboard */}
          <Card className={`relative ${isMetallic ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" : "bg-card border border-border shadow-sm"}`}>
            {renderRivets()}
            <CardHeader className="pb-3">
              <CardTitle className={`text-base font-bold flex items-center gap-2 ${isMetallic ? "text-[#ffd27a]" : ""}`}>
                <TrendingUp className="h-4 w-4" />
                Employee Leaderboard
              </CardTitle>
              <CardDescription>Top completions contribution count</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No task completion records registered yet.</p>
                ) : (
                  leaderboard.map((item, idx) => (
                    <div
                      key={item.username}
                      className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                        isMetallic ? "bg-black/35 hover:bg-black/50 border border-white/5" : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-xs h-5 w-5 rounded-full flex items-center justify-center ${
                          idx === 0 ? "bg-[#ffd27a] text-black" : idx === 1 ? "bg-zinc-300 text-black" : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-semibold">{item.username}</span>
                      </div>
                      <Badge variant="outline" className={isMetallic ? "border-[#ffd27a]/20 text-[#ffd27a]" : ""}>
                        {item.count} items
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right content list */}
        <div className="xl:col-span-3 space-y-6">
          <Card className={`relative ${isMetallic ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" : "bg-card border border-border shadow-sm"}`}>
            {renderRivets()}
            <CardHeader className="pb-3">
              <CardTitle className={isMetallic ? "text-[#ffd27a] font-bold" : ""}>Websites Launch & Compliance Status</CardTitle>
              <CardDescription>Active launch pipeline scorecards and checkpoints verification.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  Fetching launch scorecards...
                </div>
              ) : filteredWebsites.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No websites matching active filters. Register a new site to monitor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={isMetallic ? "border-zinc-800 hover:bg-transparent" : ""}>
                        <TableHead className={isMetallic ? "text-[#ffd27a] font-bold" : ""}>Site Details</TableHead>
                        <TableHead className={isMetallic ? "text-[#ffd27a] font-bold" : ""}>Lead & Unit</TableHead>
                        <TableHead className={isMetallic ? "text-[#ffd27a] font-bold" : ""}>Launch Date / Countdown</TableHead>
                        <TableHead className={isMetallic ? "text-[#ffd27a] font-bold" : ""}>Readiness Score</TableHead>
                        <TableHead className={isMetallic ? "text-[#ffd27a] font-bold" : ""}></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWebsites.map((site) => {
                        const countdown = getCountdownDays(site.launchDate);
                        
                        return (
                          <TableRow key={site._id} className={isMetallic ? "border-zinc-800 hover:bg-zinc-800/40" : ""}>
                            <TableCell className="max-w-[200px]">
                              <div className="font-bold text-foreground truncate">{site.siteName}</div>
                              <a
                                href={site.url.startsWith("http") ? site.url : `https://${site.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#00C6FF] hover:underline flex items-center gap-1 inline-block mt-0.5 truncate"
                              >
                                {site.url}
                                <ExternalLink className="h-3 w-3 inline" />
                              </a>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="secondary" className="text-[10px] px-1 py-0.2">
                                  {site.environment}
                                </Badge>
                                {site.platform && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0.2">
                                    {site.platform}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-semibold">{site.leadDeveloper || "Unassigned"}</div>
                              <div className="text-xs text-muted-foreground">{site.businessUnit}</div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {site.launchDate ? (
                                  <div className="text-xs font-medium flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    Launch: {new Date(site.launchDate).toLocaleDateString()}
                                  </div>
                                ) : null}
                                {site.originalPurchaseDate ? (
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    Purchased: {new Date(site.originalPurchaseDate).toLocaleDateString()}
                                  </div>
                                ) : null}
                                {site.expirationDate ? (
                                  <div className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                                    Expires: {new Date(site.expirationDate).toLocaleDateString()}
                                  </div>
                                ) : null}
                                {!site.launchDate && !site.originalPurchaseDate && !site.expirationDate && (
                                  <span className="text-xs text-muted-foreground">Not set</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1.5 max-w-[140px]">
                                <div className="flex items-center justify-between text-xs">
                                  {getScoreBadge(site.readinessScore)}
                                </div>
                                <Progress value={site.readinessScore} className="h-1.5" />
                                {site.overrideReason && (
                                  <Badge className="bg-purple-600/30 text-purple-400 border border-purple-500/20 text-[9px] px-1 py-0.2 block text-center truncate" title={`Override Reason: ${site.overrideReason}`}>
                                    Overridden
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void openComplianceDrawer(site)}
                                className={isMetallic ? "bg-zinc-800 border-[#ffd27a]/30 hover:bg-[#ffd27a]/15 text-white" : ""}
                              >
                                View Checklist
                                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Global compliance audit trail logs list at bottom */}
      <Card className={`relative ${isMetallic ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" : "bg-card border border-border shadow-sm"}`}>
        {renderRivets()}
        <CardHeader>
          <CardTitle className={`text-base font-bold flex items-center gap-2 ${isMetallic ? "text-[#ffd27a]" : ""}`}>
            <History className="h-4 w-4" />
            Global Compliance Audit Logs
          </CardTitle>
          <CardDescription>Real-time updates, checklist logs, state transitions, and compliance history</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[300px] overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            {((selectedWebsite && siteHistory.length > 0) ? siteHistory : globalAuditLogs).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No compliance actions or checklist modifications recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {((selectedWebsite && siteHistory.length > 0) ? siteHistory : globalAuditLogs).map((log) => (
                  <div
                    key={log._id}
                    className={`p-3 rounded-lg border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isMetallic ? "bg-black/25 border-zinc-800/40" : "bg-muted/30 border-muted"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {log.siteName && (
                          <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                            {log.siteName}
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                        <span className="font-semibold flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {log.username}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-foreground font-medium text-xs">{log.notes}</p>
                      {log.previousState && log.newState && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="line-through">{log.previousState}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="text-[#00C6FF] font-bold">{log.newState}</span>
                        </div>
                      )}
                    </div>
                    {log.ipAddress && (
                      <div className="text-right text-[10px] text-muted-foreground shrink-0">
                        <div>IP: {log.ipAddress}</div>
                        <div className="max-w-[150px] truncate" title={log.deviceInfo}>Device: {log.deviceInfo}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )}

      {/* Website Registration Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={isMetallic ? "bg-zinc-900 border-[#ffd27a]/30 text-white" : ""}>
          <DialogHeader>
            <DialogTitle className={isMetallic ? "text-[#ffd27a] font-bold" : ""}>Register Website Launch</DialogTitle>
            <DialogDescription>Setup a new compliance tracking profile for web projects.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWebsite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold">Website Name *</label>
                <Input
                  required
                  placeholder="e.g. Acme SaaS Product"
                  value={newSite.siteName}
                  onChange={(e) => setNewSite({ ...newSite, siteName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold">Domain / URL *</label>
                <Input
                  required
                  placeholder="e.g. acme.com or staging.acme.com"
                  value={newSite.url}
                  onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Website Type</label>
                <Select
                  value={newSite.websiteType}
                  onValueChange={(val) => setNewSite({ ...newSite, websiteType: val as "active" | "future" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Production/Live)</SelectItem>
                    <SelectItem value="future">Future (In Dev/Planning)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Environment</label>
                <Select
                  value={newSite.environment}
                  onValueChange={(val) => setNewSite({ ...newSite, environment: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Staging">Staging</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Business Unit</label>
                <Select
                  value={newSite.businessUnit}
                  onValueChange={(val) => setNewSite({ ...newSite, businessUnit: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Lead Developer</label>
                <Input
                  placeholder="Username of lead dev"
                  value={newSite.leadDeveloper}
                  onChange={(e) => setNewSite({ ...newSite, leadDeveloper: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Platform</label>
                <Input
                  placeholder="e.g. Next.js, Webflow, WordPress"
                  value={newSite.platform}
                  onChange={(e) => setNewSite({ ...newSite, platform: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Compliance Template</label>
                <Select
                  value={newSite.complianceTemplate}
                  onValueChange={(val) => setNewSite({ ...newSite, complianceTemplate: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((tpl) => (
                      <SelectItem key={tpl.key} value={tpl.key}>
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Target Launch Date
                </label>
                <Input
                  type="date"
                  value={newSite.launchDate}
                  onChange={(e) => setNewSite({ ...newSite, launchDate: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Original Purchase Date
                </label>
                <Input
                  type="date"
                  value={newSite.originalPurchaseDate}
                  onChange={(e) => setNewSite({ ...newSite, originalPurchaseDate: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-rose-500" />
                  Domain Expiration Date
                </label>
                <Input
                  type="date"
                  value={newSite.expirationDate}
                  onChange={(e) => setNewSite({ ...newSite, expirationDate: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className={isMetallic ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700" : ""}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className={isMetallic ? "bg-[#ffd27a] text-black font-bold border border-[#ffd27a] hover:bg-[#ffe09e]" : ""}
              >
                Create Website Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Checklist details side-drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent className={`w-full max-w-xl md:max-w-2xl overflow-y-auto no-scrollbar ${
          isMetallic ? "bg-zinc-900 text-white border-l border-[#ffd27a]/20" : ""
        }`}>
          {selectedWebsite && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className={`text-xl font-black ${isMetallic ? "text-[#ffd27a]" : ""}`}>
                  {selectedWebsite.siteName} Checklist
                </SheetTitle>
                <SheetDescription className={isMetallic ? "text-zinc-400" : ""}>
                  Environment: <span className="font-bold text-foreground">{selectedWebsite.environment}</span> | BU: <span className="font-bold text-foreground">{selectedWebsite.businessUnit}</span>
                </SheetDescription>
              </SheetHeader>

              {/* Progress Summary in Drawer */}
              <div className={`p-4 rounded-xl border ${
                isMetallic ? "bg-black/30 border-[#ffd27a]/15" : "bg-muted/40"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">Readiness Progress</span>
                  {getScoreBadge(selectedWebsite.readinessScore)}
                </div>
                <Progress value={selectedWebsite.readinessScore} className="h-2" />
                
                {selectedWebsite.overrideReason && (
                  <div className="mt-3 text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 p-2.5 rounded-lg flex items-start gap-1.5">
                    <Lock className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-purple-300">Admin Override Active:</span> {selectedWebsite.overrideReason}
                    </div>
                  </div>
                )}
              </div>

              {/* Website Locations Map */}
              {selectedWebsite.locations && selectedWebsite.locations.length > 0 && (
                <WebsiteLocationsMap locations={selectedWebsite.locations} isMetallic={isMetallic} />
              )}

              {/* Core Requirements Section */}
              <Card className={`p-4 border ${isMetallic ? "bg-black/30 border-[#ffd27a]/15 text-white" : "bg-card border-border"}`}>
                <h3 className="font-bold text-sm text-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Core Website Requirements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "googleAnalytics", label: "Google Analytics" },
                    { key: "humanVerification", label: "Human Verification (Math Puzzle)" },
                    { key: "largeHeaderImage", label: "Large Header Image" },
                    { key: "contactInfoSection", label: "Contact Info Section" },
                    { key: "adaCompliance", label: "ADA Compliance" },
                    { key: "faq", label: "FAQ" },
                    { key: "contactUsPage", label: "Contact Us Page" },
                    { key: "privacyPolicy", label: "Privacy Policy" },
                    { key: "seo", label: "SEO" },
                    { key: "siteMap", label: "Site Map" },
                    { key: "stripeIntegration", label: "Stripe Integration" },
                    { key: "bugReportButton", label: "Bug Report Button" },
                    { key: "googleMaps", label: "Google Maps" },
                    { key: "appleMaps", label: "Apple Maps" },
                    { key: "infoEmailSetup", label: "info@ Email Setup" },
                    { key: "nathanEmailSetup", label: "nathan@ Email Setup" }
                  ].map((reqItem) => {
                    const val = (selectedWebsite as any)[reqItem.key] || "none";
                    const matchItem = checklistItems.find(i => i.title === reqItem.label);
                    
                    return (
                      <div key={reqItem.key} className={`flex flex-col p-2 rounded-lg border ${
                        isMetallic ? "bg-[#1b1c1d]/50 border-zinc-800" : "bg-muted/30 border-muted"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground truncate mr-2">{reqItem.label}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Current Status Indicator */}
                            <div className="mr-1">
                              {val === "green" ? (
                                <span title="Compliant (Green)"><CheckCircle2 className="h-4 w-4 text-green-500" /></span>
                              ) : val === "red" ? (
                                <span title="Non-Compliant / Missing (Red)"><XCircle className="h-4 w-4 text-red-500" /></span>
                              ) : val === "na" ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" title="N/A (Counts to Compliance)">
                                  N/A
                                </span>
                              ) : (
                                <span title="Not Checked"><AlertCircle className="h-4 w-4 text-muted-foreground" /></span>
                              )}
                            </div>
                            
                            {/* Toggle buttons */}
                            <button
                              onClick={() => handleToggleCoreReq(reqItem.key, "green")}
                              disabled={actionLoading}
                              className={`p-1 rounded transition-colors ${
                                val === "green" ? "bg-green-500/20 text-green-500" : "hover:bg-green-500/10 text-muted-foreground"
                              }`}
                              title="Set Compliant"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleCoreReq(reqItem.key, "red")}
                              disabled={actionLoading}
                              className={`p-1 rounded transition-colors ${
                                val === "red" ? "bg-red-500/20 text-red-500" : "hover:bg-red-500/10 text-muted-foreground"
                              }`}
                              title="Set Non-Compliant"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleCoreReq(reqItem.key, "na")}
                              disabled={actionLoading}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                val === "na" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "hover:bg-cyan-500/10 text-muted-foreground"
                              }`}
                              title="Mark N/A (Counts toward Compliance %)"
                            >
                              N/A
                            </button>
                            <button
                              onClick={() => handleToggleCoreReq(reqItem.key, "none")}
                              disabled={actionLoading}
                              className={`p-1.5 rounded hover:bg-muted text-muted-foreground flex items-center justify-center`}
                              title="Reset / Close Status"
                            >
                              <span className="text-[10px] font-black leading-none">X</span>
                            </button>
                          </div>
                        </div>
                        {matchItem?.completedBy && (
                          <div className="text-[9px] text-muted-foreground mt-1 text-right">
                            Verified by: <strong className="text-foreground">{matchItem.completedBy}</strong>
                            {matchItem.completedAt && ` on ${new Date(matchItem.completedAt).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Social Media Compliance Checklist Section */}
              <Card className={`p-4 border ${isMetallic ? "bg-black/30 border-[#ffd27a]/15 text-white" : "bg-card border-border"}`}>
                <h3 className="font-bold text-sm text-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Social Media Compliance Checklist
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "youtubeCompliance", label: "YouTube" },
                    { key: "rumbleCompliance", label: "Rumble" },
                    { key: "libertySocialCompliance", label: "Liberty Social" },
                    { key: "facebookCompliance", label: "Facebook" },
                    { key: "xCompliance", label: "X (Twitter)" },
                    { key: "instagramCompliance", label: "Instagram" },
                    { key: "tikTokCompliance", label: "TikTok" },
                    { key: "yelpCompliance", label: "Yelp" },
                    { key: "truthSocialCompliance", label: "Truth Social" },
                    { key: "threadsCompliance", label: "Threads" }
                  ].map((socialItem) => {
                    const val = (selectedWebsite as any)[socialItem.key] || "none";
                    const matchItem = checklistItems.find(i => i.title === socialItem.label);

                    return (
                      <div key={socialItem.key} className={`flex flex-col p-2 rounded-lg border ${
                        isMetallic ? "bg-[#1b1c1d]/50 border-zinc-800" : "bg-muted/30 border-muted"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground truncate mr-2">{socialItem.label}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="mr-1">
                              {val === "green" ? (
                                <span title="Compliant (Green)"><CheckCircle2 className="h-4 w-4 text-green-500" /></span>
                              ) : val === "red" ? (
                                <span title="Non-Compliant / Missing (Red)"><XCircle className="h-4 w-4 text-red-500" /></span>
                              ) : val === "na" ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" title="N/A (Counts to Compliance)">
                                  N/A
                                </span>
                              ) : (
                                <span title="Not Checked"><AlertCircle className="h-4 w-4 text-muted-foreground" /></span>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleToggleCoreReq(socialItem.key, "green")}
                              disabled={actionLoading}
                              className={`p-1 rounded transition-colors ${
                                val === "green" ? "bg-green-500/20 text-green-500" : "hover:bg-green-500/10 text-muted-foreground"
                              }`}
                              title="Set Compliant"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleCoreReq(socialItem.key, "red")}
                              disabled={actionLoading}
                              className={`p-1 rounded transition-colors ${
                                val === "red" ? "bg-red-500/20 text-red-500" : "hover:bg-red-500/10 text-muted-foreground"
                              }`}
                              title="Set Non-Compliant"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleCoreReq(socialItem.key, "na")}
                              disabled={actionLoading}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                val === "na" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "hover:bg-cyan-500/10 text-muted-foreground"
                              }`}
                              title="Mark N/A (Counts toward Compliance %)"
                            >
                              N/A
                            </button>
                            <button
                              onClick={() => handleToggleCoreReq(socialItem.key, "none")}
                              disabled={actionLoading}
                              className={`p-1.5 rounded hover:bg-muted text-muted-foreground flex items-center justify-center`}
                              title="Reset / Close Status"
                            >
                              <span className="text-[10px] font-black leading-none">X</span>
                            </button>
                          </div>
                        </div>
                        {matchItem?.completedBy && (
                          <div className="text-[9px] text-muted-foreground mt-1 text-right">
                            Verified by: <strong className="text-foreground">{matchItem.completedBy}</strong>
                            {matchItem.completedAt && ` on ${new Date(matchItem.completedAt).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Override Parameter Button for Administrators */}
              {isAdmin && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOverrideScore(String(selectedWebsite.readinessScore));
                      setOverrideStatus(selectedWebsite.status);
                      setIsOverrideOpen(true);
                    }}
                    className={isMetallic ? "border-purple-500/30 text-purple-400 hover:bg-purple-500/10" : "text-primary"}
                  >
                    <Lock className="h-3.5 w-3.5 mr-2" />
                    Admin Override Panel
                  </Button>
                </div>
              )}

              {/* Checklist Items list */}
              {actionLoading && checklistItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading items...
                </div>
              ) : checklistItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex flex-col items-center">
                  <AlertCircle className="h-6 w-6 mb-2" />
                  No templates assigned to this website. Edit website profile to select a compliance template path.
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Compliance Checkpoints</h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {Object.entries(groupedChecklistItems).map(([category, items]) => (
                      <AccordionItem
                        key={category}
                        value={category}
                        className={`border rounded-xl px-4 ${
                          isMetallic ? "bg-black/20 border-zinc-800/80" : "bg-card border-border"
                        }`}
                      >
                        <AccordionTrigger className="hover:no-underline font-bold text-sm py-3 text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{category}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5">
                              {items.filter((i) => i.status === "completed" || i.status === "na").length}/{items.length} Done
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-4">
                          {items.map((item) => {
                            const isEditing = editingItem?._id === item._id;

                            return (
                              <div
                                key={item._id}
                                className={`p-3 rounded-lg border space-y-3 ${
                                  isMetallic ? "bg-zinc-950/60 border-zinc-900" : "bg-muted/30 border-muted"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-sm flex items-center gap-1.5">
                                      {item.status === "completed" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                      ) : item.status === "blocked" ? (
                                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                      ) : item.status === "in-progress" ? (
                                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                      ) : item.status === "na" ? (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">N/A</span>
                                      ) : (
                                        <div className="h-4 w-4 rounded-full border border-muted-foreground shrink-0" />
                                      )}
                                      {item.title}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                  </div>
                                  <div className="shrink-0 flex items-center gap-2">
                                    {item.requiresEvidence && (
                                      <Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500/20 bg-amber-500/5">
                                        Evidence Required
                                      </Badge>
                                    )}
                                    <Badge
                                      variant={
                                        item.status === "blocked"
                                          ? "destructive"
                                          : item.status === "in-progress"
                                          ? "secondary"
                                          : item.status === "completed" || item.status === "na"
                                          ? "default"
                                          : "outline"
                                      }
                                      className={`capitalize text-[10px] ${
                                        item.status === "completed"
                                          ? "bg-green-600 hover:bg-green-700 text-white"
                                          : item.status === "na"
                                          ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                                          : ""
                                      }`}
                                    >
                                      {item.status === "na" ? "N/A (Compliant)" : item.status}
                                    </Badge>
                                  </div>
                                </div>

                                {item.notes && !isEditing && (
                                  <div className="text-xs text-muted-foreground bg-black/10 p-2 rounded">
                                    <span className="font-bold">Notes:</span> {item.notes}
                                  </div>
                                )}

                                {item.status === "blocked" && item.blockedReason && !isEditing && (
                                  <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded">
                                    <span className="font-bold">Blocked Reason:</span> {item.blockedReason}
                                  </div>
                                )}

                                {/* Attachments/Evidence Preview */}
                                {(item.evidenceUrl || item.evidenceFile) && !isEditing && (
                                  <div className="flex flex-wrap gap-2 pt-1.5">
                                    {item.evidenceUrl && (
                                      <a
                                        href={item.evidenceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-[#00C6FF] hover:underline flex items-center gap-1"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Evidence URL
                                      </a>
                                    )}
                                    {item.evidenceFile && (
                                      <a
                                        href={item.evidenceFile}
                                        download={`evidence-${item._id}.png`}
                                        className="text-xs text-[#ffd27a] hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        Download Uploaded Screenshot
                                      </a>
                                    )}
                                  </div>
                                )}

                                {item.completedBy && (
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                    <span>Verified by: <strong className="text-foreground">{item.completedBy}</strong></span>
                                    {item.completedAt && (
                                      <span>on {new Date(item.completedAt).toLocaleString()}</span>
                                    )}
                                  </div>
                                )}

                                {/* Editing item options */}
                                {isEditing ? (
                                  <div className="pt-3 border-t border-muted/50 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-zinc-400">Change Status</label>
                                        <Select
                                          value={itemStatus}
                                          onValueChange={(val) => setItemStatus(val as ChecklistItem["status"])}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="blocked">Blocked</SelectItem>
                                            <SelectItem value="completed">Completed / Compliant</SelectItem>
                                            <SelectItem value="na">N/A (Counts to Compliance %)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-zinc-400">Evidence Link (URL)</label>
                                        <Input
                                          placeholder="https://..."
                                          value={itemEvidenceUrl}
                                          onChange={(e) => setItemEvidenceUrl(e.target.value)}
                                        />
                                      </div>
                                    </div>

                                    {itemStatus === "blocked" && (
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-red-400">Blocked Reason *</label>
                                        <Input
                                          placeholder="Why is this item blocked?"
                                          value={itemBlockedReason}
                                          onChange={(e) => setItemBlockedReason(e.target.value)}
                                        />
                                      </div>
                                    )}

                                    {/* Base64 Upload File input */}
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-zinc-400 block">Upload Attachment Evidence</label>
                                      <div className="flex items-center gap-3">
                                        <Input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={handleFileChange}
                                          className="text-xs text-muted-foreground file:bg-zinc-800 file:text-white file:border-0 file:rounded-md file:px-2 file:py-1 cursor-pointer"
                                        />
                                        {itemEvidenceFile && (
                                          <Badge className="bg-green-600 text-white text-[10px]">
                                            Ready to Upload
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-zinc-400">Verification Notes</label>
                                      <Textarea
                                        placeholder="Add confirmation notes..."
                                        value={itemNotes}
                                        onChange={(e) => setItemNotes(e.target.value)}
                                        rows={2}
                                      />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingItem(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => void saveChecklistItem(item)}
                                        disabled={actionLoading}
                                        className={isMetallic ? "bg-[#ffd27a] text-black font-bold" : ""}
                                      >
                                        Save Changes
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-end pt-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingItem(item);
                                        setItemStatus(item.status);
                                        setItemNotes(item.notes || "");
                                        setItemEvidenceUrl(item.evidenceUrl || "");
                                        setItemEvidenceFile("");
                                        setItemBlockedReason(item.blockedReason || "");
                                      }}
                                      className={isMetallic ? "text-[#ffd27a] hover:bg-[#ffd27a]/10" : "text-primary"}
                                    >
                                      Update Checkpoint
                                      <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* History Trail inside Drawer */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Audit Trail</h3>
                <div className={`p-3 rounded-xl border max-h-[220px] overflow-y-auto no-scrollbar space-y-2 ${
                  isMetallic ? "bg-black/25 border-zinc-800" : "bg-muted/10 border-muted"
                }`}>
                  {siteHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No audit logs registered yet.</p>
                  ) : (
                    siteHistory.map((log) => (
                      <div key={log._id} className="text-xs border-b border-muted/50 pb-2 mb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center text-muted-foreground text-[10px] mb-1">
                          <span className="font-semibold text-foreground">{log.username}</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="font-medium text-foreground">{log.notes}</p>
                        {log.previousState && log.newState && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {log.previousState} &rarr; <span className="text-[#00C6FF] font-bold">{log.newState}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4 border-t border-muted/50 mt-6">
                <div className="w-full flex justify-end">
                  <Button
                    onClick={closeDrawer}
                    className={isMetallic ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700" : ""}
                  >
                    Close Panel
                  </Button>
                </div>
                <div className="text-center pb-4">
                  <p className="text-sm text-muted-foreground">
                    Part of the <a href="https://se7en.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-semibold">Se7en</a> family of companies.
                  </p>
                </div>
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Admin Override Modal */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent className={isMetallic ? "bg-zinc-900 border-[#ffd27a]/30 text-white" : ""}>
          <DialogHeader>
            <DialogTitle className={isMetallic ? "text-[#ffd27a] font-bold" : ""}>Admin Override Panel</DialogTitle>
            <DialogDescription>Manually force score parameters. Action will be logged permanently in audit logs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Forced Readiness Score (0-100)%</label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Override Score value"
                value={overrideScore}
                onChange={(e) => setOverrideScore(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Override Website Status</label>
              <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Live">Live</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-purple-400">Override Reason (Required) *</label>
              <Textarea
                required
                placeholder="Detail reason for manual bypass / score reset..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOverrideOpen(false)}
              className={isMetallic ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700" : ""}
            >
              Cancel
            </Button>
            <Button
              disabled={actionLoading}
              onClick={submitOverride}
              className={isMetallic ? "bg-[#ffd27a] text-black font-bold border border-[#ffd27a]" : ""}
            >
              Authorize Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Math Puzzle Human Verification Modal */}
      <Dialog open={isMathPuzzleOpen} onOpenChange={setIsMathPuzzleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Shield className="h-5 w-5 text-primary" />
              Human Verification Required
            </DialogTitle>
            <DialogDescription>
              To mark Human Verification as compliant for this website, solve the math puzzle below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyMathPuzzle} className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-2">
              <span className="text-xs uppercase font-semibold text-muted-foreground">Math Challenge</span>
              <h3 className="text-2xl font-black tracking-widest text-primary">
                {mathNum1} + {mathNum2} = ?
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Your Answer</label>
              <Input
                type="number"
                placeholder="Enter calculation result..."
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                autoFocus
                className="text-center font-bold text-lg"
              />
            </div>

            {mathPuzzleError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{mathPuzzleError}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsMathPuzzleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!mathInput.trim()}>
                Verify Human
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Compliance Checklist Dialog */}
      <Dialog open={!!selectedEmpForEdit} onOpenChange={(open) => !open && setSelectedEmpForEdit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Audit Employee Compliance: {selectedEmpForEdit?.name}
                </DialogTitle>
                <DialogDescription>
                  Review and certify the 7 core requirements. Changes update the live Employee File module.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {empChecklistDraft && (
            <div className="space-y-4 py-2">
              {/* 1. Driver's License */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    <span className="font-bold text-sm">1. Driver's License (Photo ID)</span>
                  </div>
                  <Select
                    value={empChecklistDraft.drivLic.status}
                    onValueChange={(val: any) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        drivLic: { ...empChecklistDraft.drivLic, status: val },
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <Input
                    placeholder="Document URL / File reference..."
                    value={empChecklistDraft.drivLic.fileUrl || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        drivLic: { ...empChecklistDraft.drivLic, fileUrl: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Auditor notes / expiration..."
                    value={empChecklistDraft.drivLic.notes || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        drivLic: { ...empChecklistDraft.drivLic, notes: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* 2. SS Card */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-indigo-500" />
                    <span className="font-bold text-sm">2. Social Security Card</span>
                  </div>
                  <Select
                    value={empChecklistDraft.ssCard.status}
                    onValueChange={(val: any) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        ssCard: { ...empChecklistDraft.ssCard, status: val },
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <Input
                    placeholder="Document URL / Vault reference..."
                    value={empChecklistDraft.ssCard.fileUrl || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        ssCard: { ...empChecklistDraft.ssCard, fileUrl: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Auditor notes (e.g. verified on file)..."
                    value={empChecklistDraft.ssCard.notes || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        ssCard: { ...empChecklistDraft.ssCard, notes: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* 3. Email */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-500" />
                    <span className="font-bold text-sm">3. Email Address</span>
                  </div>
                  <Select
                    value={empChecklistDraft.email.status}
                    onValueChange={(val: any) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        email: { ...empChecklistDraft.email, status: val },
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <Input
                    placeholder="Confirmed email address..."
                    value={empChecklistDraft.email.value || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        email: { ...empChecklistDraft.email, value: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Notes..."
                    value={empChecklistDraft.email.notes || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        email: { ...empChecklistDraft.email, notes: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* 4. Phone Number */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-sm">4. Phone Number</span>
                  </div>
                  <Select
                    value={empChecklistDraft.phoneNumber.status}
                    onValueChange={(val: any) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        phoneNumber: { ...empChecklistDraft.phoneNumber, status: val },
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <Input
                    placeholder="Confirmed phone number..."
                    value={empChecklistDraft.phoneNumber.value || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        phoneNumber: { ...empChecklistDraft.phoneNumber, value: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Notes..."
                    value={empChecklistDraft.phoneNumber.notes || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        phoneNumber: { ...empChecklistDraft.phoneNumber, notes: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* 5. Signed Docs */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-purple-500" />
                    <span className="font-bold text-sm">5. Signed Documents (W-4, I-9, Handbook)</span>
                  </div>
                  <Select
                    value={empChecklistDraft.signedDocs.status}
                    onValueChange={(val: any) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        signedDocs: { ...empChecklistDraft.signedDocs, status: val },
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Signed documents count (e.g. 4)..."
                    value={empChecklistDraft.signedDocs.docCount ?? 0}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        signedDocs: { ...empChecklistDraft.signedDocs, docCount: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Document names / notes..."
                    value={empChecklistDraft.signedDocs.notes || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        signedDocs: { ...empChecklistDraft.signedDocs, notes: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* 6. E-Verify */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-teal-500" />
                    <span className="font-bold text-sm">6. E-Verify Case Confirmation</span>
                  </div>
                  <Select
                    value={empChecklistDraft.eVerify.status}
                    onValueChange={(val: any) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        eVerify: { ...empChecklistDraft.eVerify, status: val },
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <Input
                    placeholder="E-Verify case number..."
                    value={empChecklistDraft.eVerify.caseNumber || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        eVerify: { ...empChecklistDraft.eVerify, caseNumber: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Confirmation notes..."
                    value={empChecklistDraft.eVerify.notes || ""}
                    onChange={(e) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        eVerify: { ...empChecklistDraft.eVerify, notes: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* 7. Downloaded Required Apps */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-rose-500" />
                    <span className="font-bold text-sm">7. Downloaded Required Apps</span>
                  </div>
                  <Select
                    value={empChecklistDraft.downloadedApps.status}
                    onValueChange={(val: any) =>
                      setEmpChecklistDraft({
                        ...empChecklistDraft,
                        downloadedApps: { ...empChecklistDraft.downloadedApps, status: val },
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Notes on verified apps (e.g. Task Manager Mobile, Slack, Authenticator)..."
                  value={empChecklistDraft.downloadedApps.notes || ""}
                  onChange={(e) =>
                    setEmpChecklistDraft({
                      ...empChecklistDraft,
                      downloadedApps: { ...empChecklistDraft.downloadedApps, notes: e.target.value },
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
            {selectedEmpForEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const empId = selectedEmpForEdit._id;
                  setSelectedEmpForEdit(null);
                  setActiveFileEmployeeId(empId);
                }}
                className="text-xs text-primary flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                Open Full Employee File Workspace
              </Button>
            )}
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmpForEdit(null)}
                disabled={savingEmpCompliance}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={saveEmployeeComplianceChecklist}
                disabled={savingEmpCompliance}
                className="font-bold flex items-center gap-1.5"
              >
                {savingEmpCompliance ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Save Compliance Audit
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
