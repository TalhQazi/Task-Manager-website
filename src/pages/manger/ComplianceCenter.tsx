import { useEffect, useState, useMemo } from "react";
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
import { apiFetch } from "@/lib/manger/api";
import { getAuthState } from "@/lib/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
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
  AlertCircle
} from "lucide-react";

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
}

interface ChecklistItem {
  _id: string;
  websiteId: string;
  category: string;
  title: string;
  description: string;
  requiresEvidence: boolean;
  status: "pending" | "in-progress" | "blocked" | "completed";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  return (
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
            {siteHistory.length === 0 && !selectedWebsite ? (
              <p className="text-sm text-muted-foreground text-center py-6">Select a website checklist to view detailed audit feeds.</p>
            ) : (
              <div className="space-y-3">
                {siteHistory.map((log) => (
                  <div
                    key={log._id}
                    className={`p-3 rounded-lg border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isMetallic ? "bg-black/25 border-zinc-800/40" : "bg-muted/30 border-muted"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
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
                    return (
                      <div key={reqItem.key} className={`flex items-center justify-between p-2 rounded-lg border ${
                        isMetallic ? "bg-[#1b1c1d]/50 border-zinc-800" : "bg-muted/30 border-muted"
                      }`}>
                        <span className="text-xs font-semibold text-foreground truncate mr-2">{reqItem.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Current Status Indicator */}
                          <div className="mr-1">
                            {val === "green" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" title="Compliant (Green)" />
                            ) : val === "red" ? (
                              <XCircle className="h-4 w-4 text-red-500" title="Non-Compliant / Missing (Red)" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-muted-foreground" title="Not Checked" />
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
                            onClick={() => handleToggleCoreReq(reqItem.key, "none")}
                            disabled={actionLoading}
                            className={`p-1.5 rounded hover:bg-muted text-muted-foreground flex items-center justify-center`}
                            title="Reset / Close Status"
                          >
                            <span className="text-[10px] font-black leading-none">X</span>
                          </button>
                        </div>
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
                    return (
                      <div key={socialItem.key} className={`flex items-center justify-between p-2 rounded-lg border ${
                        isMetallic ? "bg-[#1b1c1d]/50 border-zinc-800" : "bg-muted/30 border-muted"
                      }`}>
                        <span className="text-xs font-semibold text-foreground truncate mr-2">{socialItem.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="mr-1">
                            {val === "green" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" title="Compliant (Green)" />
                            ) : val === "red" ? (
                              <XCircle className="h-4 w-4 text-red-500" title="Non-Compliant / Missing (Red)" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-muted-foreground" title="Not Checked" />
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
                            onClick={() => handleToggleCoreReq(socialItem.key, "none")}
                            disabled={actionLoading}
                            className={`p-1.5 rounded hover:bg-muted text-muted-foreground flex items-center justify-center`}
                            title="Reset / Close Status"
                          >
                            <span className="text-[10px] font-black leading-none">X</span>
                          </button>
                        </div>
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
                              {items.filter((i) => i.status === "completed").length}/{items.length} Done
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
                                        item.status === "completed"
                                          ? "success"
                                          : item.status === "blocked"
                                          ? "destructive"
                                          : item.status === "in-progress"
                                          ? "warning"
                                          : "outline"
                                      }
                                      className="capitalize text-[10px]"
                                    >
                                      {item.status}
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

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={closeDrawer}
                  className={isMetallic ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700" : ""}
                >
                  Close Panel
                </Button>
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
    </div>
  );
}
